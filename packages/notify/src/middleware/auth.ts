import { Request, Response, NextFunction } from 'express';

// Middleware temporário - substitua pela sua lógica real de auth
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Header temporário para desenvolvimento
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Autenticação necessária'
    });
  }

  // Adiciona usuário à request (simulado)
  (req as any).user = { id: userId, role: 'user' };
  
  next();
};

// Middleware para admin apenas
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso restrito a administradores'
    });
  }
  
  next();
};