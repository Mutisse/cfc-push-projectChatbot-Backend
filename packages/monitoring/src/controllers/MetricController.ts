import { Request, Response } from 'express';
import MetricService from '../services/MetricService';

export class MetricController {
  async getMetrics(req: Request, res: Response): Promise<Response> {
    try {
      const {
        service,
        name,
        startDate,
        endDate,
        page = '1',
        limit = '10'
      } = req.query;

      const filters = {
        service: service as string,
        name: name as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const result = await MetricService.getMetrics(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
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

  async createMetric(req: Request, res: Response): Promise<Response> {
    try {
      const metricData = req.body;
      const result = await MetricService.createMetric(metricData);
      
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

  async createBatchMetrics(req: Request, res: Response): Promise<Response> {
    try {
      const metricsData = req.body;
      
      if (!Array.isArray(metricsData) || metricsData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'metricsData array is required',
          timestamp: new Date().toISOString()
        });
      }

      const result = await MetricService.createBatchMetrics(metricsData);
      
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

  async getRealtimeMetrics(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await MetricService.getRealtimeMetrics();
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

  async getRequestsData(req: Request, res: Response): Promise<Response> {
    try {
      const { timeRange = '24h', startDate, endDate } = req.query;
      
      const result = await MetricService.getRequestsData(
        timeRange as string,
        startDate as string | undefined,
        endDate as string | undefined
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

  async getPerformanceMetrics(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await MetricService.getPerformanceMetrics();
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

  async getHttpMethodDistribution(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await MetricService.getHttpMethodDistribution();
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

  async getStatusCodeDistribution(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await MetricService.getStatusCodeDistribution();
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

  async getServiceMetrics(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await MetricService.getServiceMetrics();
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

  async getSystemResourceMetrics(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await MetricService.getSystemResourceMetrics();
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

  async getTrendAnalysis(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await MetricService.getTrendAnalysis();
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

  async exportMetrics(req: Request, res: Response): Promise<Response> {
    try {
      const { format = 'csv', dataType = 'all' } = req.query;
      
      const result = await MetricService.exportMetrics(
        format as 'csv' | 'json' | 'pdf',
        dataType as 'all' | 'performance' | 'distribution' | 'services'
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

  async compareServices(req: Request, res: Response): Promise<Response> {
    try {
      const { services, metrics } = req.body;
      
      if (!Array.isArray(services) || services.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'services array is required',
          timestamp: new Date().toISOString()
        });
      }

      if (!Array.isArray(metrics) || metrics.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'metrics array is required',
          timestamp: new Date().toISOString()
        });
      }

      const result = await MetricService.compareServices(services, metrics);
      
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

export default new MetricController();