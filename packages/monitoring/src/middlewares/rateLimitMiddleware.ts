import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import config from '../config';

const redisClient = new Redis(config.REDIS_URL || 'redis://localhost:6379');

// Rate limiting para API pública
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:api:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    error: 'RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para autenticação
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:auth:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 tentativas por hora
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString()
  }
});

// Rate limiting para criação de logs
export const logLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:log:'
  }),
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 logs por minuto
  message: {
    success: false,
    message: 'Too many log entries, please slow down',
    error: 'LOG_RATE_LIMIT_EXCEEDED',
    timestamp: new Date().toISOString()
  }
});