// src/modules/analytics/controllers/DashboardController.ts
import { Request, Response } from 'express';
import DashboardService from '../services/DashboardService';

export class DashboardController {
  async getDashboardMetrics(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await DashboardService.getDashboardMetrics();
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

  async getBusinessDashboard(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await DashboardService.getBusinessDashboard();
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

  async getRecentActivities(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await DashboardService.getRecentActivities();
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

  async getQuickActions(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await DashboardService.getQuickActions();
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

  async getDashboardData(_req: Request, res: Response): Promise<Response> {
    try {
      const [metricsResult, businessResult, activitiesResult, actionsResult] = await Promise.all([
        DashboardService.getDashboardMetrics(),
        DashboardService.getBusinessDashboard(),
        DashboardService.getRecentActivities(),
        DashboardService.getQuickActions()
      ]);

      return res.status(200).json({
        success: true,
        message: 'Complete dashboard data retrieved successfully',
        data: {
          metrics: metricsResult.success ? metricsResult.data : [],
          business: businessResult.success ? businessResult.data : null,
          activities: activitiesResult.success ? activitiesResult.data : [],
          actions: actionsResult.success ? actionsResult.data : []
        },
        timestamp: new Date().toISOString()
      });
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