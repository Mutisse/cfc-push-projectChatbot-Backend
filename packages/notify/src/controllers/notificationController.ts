import { Request, Response } from 'express';
import notificationService from '../services/notificationService';
import { CreateNotificationDto } from '../dtos/createNotification.dto';
import { AuthenticatedRequest, AppError } from '../types';

// Helper function para lidar com errors de forma segura
const handleError = (error: unknown): AppError => {
  if (error instanceof Error) {
    return error as AppError;
  }
  return new Error('Unknown error occurred') as AppError;
};

export class NotificationController {
  
  // GET /notifications - Listar notificações do usuário
  async getUserNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id || (req.query.userId as string);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID do usuário é obrigatório'
        });
      }

      const result = await notificationService.getUserNotifications(userId, page, limit);
      
      res.json({
        success: true,
        data: result.notifications,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit)
        }
      });
    } catch (error: unknown) {
      const safeError = handleError(error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar notificações',
        error: safeError.message
      });
    }
  }

  // POST /notifications - Criar notificação manual
  async createNotification(req: Request, res: Response) {
    try {
      const notificationData = new CreateNotificationDto(req.body);
      const errors = notificationData.validate();

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors
        });
      }

      const notification = await notificationService.createNotification(notificationData);
      
      res.status(201).json({
        success: true,
        message: 'Notificação criada com sucesso',
        data: notification
      });
    } catch (error: unknown) {
      const safeError = handleError(error);
      res.status(400).json({
        success: false,
        message: 'Erro ao criar notificação',
        error: safeError.message
      });
    }
  }

  // GET /notifications/:id - Buscar notificação específica
  async getNotificationById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as AuthenticatedRequest).user?.id;

      const notification = await notificationService.getNotificationById(id);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notificação não encontrada'
        });
      }

      // Verificar se o usuário tem permissão para ver esta notificação
      const recipient = notification.recipient;
      const hasPermission = 
        recipient === userId ||
        (Array.isArray(recipient) && recipient.includes(userId!)) ||
        recipient === 'all_admins' || 
        recipient === 'all_members';

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Acesso não autorizado a esta notificação'
        });
      }

      res.json({
        success: true,
        data: notification
      });
    } catch (error: unknown) {
      const safeError = handleError(error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar notificação',
        error: safeError.message
      });
    }
  }

  // PATCH /notifications/:id/read - Marcar como lida
  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const notification = await notificationService.markAsRead(id, userId);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notificação não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Notificação marcada como lida',
        data: notification
      });
    } catch (error: unknown) {
      const safeError = handleError(error);
      res.status(500).json({
        success: false,
        message: 'Erro ao marcar notificação como lida',
        error: safeError.message
      });
    }
  }

  // PATCH /notifications/read-all - Marcar todas como lidas
  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const result = await notificationService.markAllAsRead(userId);
      
      res.json({
        success: true,
        message: `${result.modifiedCount} notificações marcadas como lidas`,
        data: result
      });
    } catch (error: unknown) {
      const safeError = handleError(error);
      res.status(500).json({
        success: false,
        message: 'Erro ao marcar notificações como lidas',
        error: safeError.message
      });
    }
  }

  // GET /notifications/stats - Estatísticas
  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      const stats = await notificationService.getNotificationStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: unknown) {
      const safeError = handleError(error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatísticas',
        error: safeError.message
      });
    }
  }

  // GET /notifications/unread/count - Contador de não lidas
  async getUnreadCount(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const count = await notificationService.getUnreadCount(userId);
      
      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error: unknown) {
      const safeError = handleError(error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar contador',
        error: safeError.message
      });
    }
  }

  // POST /notifications/send-pending - Forçar envio de pendentes (admin)
  async sendPendingNotifications(req: Request, res: Response) {
    try {
      const result = await notificationService.sendPendingNotifications();
      
      res.json({
        success: true,
        message: 'Processamento de notificações pendentes concluído',
        data: result
      });
    } catch (error: unknown) {
      const safeError = handleError(error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar notificações pendentes',
        error: safeError.message
      });
    }
  }

  // DELETE /notifications/:id - Deletar notificação (admin)
  async deleteNotification(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const notification = await notificationService.deleteNotification(id);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notificação não encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Notificação deletada com sucesso',
        data: notification
      });
    } catch (error: unknown) {
      const safeError = handleError(error);
      res.status(500).json({
        success: false,
        message: 'Erro ao deletar notificação',
        error: safeError.message
      });
    }
  }

  // GET /notifications/types - Listar tipos de notificação disponíveis
  async getNotificationTypes(req: Request, res: Response) {
    try {
      const types = await notificationService.getAvailableNotificationTypes();
      
      res.json({
        success: true,
        data: types
      });
    } catch (error: unknown) {
      const safeError = handleError(error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar tipos de notificação',
        error: safeError.message
      });
    }
  }
}

export default new NotificationController();