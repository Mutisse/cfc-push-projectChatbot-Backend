import { Request, Response } from 'express';
import AnalysisService from '../services/AnalysisService';

export class AnalysisController {
  async getAnalysisData(req: Request, res: Response): Promise<Response> {
    try {
      const { period = '24h', metric = 'all', service, startDate, endDate } = req.query;
      
      const filters = {
        period: period as '24h' | '7d' | '30d',
        metric: metric as string,
        service: service as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const result = await AnalysisService.getAnalysisData(filters);
      
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

  async generateInsights(req: Request, res: Response): Promise<Response> {
    try {
      const { period = '24h', metric = 'all', service, startDate, endDate } = req.query;
      
      const filters = {
        period: period as '24h' | '7d' | '30d',
        metric: metric as string,
        service: service as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const result = await AnalysisService.generateInsights(filters);
      
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

  async exportAnalysisReport(req: Request, res: Response): Promise<Response> {
    try {
      const { period = '24h', format = 'pdf' } = req.query;
      
      const result = await AnalysisService.exportAnalysisReport(
        period as string,
        format as 'pdf' | 'csv' | 'json'
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

  async updateAnalysisSettings(req: Request, res: Response): Promise<Response> {
    try {
      const settings = req.body;
      const result = await AnalysisService.updateAnalysisSettings(settings);
      
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

  async executeInsightAction(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const result = await AnalysisService.executeInsightAction(parseInt(id));
      
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

  async getChartData(req: Request, res: Response): Promise<Response> {
    try {
      const { metric, period = '24h', service } = req.query;
      
      if (!metric) {
        return res.status(400).json({
          success: false,
          message: 'metric is required',
          timestamp: new Date().toISOString()
        });
      }

      const result = await AnalysisService.getChartData(
        metric as string,
        period as string,
        service as string | undefined
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

  async getHeatmapData(req: Request, res: Response): Promise<Response> {
    try {
      const { period = '7d' } = req.query;
      const result = await AnalysisService.getHeatmapData(period as string);
      
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

  async getComparisonData(req: Request, res: Response): Promise<Response> {
    try {
      const { metric, period = '24h' } = req.query;
      
      if (!metric) {
        return res.status(400).json({
          success: false,
          message: 'metric is required',
          timestamp: new Date().toISOString()
        });
      }

      const result = await AnalysisService.getComparisonData(
        metric as string,
        period as string
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

export default new AnalysisController();