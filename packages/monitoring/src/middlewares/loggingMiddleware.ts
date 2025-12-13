// src/middlewares/loggingMiddleware.ts
import { Request, Response, NextFunction } from "express";
import LogService, { CreateLogData } from "../services/LogService";

// Helper para determinar o nível do log baseado no status code
const getLogLevelFromStatusCode = (
  statusCode: number
): "debug" | "info" | "warn" | "error" | "fatal" => {
  if (statusCode >= 500) return "error";
  if (statusCode >= 400) return "warn";
  return "info";
};

// Helper para extrair informações da requisição
const extractRequestInfo = (req: Request) => {
  const ip =
    req.ip ||
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress ||
    "unknown";

  const userAgent = req.get("User-Agent") || "unknown";
  const referer = req.get("Referer") || undefined;

  return { ip, userAgent, referer };
};

// Middleware principal de logging de requisições
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Interceptar resposta
  res.send = function (body: any) {
    const responseTime = Date.now() - startTime;
    const { ip, userAgent, referer } = extractRequestInfo(req);

    // Criar log data usando valores VÁLIDOS do enum LogSource
    const logData: CreateLogData = {
      level: getLogLevelFromStatusCode(res.statusCode),
      source: "monitoring", // ← MUDOU AQUI: de "api" para "monitoring"
      message: `${req.method} ${req.originalUrl} - ${res.statusCode} (${responseTime}ms)`,
      metadata: {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        responseTime,
        ip,
        userAgent,
        referer,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        params: Object.keys(req.params).length > 0 ? req.params : undefined,
        bodySize: req.body ? JSON.stringify(req.body).length : 0,
        responseSize: body
          ? typeof body === "string"
            ? body.length
            : JSON.stringify(body).length
          : 0,
      },
      service: "monitoring-api",
    };

    // Adicionar userId se disponível
    if ((req as any).user?.id) {
      logData.userId = (req as any).user.id;
    }

    // Registrar log (não bloquear resposta)
    LogService.createLog(logData).catch((error: Error) => {
      console.error("❌ Falha ao criar log:", error.message);
      // Fallback para console log
      console.log(`[${logData.level.toUpperCase()}] ${logData.message}`);
    });

    return originalSend.call(this, body);
  };

  next();
};

// Middleware para logging de erros
export const errorLogger = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { ip, userAgent } = extractRequestInfo(req);

  const logData: CreateLogData = {
    level: "error",
    source: "monitoring", // ← MUDOU AQUI: de "api" para "monitoring"
    message: `Unhandled error: ${error.message}`,
    metadata: {
      method: req.method,
      path: req.originalUrl,
      error: error.message,
      stack: error.stack,
      ip,
      userAgent,
      body: req.body,
      query: req.query,
      params: req.params,
    },
    stackTrace: error.stack,
    service: "monitoring-api",
  };

  // Adicionar userId se disponível
  if ((req as any).user?.id) {
    logData.userId = (req as any).user.id;
  }

  // Registrar erro
  LogService.createLog(logData).catch((logError: Error) => {
    console.error("❌ Falha ao logar erro:", logError.message);
    // Fallback para console error
    console.error("Original error:", error.message);
    console.error("Stack:", error.stack);
  });

  next(error);
};

// Middleware para monitoramento de performance
export const performanceMonitor = (thresholdMs: number = 5000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function (body: any) {
      const responseTime = Date.now() - startTime;

      // Alertar se response time for muito alto
      if (responseTime > thresholdMs) {
        const { ip, userAgent } = extractRequestInfo(req);

        const logData: CreateLogData = {
          level: "warn",
          source: "monitoring", // ← MUDOU AQUI: de "api" para "monitoring"
          message: `Slow response detected: ${req.method} ${req.originalUrl} took ${responseTime}ms`,
          metadata: {
            method: req.method,
            path: req.originalUrl,
            responseTime,
            threshold: thresholdMs,
            ip,
            userAgent,
            statusCode: res.statusCode,
          },
          service: "monitoring-api",
        };

        LogService.createLog(logData).catch((error: Error) => {
          console.error("❌ Falha ao logar performance:", error.message);
          console.warn(`⚠️ Slow response: ${logData.message}`);
        });
      }

      return originalSend.call(this, body);
    };

    next();
  };
};

// Middleware para logging de segurança
export const securityLogger = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { ip, userAgent } = extractRequestInfo(req);

    // Verificar por padrões suspeitos
    const suspiciousPatterns = [
      "/admin",
      "/api",
      "/login",
      "/auth",
      ".env",
      "config",
      "password",
      "secret",
      "token",
    ];

    const isSuspiciousPath = suspiciousPatterns.some((pattern) =>
      req.originalUrl.toLowerCase().includes(pattern.toLowerCase())
    );

    if (isSuspiciousPath) {
      const suspiciousHeaders = [
        "x-forwarded-for",
        "x-real-ip",
        "cf-connecting-ip",
      ];
      const suspiciousIPs = suspiciousHeaders
        .map((header) => req.headers[header])
        .filter(Boolean);

      if (
        suspiciousIPs.length > 0 ||
        req.method === "POST" ||
        req.method === "PUT"
      ) {
        const logData: CreateLogData = {
          level: "warn",
          source: "monitoring", // ← MUDOU AQUI: de "api" para "monitoring"
          message: `Suspicious access detected: ${req.method} ${req.originalUrl}`,
          metadata: {
            method: req.method,
            path: req.originalUrl,
            ip,
            suspiciousIPs,
            userAgent,
            headers: {
              "x-forwarded-for": req.headers["x-forwarded-for"],
              "x-real-ip": req.headers["x-real-ip"],
              "user-agent": userAgent,
            },
            bodyKeys: req.body ? Object.keys(req.body) : [],
            queryKeys: Object.keys(req.query),
          },
          service: "monitoring-api",
        };

        LogService.createLog(logData).catch((error: Error) => {
          console.error("❌ Falha ao logar segurança:", error.message);
          console.warn(`⚠️ Suspicious access: ${logData.message}`);
        });
      }
    }

    next();
  };
};

// Exportar todos os middlewares
export const loggingMiddleware = [
  requestLogger,
  performanceMonitor(5000),
  securityLogger(),
];

// Exportar como objeto
export default {
  requestLogger,
  errorLogger,
  performanceMonitor,
  securityLogger,
  loggingMiddleware,
};
