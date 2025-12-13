// src/middlewares/rateLimitMiddleware.ts
import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";
import config from "../config";

// Configuração do Redis
const redisClient = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

// Helper para sendCommand correta
const createSendCommand = (client: Redis) => {
  return async (...args: string[]): Promise<any> => {
    return client.call(...(args as [string, ...string[]]));
  };
};

// Rate limiter global
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
  skipSuccessfulRequests: false,
  store: new RedisStore({
    sendCommand: createSendCommand(redisClient),
    prefix: "rl:global:",
  }),
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many requests from this IP, please try again later.",
      error: "RATE_LIMIT_EXCEEDED",
      timestamp: new Date().toISOString(),
    });
  },
});

// Rate limiter para API
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // 60 requisições por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many API requests, please try again later.",
  skipSuccessfulRequests: false,
  store: new RedisStore({
    sendCommand: createSendCommand(redisClient),
    prefix: "rl:api:",
  }),
  keyGenerator: (req: Request) => {
    return req.ip + (req.headers["x-api-key"] || "anonymous");
  },
});

// Rate limiter para endpoints de autenticação
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas de login
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts, please try again later.",
  skipSuccessfulRequests: false,
  store: new RedisStore({
    sendCommand: createSendCommand(redisClient),
    prefix: "rl:auth:",
  }),
  skip: (req: Request) => {
    // Não aplicar rate limit para requisições com API key válida
    const apiKey = req.headers["x-api-key"];
    if (apiKey && config.API_KEY.includes(apiKey as string)) {
      return true;
    }
    return false;
  },
});

// Middleware para verificar se Redis está disponível
export const redisHealthCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!config.REDIS_ENABLED) {
    return next();
  }

  try {
    await redisClient.ping();
    next();
  } catch (error) {
    console.error("❌ Redis não disponível:", error);
    res.status(503).json({
      success: false,
      message: "Rate limiting service unavailable",
      error: "SERVICE_UNAVAILABLE",
      timestamp: new Date().toISOString(),
    });
  }
};

// Fechar conexão Redis quando o app for encerrado
process.on("SIGINT", async () => {
  if (config.REDIS_ENABLED) {
    await redisClient.quit();
    console.log("✅ Conexão Redis fechada");
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  if (config.REDIS_ENABLED) {
    await redisClient.quit();
    console.log("✅ Conexão Redis fechada");
  }
  process.exit(0);
});

// Middleware fallback sem Redis
export const memoryRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
  skipSuccessfulRequests: false,
});
