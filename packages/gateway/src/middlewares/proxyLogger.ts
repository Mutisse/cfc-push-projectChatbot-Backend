import { Request, Response, NextFunction } from 'express';
import { GatewayLogger } from '../utils/logger';

export const proxyLogger = (serviceName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    console.log(`[GATEWAY] ${req.method} ${req.originalUrl} → ${serviceName}`);
    
    // Interceptar a resposta
    const originalSend = res.send;
    const originalJson = res.json;
    const originalStatus = res.status;
    
    let responseSent = false;
    let responseBody: any;
    let statusCode = res.statusCode;
    
    // Sobrescrever res.status()
    res.status = function(code: number) {
      statusCode = code;
      return originalStatus.call(this, code);
    };
    
    // Sobrescrever res.send()
    res.send = function(body?: any) {
      if (!responseSent) {
        responseSent = true;
        responseBody = body;
        
        const duration = Date.now() - startTime;
        const status = statusCode >= 200 && statusCode < 400 ? 'success' : 'failed';
        
        // USAR O GATEWAYLOGGER AQUI
        GatewayLogger.logProxyRequest(req, serviceName, duration, status);
        
        console.log(`[GATEWAY] ${serviceName} → ${req.method} ${req.path} - ${statusCode} (${duration}ms)`);
      }
      
      return originalSend.call(this, body);
    };
    
    // Sobrescrever res.json()
    res.json = function(body: any) {
      if (!responseSent) {
        responseSent = true;
        responseBody = body;
        
        const duration = Date.now() - startTime;
        const status = statusCode >= 200 && statusCode < 400 ? 'success' : 'failed';
        
        // USAR O GATEWAYLOGGER AQUI
        GatewayLogger.logProxyRequest(req, serviceName, duration, status);
        
        console.log(`[GATEWAY] ${serviceName} → ${req.method} ${req.path} - ${statusCode} (${duration}ms)`);
      }
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};