import { Request, Response, NextFunction } from 'express';
import LogService from '../services/LogService';
import { LOG_SOURCE } from '../config/constants';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Interceptar resposta
  res.send = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    // Registrar log da requisição
    LogService.createLog({
      level: res.statusCode >= 400 ? 'error' : 'info',
      message: `${req.method} ${req.path} - ${res.statusCode} (${responseTime}ms)`,
      source: LOG_SOURCE.API,
      metadata: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        query: req.query,
        bodySize: req.body ? JSON.stringify(req.body).length : 0
      }
    }).catch(console.error); // Não bloquear a resposta em caso de erro no log

    return originalSend.call(this, body);
  };

  next();
};

export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  LogService.createLog({
    level: 'error',
    message: `Unhandled error: ${error.message}`,
    source: LOG_SOURCE.API,
    metadata: {
      method: req.method,
      path: req.path,
      error: error.message,
      stack: error.stack,
      body: req.body,
      query: req.query
    }
  }).catch(console.error);

  next(error);
};

export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    // Alertar se response time for muito alto
    if (responseTime > 5000) { // 5 segundos
      LogService.createLog({
        level: 'warn',
        message: `Slow response detected: ${req.method} ${req.path} took ${responseTime}ms`,
        source: LOG_SOURCE.SYSTEM,
        metadata: {
          method: req.method,
          path: req.path,
          responseTime,
          threshold: 5000
        }
      }).catch(console.error);
    }

    return originalSend.call(this, body);
  };

  next();
};