import { Request, Response, NextFunction } from 'express';
import config from '../config/app.config';

/**
 * Middleware para validar IPs permitidos apenas em produção
 */
export const ipWhitelistMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (config.NODE_ENV === 'production') {
    const clientIp = req.ip || req.socket.remoteAddress || '';
    
    // Verificar se o IP está na lista de permitidos
    const isAllowed = config.ALLOWED_IPS.some(allowedIp => {
      if (allowedIp === clientIp) return true;
      // Suporte para CIDR (ex: 192.168.1.0/24)
      if (allowedIp.includes('/')) {
        // Implementação básica de validação CIDR
        const [network] = allowedIp.split('/');
        // Implementação simplificada
        return clientIp.startsWith(network);
      }
      return false;
    });

    if (!isAllowed) {
      console.warn(`🚨 Acesso bloqueado de IP não autorizado: ${clientIp}`);
      res.status(403).json({
        error: 'Access Denied',
        message: 'Your IP address is not authorized to access this resource',
        timestamp: new Date().toISOString(),
        ip: clientIp
      });
      return;
    }
  }
  
  next();
};

/**
 * Middleware para desabilitar endpoints específicos em produção
 */
export const productionGuardMiddleware = (endpoints: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (config.NODE_ENV === 'production') {
      const path = req.path;
      
      if (endpoints.some(endpoint => path.startsWith(endpoint))) {
        res.status(403).json({
          error: 'Endpoint Disabled',
          message: 'This endpoint is disabled in production environment',
          timestamp: new Date().toISOString()
        });
        return;
      }
    }
    
    next();
  };
};

/**
 * Middleware de rate limiting básico
 */
export const rateLimitMiddleware = () => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
  const MAX_REQUESTS = 100; // 100 requests por IP por janela

  return (req: Request, res: Response, next: NextFunction): void => {
    if (config.NODE_ENV !== 'production') {
      next(); // Desabilitar em desenvolvimento
      return;
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!requests.has(clientIp)) {
      requests.set(clientIp, { count: 1, resetTime: now + WINDOW_MS });
      next();
      return;
    }

    const userRequests = requests.get(clientIp)!;

    if (now > userRequests.resetTime) {
      // Resetar contador
      userRequests.count = 1;
      userRequests.resetTime = now + WINDOW_MS;
      requests.set(clientIp, userRequests);
      next();
      return;
    }

    if (userRequests.count >= MAX_REQUESTS) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'You have exceeded the request limit. Please try again later.',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
      return;
    }

    userRequests.count++;
    requests.set(clientIp, userRequests);
    next();
  };
};