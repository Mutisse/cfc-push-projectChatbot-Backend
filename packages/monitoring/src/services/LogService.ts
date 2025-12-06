import { LogRepository, LogFilters } from '../repositories/LogRepository';

export interface LogServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export class LogService {
  private logRepository: LogRepository;

  constructor() {
    this.logRepository = new LogRepository();
  }

  async getSystemLogs(
    page: number = 1,
    limit: number = 10,
    filters?: LogFilters
  ): Promise<LogServiceResponse> {
    try {
      const { logs, total } = await this.logRepository.findAll(filters || {}, page, limit);
      
      return {
        success: true,
        message: 'System logs retrieved successfully',
        data: {
          logs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve system logs',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getLogsStats(
    startDate?: string,
    endDate?: string
  ): Promise<LogServiceResponse> {
    try {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      const stats = await this.logRepository.getStats(start, end);
      
      return {
        success: true,
        message: 'Logs stats retrieved successfully',
        data: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve logs stats',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getRecentLogs(limit: number = 50): Promise<LogServiceResponse> {
    try {
      const logs = await this.logRepository.getRecentLogs(limit);
      
      return {
        success: true,
        message: 'Recent logs retrieved successfully',
        data: logs,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve recent logs',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getErrorLogs(limit: number = 100): Promise<LogServiceResponse> {
    try {
      const logs = await this.logRepository.getErrorLogs(limit);
      
      return {
        success: true,
        message: 'Error logs retrieved successfully',
        data: logs,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve error logs',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async searchLogs(
    searchTerm: string,
    fields: string[] = ['message', 'stackTrace'],
    limit: number = 100
  ): Promise<LogServiceResponse> {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        return {
          success: false,
          message: 'Search term is required',
          timestamp: new Date().toISOString()
        };
      }

      const logs = await this.logRepository.searchLogs(searchTerm, fields, limit);
      
      return {
        success: true,
        message: 'Logs search completed successfully',
        data: logs,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to search logs',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async exportLogs(
    format: 'json' | 'csv' | 'text',
    options?: {
      startDate?: string;
      endDate?: string;
      includeMetadata?: boolean;
      includeStackTrace?: boolean;
    }
  ): Promise<LogServiceResponse> {
    try {
      const filters: LogFilters = {};
      
      if (options?.startDate) filters.startDate = new Date(options.startDate);
      if (options?.endDate) filters.endDate = new Date(options.endDate);

      const logs = await this.logRepository.exportLogs(format, filters);
      
      // Format logs based on options
      const formattedLogs = logs.map(log => {
        const baseLog: any = {
          timestamp: log.timestamp,
          level: log.level,
          message: log.message,
          source: log.source,
          service: log.service
        };

        if (options?.includeMetadata && log.metadata) {
          baseLog.metadata = log.metadata;
        }

        if (options?.includeStackTrace && log.stackTrace) {
          baseLog.stackTrace = log.stackTrace;
        }

        if (log.userId) baseLog.userId = log.userId;
        if (log.ipAddress) baseLog.ipAddress = log.ipAddress;
        if (log.endpoint) baseLog.endpoint = log.endpoint;

        return baseLog;
      });

      return {
        success: true,
        message: 'Logs exported successfully',
        data: {
          format,
          count: formattedLogs.length,
          logs: formattedLogs
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to export logs',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getErrorTrend(days: number = 7): Promise<LogServiceResponse> {
    try {
      const trend = await this.logRepository.getErrorTrend(days);
      
      return {
        success: true,
        message: 'Error trend retrieved successfully',
        data: trend,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve error trend',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getLogById(id: string): Promise<LogServiceResponse> {
    try {
      const log = await this.logRepository.findById(id);
      
      if (!log) {
        return {
          success: false,
          message: 'Log not found',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        message: 'Log retrieved successfully',
        data: log,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve log',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getLogsByService(serviceId: string): Promise<LogServiceResponse> {
    try {
      const logs = await this.logRepository.getLogsByService(serviceId);
      
      return {
        success: true,
        message: 'Service logs retrieved successfully',
        data: logs,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve service logs',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async createLog(logData: any): Promise<LogServiceResponse> {
    try {
      const log = await this.logRepository.create(logData);
      
      return {
        success: true,
        message: 'Log created successfully',
        data: log,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create log',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async createBatchLogs(logsData: any[]): Promise<LogServiceResponse> {
    try {
      const logs = await this.logRepository.createBatch(logsData);
      
      return {
        success: true,
        message: 'Batch logs created successfully',
        data: logs,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create batch logs',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async rotateLogs(daysToKeep: number = 30): Promise<LogServiceResponse> {
    try {
      const deletedCount = await this.logRepository.rotateLogs(daysToKeep);
      
      return {
        success: true,
        message: 'Logs rotated successfully',
        data: { deletedCount },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to rotate logs',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async performLogMaintenance(): Promise<void> {
    try {
      const deletedCount = await this.logRepository.rotateLogs(30);
      console.log(`Cleaned up ${deletedCount} old logs`);
    } catch (error) {
      console.error('Failed to perform log maintenance:', error);
    }
  }

  async getRealtimeLogs(): Promise<LogServiceResponse> {
    try {
      // Mock realtime logs (in real app, would use WebSocket/SSE)
      const sources = ['gateway', 'notify', 'chatbot', 'management', 'monitoring', 'system'];
      const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
      
      const mockLogs = Array.from({ length: 10 }, (_, i) => ({
        id: `realtime_${Date.now()}_${i}`,
        timestamp: new Date(Date.now() - i * 60000), // Last 10 minutes
        level: levels[Math.floor(Math.random() * levels.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        message: `Realtime log message ${i + 1}`,
        metadata: {
          userId: Math.random() > 0.5 ? `user_${Math.floor(Math.random() * 100)}` : undefined,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`
        }
      }));

      return {
        success: true,
        message: 'Realtime logs retrieved successfully',
        data: mockLogs,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve realtime logs',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export default new LogService();