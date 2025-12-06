import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    service: 'chatbot' | 'management' | 'monitoring' | 'notify';
  };
}

export class AuthMiddleware {
  // Middleware para autenticação entre serviços internos
  static serviceAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
      
      if (!apiKey) {
        res.status(401).json({ error: 'API Key necessária' });
        return;
      }
      
      // Verificar chaves pré-definidas (em produção, usar variáveis de ambiente)
      const validKeys = {
        chatbot: process.env.CHATBOT_API_KEY || 'chatbot-secret-key',
        management: process.env.MANAGEMENT_API_KEY || 'management-secret-key',
        monitoring: process.env.MONITORING_API_KEY || 'monitoring-secret-key',
        notify: process.env.NOTIFY_API_KEY || 'notify-secret-key'
      };
      
      // Encontrar qual serviço está tentando acessar
      let authenticatedService: keyof typeof validKeys | null = null;
      
      for (const [service, key] of Object.entries(validKeys)) {
        if (apiKey === key || apiKey === `Bearer ${key}`) {
          authenticatedService = service as keyof typeof validKeys;
          break;
        }
      }
      
      if (!authenticatedService) {
        res.status(403).json({ error: 'API Key inválida' });
        return;
      }
      
      // Adicionar informações do serviço autenticado à requisição
      req.user = {
        id: `service_${authenticatedService}`,
        role: 'service',
        service: authenticatedService
      };
      
      console.log(`[AUTH] Serviço autenticado: ${authenticatedService}`);
      next();
      
    } catch (error) {
      console.error('❌ Erro de autenticação:', error);
      res.status(500).json({ error: 'Erro interno de autenticação' });
    }
  }
  
  // Middleware para rotas públicas (apenas logging)
  static publicRoute(req: Request, res: Response, next: NextFunction): void {
    console.log(`[PUBLIC] ${req.method} ${req.path} - ${req.ip}`);
    next();
  }
  
  // Middleware para rotas administrativas
  static adminOnly(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Acesso administrativo necessário' });
      return;
    }
    next();
  }
}