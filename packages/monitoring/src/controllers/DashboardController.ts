import { Request, Response } from 'express';
import DashboardService from '../services/DashboardService';

export class DashboardController {
  async getDashboardData(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await DashboardService.getDashboardData();
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

  async getServicesHealth(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await DashboardService.getServicesHealth();
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

  async getRecentAlerts(req: Request, res: Response): Promise<Response> {
    try {
      const { limit = '20' } = req.query;
      const result = await DashboardService.getRecentAlerts(parseInt(limit as string));
      
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

  async getSystemStatus(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await DashboardService.getSystemStatus();
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

  async getPerformanceMetrics(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await DashboardService.getPerformanceMetrics();
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

  async getDailyStats(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await DashboardService.getDailyStats();
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

  async getHistoricalMetrics(req: Request, res: Response): Promise<Response> {
    try {
      const { serviceName, metric = 'requests', timeRange = '24h' } = req.query;
      
      if (!serviceName) {
        return res.status(400).json({
          success: false,
          message: 'serviceName is required',
          timestamp: new Date().toISOString()
        });
      }

      const result = await DashboardService.getHistoricalMetrics(
        serviceName as string,
        metric as string,
        timeRange as string
      );
      
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

export default new DashboardController();