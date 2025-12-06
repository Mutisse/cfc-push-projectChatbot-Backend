import { Request, Response } from 'express';
import LogService from '../services/LogService';

export class LogController {
  async getSystemLogs(req: Request, res: Response): Promise<Response> {
    try {
      const {
        level,
        source,
        service,
        search,
        startDate,
        endDate,
        page = '1',
        limit = '10'
      } = req.query;

      const filters = {
        level: level as string,
        source: source as string,
        service: service as string,
        search: search as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      };

      const result = await LogService.getSystemLogs(
        parseInt(page as string),
        parseInt(limit as string),
        filters
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

  async getLogsStats(req: Request, res: Response): Promise<Response> {
    try {
      const { startDate, endDate } = req.query;
      
      const result = await LogService.getLogsStats(
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

  async getRecentLogs(req: Request, res: Response): Promise<Response> {
    try {
      const { limit = '50' } = req.query;
      const result = await LogService.getRecentLogs(parseInt(limit as string));
      
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

  async getErrorLogs(req: Request, res: Response): Promise<Response> {
    try {
      const { limit = '100' } = req.query;
      const result = await LogService.getErrorLogs(parseInt(limit as string));
      
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

  async searchLogs(req: Request, res: Response): Promise<Response> {
    try {
      const { q, fields, limit = '100' } = req.query;
      
      if (!q || (q as string).trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
          timestamp: new Date().toISOString()
        });
      }

      const fieldArray = fields 
        ? (fields as string).split(',')
        : ['message', 'stackTrace'];

      const result = await LogService.searchLogs(
        q as string,
        fieldArray,
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

  async exportLogs(req: Request, res: Response): Promise<Response> {
    try {
      const { 
        format = 'json',
        startDate,
        endDate,
        includeMetadata,
        includeStackTrace
      } = req.query;

      const options = {
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        includeMetadata: includeMetadata === 'true',
        includeStackTrace: includeStackTrace === 'true'
      };

      const result = await LogService.exportLogs(
        format as 'json' | 'csv' | 'text',
        options
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

  async getErrorTrend(req: Request, res: Response): Promise<Response> {
    try {
      const { days = '7' } = req.query;
      const result = await LogService.getErrorTrend(parseInt(days as string));
      
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

  async getLogById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const result = await LogService.getLogById(id);
      
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

  async getLogsByService(req: Request, res: Response): Promise<Response> {
    try {
      const { serviceId } = req.params;
      const result = await LogService.getLogsByService(serviceId);
      
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

  async createLog(req: Request, res: Response): Promise<Response> {
    try {
      const logData = req.body;
      const result = await LogService.createLog(logData);
      
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

  async createBatchLogs(req: Request, res: Response): Promise<Response> {
    try {
      const logsData = req.body;
      
      if (!Array.isArray(logsData) || logsData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'logsData array is required',
          timestamp: new Date().toISOString()
        });
      }

      const result = await LogService.createBatchLogs(logsData);
      
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

  async rotateLogs(req: Request, res: Response): Promise<Response> {
    try {
      const { daysToKeep = '30' } = req.query;
      const result = await LogService.rotateLogs(parseInt(daysToKeep as string));
      
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

  async getRealtimeLogs(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await LogService.getRealtimeLogs();
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

export default new LogController();