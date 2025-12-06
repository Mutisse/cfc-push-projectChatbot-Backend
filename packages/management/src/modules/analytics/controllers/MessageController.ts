import { Request, Response } from 'express';
import MessageService from '../services/MessageService';

export class MessageController {
  async getMessages(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.query;
      const result = await MessageService.getMessages(userId as string);
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

  async getUnreadMessages(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.query;
      const result = await MessageService.getUnreadMessages(userId as string);
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

  async getUrgentMessages(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await MessageService.getUrgentMessages();
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
      const result = await MessageService.markAsRead(id);
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

  async createMessage(req: Request, res: Response): Promise<Response> {
    try {
      const messageData = req.body;
      const result = await MessageService.createMessage(messageData);
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

  async deleteMessage(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const result = await MessageService.deleteMessage(id);
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
      const result = await MessageService.getUnreadCount(userId as string);
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

export default new MessageController();