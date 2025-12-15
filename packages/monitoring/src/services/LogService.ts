// src/services/LogService.ts - ATUALIZAÇÃO
import { LogRepository, LogFilters } from "../repositories/LogRepository";
import { ILog, LogLevel, LogSource } from "../models/LogModel";

// Interfaces para tipagem forte (manter igual)
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  source: LogSource;
  message: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
  userId?: string;
  ipAddress?: string;
  endpoint?: string;
  service?: string;
  duration?: number;
  statusCode?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LogStats {
  total: number;
  byLevel: Record<string, number>;
  bySource: Record<string, number>;
  byService: Record<string, number>;
  errorRate: number;
}

export interface LogServiceResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ExportLogData {
  format: "json" | "csv" | "text";
  count: number;
  logs: Record<string, unknown>[];
}

export interface CreateLogData {
  level: LogLevel;
  source: LogSource;
  message: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
  userId?: string;
  ipAddress?: string;
  endpoint?: string;
  service?: string;
}

export interface ErrorTrend {
  dates: string[];
  counts: number[];
  byLevel: Record<LogLevel, number[]>;
  bySource: Record<LogSource, number[]>;
  averageDaily: number;
}

// Interface para filtros do serviço (aceita strings genéricas)
export interface ServiceLogFilters {
  level?: string; // Aceita string genérica
  source?: string; // Aceita string genérica
  service?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  ipAddress?: string;
  endpoint?: string;
}

export class LogService {
  private logRepository: LogRepository;

  constructor() {
    this.logRepository = new LogRepository();
  }

  // Helper para validar e converter Level
  private validateLevel(level: string): LogLevel | undefined {
    const validLevels: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];
    if (validLevels.includes(level as LogLevel)) {
      return level as LogLevel;
    }
    return undefined;
  }

  // Helper para validar e converter Source
  private validateSource(source: string): LogSource | undefined {
    const validSources: LogSource[] = [
      "gateway",
      "notify",
      "chatbot",
      "management",
      "monitoring",
      "system",
      "proxy",
      "performance-monitor",
    ];
    if (validSources.includes(source as LogSource)) {
      return source as LogSource;
    }
    return undefined;
  }

  // Helper para converter ServiceLogFilters para LogFilters
  private convertToRepositoryFilters(filters: ServiceLogFilters): LogFilters {
    const repoFilters: LogFilters = {};

    if (filters.level) {
      const validLevel = this.validateLevel(filters.level);
      if (validLevel) {
        repoFilters.level = validLevel;
      }
    }

    if (filters.source) {
      const validSource = this.validateSource(filters.source);
      if (validSource) {
        repoFilters.source = validSource;
      }
    }

    if (filters.service) repoFilters.service = filters.service;
    if (filters.search) repoFilters.search = filters.search;
    if (filters.startDate) repoFilters.startDate = filters.startDate;
    if (filters.endDate) repoFilters.endDate = filters.endDate;
    if (filters.userId) repoFilters.userId = filters.userId;
    if (filters.ipAddress) repoFilters.ipAddress = filters.ipAddress;
    if (filters.endpoint) repoFilters.endpoint = filters.endpoint;

    return repoFilters;
  }

  // Helper para converter ILog para LogEntry
  private convertToLogEntry(log: ILog): LogEntry {
    return {
      id: log._id?.toString() || log.id || "",
      timestamp: log.timestamp,
      level: log.level as LogLevel,
      source: log.source as LogSource,
      message: log.message,
      metadata: log.metadata,
      stackTrace: log.stackTrace,
      userId: log.userId,
      ipAddress: log.ipAddress,
      endpoint: log.endpoint,
      service: log.service,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    };
  }

  private convertLogArray(logs: ILog[]): LogEntry[] {
    return logs.map((log) => this.convertToLogEntry(log));
  }

  // ========== GET METHODS ATUALIZADOS ==========

  async getSystemLogs(
    page: number = 1,
    limit: number = 10,
    filters?: ServiceLogFilters // Mudar para ServiceLogFilters
  ): Promise<
    LogServiceResponse<{ logs: LogEntry[]; pagination: LogPagination }>
  > {
    try {
      // Converter filtros para o formato do repositório
      const repoFilters = this.convertToRepositoryFilters(filters || {});

      const { logs, total } = await this.logRepository.findAll(
        repoFilters,
        page,
        limit
      );

      const convertedLogs = this.convertLogArray(logs);

      return {
        success: true,
        message: "System logs retrieved successfully",
        data: {
          logs: convertedLogs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to retrieve system logs",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getLogsStats(
    startDate?: string,
    endDate?: string
  ): Promise<LogServiceResponse<LogStats>> {
    try {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      const stats = await this.logRepository.getStats(start, end);

      return {
        success: true,
        message: "Logs stats retrieved successfully",
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to retrieve logs stats",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getRecentLogs(
    limit: number = 50
  ): Promise<LogServiceResponse<LogEntry[]>> {
    try {
      const logs = await this.logRepository.getRecentLogs(limit);
      const convertedLogs = this.convertLogArray(logs);

      return {
        success: true,
        message: "Recent logs retrieved successfully",
        data: convertedLogs,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to retrieve recent logs",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getErrorLogs(
    limit: number = 100
  ): Promise<LogServiceResponse<LogEntry[]>> {
    try {
      const logs = await this.logRepository.getErrorLogs(limit);
      const convertedLogs = this.convertLogArray(logs);

      return {
        success: true,
        message: "Error logs retrieved successfully",
        data: convertedLogs,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to retrieve error logs",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async searchLogs(
    searchTerm: string,
    fields: string[] = ["message", "stackTrace"],
    limit: number = 100
  ): Promise<LogServiceResponse<LogEntry[]>> {
    try {
      if (!searchTerm || searchTerm.trim() === "") {
        return {
          success: false,
          message: "Search term is required",
          timestamp: new Date().toISOString(),
        };
      }

      const logs = await this.logRepository.searchLogs(
        searchTerm,
        fields,
        limit
      );
      const convertedLogs = this.convertLogArray(logs);

      return {
        success: true,
        message: "Logs search completed successfully",
        data: convertedLogs,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to search logs",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async exportLogs(
    format: "json" | "csv" | "text",
    options?: {
      startDate?: string;
      endDate?: string;
      includeMetadata?: boolean;
      includeStackTrace?: boolean;
    }
  ): Promise<LogServiceResponse<ExportLogData>> {
    try {
      const filters: ServiceLogFilters = {};

      if (options?.startDate) filters.startDate = new Date(options.startDate);
      if (options?.endDate) filters.endDate = new Date(options.endDate);

      const repoFilters = this.convertToRepositoryFilters(filters);
      const logs = await this.logRepository.exportLogs(format, repoFilters);
      const convertedLogs = this.convertLogArray(logs);

      // Format logs based on options
      const formattedLogs = convertedLogs.map((log) => {
        const baseLog: Record<string, unknown> = {
          id: log.id,
          timestamp: log.timestamp,
          level: log.level,
          message: log.message,
          source: log.source,
          service: log.service || "unknown",
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
        message: "Logs exported successfully",
        data: {
          format,
          count: formattedLogs.length,
          logs: formattedLogs,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to export logs",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getErrorTrend(
    days: number = 7
  ): Promise<LogServiceResponse<ErrorTrend>> {
    try {
      const trend = await this.logRepository.getErrorTrend(days);

      return {
        success: true,
        message: "Error trend retrieved successfully",
        data: trend,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to retrieve error trend",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getLogById(id: string): Promise<LogServiceResponse<LogEntry>> {
    try {
      const log = await this.logRepository.findById(id);

      if (!log) {
        return {
          success: false,
          message: "Log not found",
          timestamp: new Date().toISOString(),
        };
      }

      const convertedLog = this.convertToLogEntry(log);

      return {
        success: true,
        message: "Log retrieved successfully",
        data: convertedLog,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to retrieve log",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getLogsByService(
    serviceId: string
  ): Promise<LogServiceResponse<LogEntry[]>> {
    try {
      const logs = await this.logRepository.getLogsByService(serviceId, 100);
      const convertedLogs = this.convertLogArray(logs);

      return {
        success: true,
        message: "Service logs retrieved successfully",
        data: convertedLogs,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to retrieve service logs",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ========== CREATE METHODS ==========

  async createLog(
    logData: CreateLogData
  ): Promise<LogServiceResponse<LogEntry>> {
    try {
      const log = await this.logRepository.create({
        ...logData,
        timestamp: new Date(),
      });

      const convertedLog = this.convertToLogEntry(log);

      return {
        success: true,
        message: "Log created successfully",
        data: convertedLog,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to create log",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async createBatchLogs(
    logsData: CreateLogData[]
  ): Promise<LogServiceResponse<LogEntry[]>> {
    try {
      const logs = await this.logRepository.createBatch(
        logsData.map((data) => ({
          ...data,
          timestamp: new Date(),
        }))
      );

      const convertedLogs = this.convertLogArray(logs);

      return {
        success: true,
        message: "Batch logs created successfully",
        data: convertedLogs,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to create batch logs",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ========== MAINTENANCE METHODS ==========

  async rotateLogs(
    daysToKeep: number = 30
  ): Promise<LogServiceResponse<{ deletedCount: number }>> {
    try {
      const deletedCount = await this.logRepository.rotateLogs(daysToKeep);

      return {
        success: true,
        message: "Logs rotated successfully",
        data: { deletedCount },
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to rotate logs",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async performLogMaintenance(): Promise<void> {
    try {
      const result = await this.rotateLogs(30);
      console.log(
        `Log maintenance: ${result.message}, deleted: ${
          result.data?.deletedCount || 0
        } logs`
      );
    } catch (error: unknown) {
      console.error("Failed to perform log maintenance:", error);
    }
  }

  // ========== REALTIME METHODS ==========

  async getRealtimeLogs(): Promise<LogServiceResponse<LogEntry[]>> {
    try {
      const sources: LogSource[] = [
        "gateway",
        "notify",
        "chatbot",
        "management",
        "monitoring",
        "system",
      ];
      const levels: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];

      const mockLogs = Array.from(
        { length: 10 },
        (_, i): LogEntry => ({
          id: `realtime_${Date.now()}_${i}`,
          timestamp: new Date(Date.now() - i * 60000),
          level: levels[Math.floor(Math.random() * levels.length)],
          source: sources[Math.floor(Math.random() * sources.length)],
          message: `Realtime log message ${i + 1}`,
          metadata: {
            userId:
              Math.random() > 0.5
                ? `user_${Math.floor(Math.random() * 100)}`
                : undefined,
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          },
        })
      );

      return {
        success: true,
        message: "Realtime logs retrieved successfully",
        data: mockLogs,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: "Failed to retrieve realtime logs",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ========== HELPER METHODS ==========

  async collectServiceLogsMetrics(): Promise<LogStats> {
    try {
      const stats = await this.logRepository.getStats();
      return stats;
    } catch (error: unknown) {
      console.error("Failed to collect service logs metrics:", error);
      return {
        total: 0,
        byLevel: {},
        bySource: {},
        byService: {},
        errorRate: 0,
      };
    }
  }

  async getServiceHealth(): Promise<{
    status: "healthy" | "unhealthy" | "down";
    logsCount: number;
    recentErrors: number;
    storageStatus: "ok" | "warning" | "critical";
  }> {
    try {
      const stats = await this.getLogsStats();
      const recentLogs = await this.getRecentLogs(20);

      const errorCount =
        recentLogs.data?.filter((log) => ["error", "fatal"].includes(log.level))
          .length || 0;

      return {
        status: stats.success ? "healthy" : "unhealthy",
        logsCount: stats.data?.total || 0,
        recentErrors: errorCount,
        storageStatus: "ok",
      };
    } catch (error: unknown) {
      return {
        status: "down",
        logsCount: 0,
        recentErrors: 0,
        storageStatus: "critical",
      };
    }
  }
}

// Export singleton instance
export default new LogService();



