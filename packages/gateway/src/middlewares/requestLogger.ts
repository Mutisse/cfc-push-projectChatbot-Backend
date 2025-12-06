import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Ignora logging para health checks
  if (req.path === '/health') {
    next();
    return;
  }
  
  res.on('finish', async () => {
    const duration = Date.now() - start;
    
    try {
      await AuditLog.create({
        action: 'HTTP_REQUEST',
        service: 'gateway',
        details: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          query: Object.keys(req.query).length > 0 ? req.query : undefined,
          hasBody: !!req.body && Object.keys(req.body).length > 0
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      console.log(`🌐 ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
      
    } catch (error) {
      // Fail silently para não quebrar a aplicação
      console.log(`🌐 ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms (log falhou)`);
    }
  });
  
  next();
};

// Logger simplificado para desenvolvimento
export const devLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};