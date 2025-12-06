import { Request, Response } from 'express';
import NotificationService from '../services/NotificationService';

export class NotificationController {
  async getNotifications(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.query;
      const result = await NotificationService.getNotifications(userId as string);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  async getUnreadNotifications(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.query;
      const result = await NotificationService.getUnreadNotifications(userId as string);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const result = await NotificationService.markAsRead(id);
      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.body;
      const result = await NotificationService.markAllAsRead(userId);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  async createNotification(req: Request, res: Response): Promise<Response> {
    try {
      const notificationData = req.body;
      const result = await NotificationService.createNotification(notificationData);
      return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const result = await NotificationService.deleteNotification(id);
      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  async getUnreadCount(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.query;
      const result = await NotificationService.getUnreadCount(userId as string);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default new NotificationController();