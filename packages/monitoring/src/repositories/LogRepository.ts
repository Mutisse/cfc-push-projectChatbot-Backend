// src/repositories/LogRepository.ts
import { Log, ILog, LogLevel, LogSource } from '../models/LogModel';

export interface LogFilters {
  level?: LogLevel;
  source?: LogSource;
  service?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  ipAddress?: string;
  endpoint?: string;
}

export class LogRepository {
  async findAll(
    filters: LogFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ logs: ILog[]; total: number }> {
    const query: any = {};

    if (filters.level) query.level = filters.level;
    if (filters.source) query.source = filters.source;
    if (filters.service) query.service = filters.service;
    if (filters.userId) query.userId = filters.userId;
    if (filters.ipAddress) query.ipAddress = filters.ipAddress;
    if (filters.endpoint) query.endpoint = filters.endpoint;
    
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    if (filters.search) {
      query.$or = [
        { message: { $regex: filters.search, $options: 'i' } },
        { stackTrace: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      Log.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean<ILog[]>(),
      Log.countDocuments(query)
    ]);

    return { logs, total };
  }

  async findById(id: string): Promise<ILog | null> {
    return Log.findById(id).lean<ILog>();
  }

  async create(logData: Partial<ILog>): Promise<ILog> {
    const requiredFields = ['level', 'message', 'source'];
    const missingFields = requiredFields.filter(field => !logData[field as keyof ILog]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const log = new Log(logData);
    return await log.save();
  }

  async createBatch(logsData: Partial<ILog>[]): Promise<ILog[]> {
    const validLogs = logsData.map(data => {
      const log = new Log(data);
      return log.toObject();
    });
    
    const result = await Log.insertMany(validLogs);
    return result as unknown as ILog[];
  }

  async getLogsByService(service: string, limit: number = 100): Promise<ILog[]> {
    return Log.find({ service })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean<ILog[]>();
  }

  async getStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    total: number;
    byLevel: Record<string, number>;
    bySource: Record<string, number>;
    byService: Record<string, number>;
    errorRate: number;
  }> {
    const match: any = {};
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = startDate;
      if (endDate) match.timestamp.$lte = endDate;
    }

    const [total, levelStats, sourceStats, serviceStats, errorCount] = await Promise.all([
      Log.countDocuments(match),
      Log.aggregate([
        { $match: match },
        { $group: { _id: '$level', count: { $sum: 1 } } }
      ]),
      Log.aggregate([
        { $match: match },
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ]),
      Log.aggregate([
        { $match: match },
        { $group: { _id: '$service', count: { $sum: 1 } } }
      ]),
      Log.countDocuments({ ...match, level: 'error' })
    ]);

    const byLevel = levelStats.reduce((acc: Record<string, number>, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const bySource = sourceStats.reduce((acc: Record<string, number>, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const byService = serviceStats.reduce((acc: Record<string, number>, curr) => {
      acc[curr._id || 'unknown'] = curr.count;
      return acc;
    }, {});

    const errorRate = total > 0 ? (errorCount / total) * 100 : 0;

    return { total, byLevel, bySource, byService, errorRate };
  }

  async getRecentLogs(limit: number = 50): Promise<ILog[]> {
    return Log.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean<ILog[]>();
  }

  async getErrorLogs(limit: number = 100): Promise<ILog[]> {
    return Log.find({ level: 'error' })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean<ILog[]>();
  }

  async searchLogs(
    searchTerm: string,
    fields: string[] = ['message', 'stackTrace'],
    limit: number = 100
  ): Promise<ILog[]> {
    const orConditions = fields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }));

    return Log.find({ $or: orConditions })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean<ILog[]>();
  }

  async getErrorTrend(days: number = 7): Promise<{
    dates: string[];
    counts: number[];
    byLevel: Record<LogLevel, number[]>;
    bySource: Record<LogSource, number[]>;
    averageDaily: number;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Pipeline principal para contagem por data
    const dailyCounts = await Log.aggregate([
      {
        $match: {
          level: 'error',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 },
          levels: { $push: '$level' },
          sources: { $push: '$source' }
        }
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          levels: 1,
          sources: 1,
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Inicializar estruturas
    const dates: string[] = [];
    const counts: number[] = [];
    
    // Inicializar byLevel e bySource
    const byLevel: Record<LogLevel, number[]> = {
      debug: [], info: [], warn: [], error: [], fatal: []
    };
    
    const bySource: Record<LogSource, number[]> = {
      gateway: [], notify: [], chatbot: [], management: [], 
      monitoring: [], system: [], proxy: [], 'performance-monitor': []
    };

    // Preencher arrays com zeros para todos os dias
    const allDates: string[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      allDates.push(dateStr);
      
      // Inicializar todos os arrays com zeros
      dates.push(dateStr);
      counts.push(0);
      Object.keys(byLevel).forEach(level => byLevel[level as LogLevel].push(0));
      Object.keys(bySource).forEach(source => bySource[source as LogSource].push(0));
    }

    // Preencher com dados reais
    dailyCounts.forEach(day => {
      const index = dates.indexOf(day.date);
      if (index !== -1) {
        counts[index] = day.count;
        
        // Contar por level para este dia
        if (day.levels) {
          const levelCounts: Record<string, number> = {};
          day.levels.forEach((level: LogLevel) => {
            levelCounts[level] = (levelCounts[level] || 0) + 1;
          });
          
          // Atualizar byLevel
          Object.keys(levelCounts).forEach(level => {
            if (byLevel[level as LogLevel]) {
              byLevel[level as LogLevel][index] = levelCounts[level];
            }
          });
        }
        
        // Contar por source para este dia
        if (day.sources) {
          const sourceCounts: Record<string, number> = {};
          day.sources.forEach((source: LogSource) => {
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
          });
          
          // Atualizar bySource
          Object.keys(sourceCounts).forEach(source => {
            if (bySource[source as LogSource]) {
              bySource[source as LogSource][index] = sourceCounts[source];
            }
          });
        }
      }
    });

    const totalErrors = counts.reduce((sum, count) => sum + count, 0);
    const averageDaily = days > 0 ? totalErrors / days : 0;

    return {
      dates,
      counts,
      byLevel,
      bySource,
      averageDaily
    };
  }

  async rotateLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const result = await Log.deleteMany({ timestamp: { $lt: cutoffDate } });
    return result.deletedCount || 0;
  }

  async exportLogs(
    format: 'json' | 'csv' | 'text',
    filters?: LogFilters
  ): Promise<ILog[]> {
    const query: any = {};

    if (filters?.level) query.level = filters.level;
    if (filters?.source) query.source = filters.source;
    if (filters?.service) query.service = filters.service;
    if (filters?.startDate || filters?.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    return Log.find(query)
      .sort({ timestamp: -1 })
      .limit(1000)
      .lean<ILog[]>();
  }
}