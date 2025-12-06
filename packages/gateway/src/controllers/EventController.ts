import { Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService';

export class EventController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async handleEvent(req: Request, res: Response): Promise<void> {
    try {
      const { service, event, data } = req.body;

      console.log(`[GATEWAY] Evento de ${service}: ${event}`);

      // Processar evento
      const result = await this.notificationService.processEvent(service, event, data);

      res.json({
        success: true,
        message: 'Evento processado',
        ...result
      });

    } catch (error: any) {
      console.error('[GATEWAY] Erro ao processar evento:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getServicesStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.notificationService.checkServicesStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao verificar status' });
    }
  }

  async getPendingNotifications(req: Request, res: Response): Promise<void> {
    try {
      const pending = await this.notificationService.getPendingNotifications();
      res.json(pending);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar pendentes' });
    }
  }
}