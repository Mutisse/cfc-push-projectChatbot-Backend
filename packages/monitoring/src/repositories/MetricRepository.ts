import { Metric, IMetric } from '../models/MetricModel';

export interface MetricFilters {
  service?: string;
  name?: string;
  startDate?: Date;
  endDate?: Date;
  tags?: Record<string, string>;
}

export class MetricRepository {
  async findAll(
    filters: MetricFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ metrics: IMetric[]; total: number }> {
    const query: any = {};

    if (filters.service) query.service = filters.service;
    if (filters.name) query.name = filters.name;
    
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    if (filters.tags) {
      Object.entries(filters.tags).forEach(([key, value]) => {
        query[`tags.${key}`] = value;
      });
    }

    const skip = (page - 1) * limit;

    const [metrics, total] = await Promise.all([
      Metric.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IMetric[]>(),
      Metric.countDocuments(query)
    ]);

    return { metrics, total };
  }

  async findById(id: string): Promise<IMetric | null> {
    return Metric.findById(id).lean<IMetric>();
  }

  async create(metricData: Partial<IMetric>): Promise<IMetric> {
    // Validar campos obrigatórios antes de criar
    const requiredFields = ['service', 'name', 'value', 'unit', 'timestamp'];
    const missingFields = requiredFields.filter(field => !metricData[field as keyof IMetric]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const metric = new Metric(metricData);
    return metric.save();
  }

  async createBatch(metricsData: Partial<IMetric>[]): Promise<IMetric[]> {
    // Validar cada métrica antes de inserir em batch
    const validMetrics = metricsData.map(data => {
      const metric = new Metric(data);
      return metric.toObject();
    });
    
    return Metric.insertMany(validMetrics) as unknown as IMetric[];
  }

  async getTimeSeriesData(
    service: string,
    name: string,
    startDate: Date,
    endDate: Date,
    interval: number = 3600000 // 1 hour in milliseconds
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    const result = await Metric.aggregate([
      {
        $match: {
          service,
          name,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: "$timestamp" },
                { $mod: [{ $toLong: "$timestamp" }, interval] }
              ]
            }
          },
          value: { $avg: "$value" }
        }
      },
      {
        $project: {
          timestamp: "$_id",
          value: 1,
          _id: 0
        }
      },
      { $sort: { timestamp: 1 } }
    ]);

    return result;
  }

  async getAggregatedMetrics(
    service?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{
    name: string;
    avg: number;
    min: number;
    max: number;
    count: number;
  }>> {
    const match: any = {};
    if (service) match.service = service;
    if (startDate || endDate) {
      match.timestamp = {};
      if (startDate) match.timestamp.$gte = startDate;
      if (endDate) match.timestamp.$lte = endDate;
    }

    return Metric.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$name",
          avg: { $avg: "$value" },
          min: { $min: "$value" },
          max: { $max: "$value" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: "$_id",
          avg: 1,
          min: 1,
          max: 1,
          count: 1,
          _id: 0
        }
      }
    ]);
  }

  async getRealtimeMetrics(service?: string): Promise<IMetric[]> {
    const query: any = {};
    if (service) query.service = service;

    // Get metrics from last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    query.timestamp = { $gte: fiveMinutesAgo };

    return Metric.find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      .lean<IMetric[]>();
  }

  async getPerformanceMetrics(): Promise<{
    responseTime: {
      avg: number;
      p95: number;
      p99: number;
    };
    throughput: number;
    errorRate: number;
  }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const responseTimeMetrics = await Metric.aggregate([
      {
        $match: {
          name: "response_time",
          timestamp: { $gte: oneHourAgo }
        }
      },
      {
        $group: {
          _id: null,
          avg: { $avg: "$value" },
          values: { $push: "$value" }
        }
      }
    ]);

    const throughputMetrics = await Metric.countDocuments({
      name: "request_count",
      timestamp: { $gte: oneHourAgo }
    });

    const errorMetrics = await Metric.aggregate([
      {
        $match: {
          name: "error_count",
          timestamp: { $gte: oneHourAgo }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$value" }
        }
      }
    ]);

    // Calculate percentiles
    let p95 = 0, p99 = 0;
    if (responseTimeMetrics[0]?.values) {
      const sorted = responseTimeMetrics[0].values.sort((a: number, b: number) => a - b);
      p95 = sorted[Math.floor(sorted.length * 0.95)];
      p99 = sorted[Math.floor(sorted.length * 0.99)];
    }

    return {
      responseTime: {
        avg: responseTimeMetrics[0]?.avg || 0,
        p95,
        p99
      },
      throughput: throughputMetrics / 60, // requests per minute
      errorRate: errorMetrics[0]?.total || 0
    };
  }

  async getHttpMethodDistribution(): Promise<Record<string, number>> {
    const result = await Metric.aggregate([
      {
        $match: {
          name: "http_method"
        }
      },
      {
        $group: {
          _id: "$tags.method",
          count: { $sum: 1 }
        }
      }
    ]);

    return result.reduce((acc: Record<string, number>, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
  }

  async getStatusCodeDistribution(): Promise<Record<string, number>> {
    const result = await Metric.aggregate([
      {
        $match: {
          name: "http_status"
        }
      },
      {
        $group: {
          _id: "$tags.status",
          count: { $sum: 1 }
        }
      }
    ]);

    return result.reduce((acc: Record<string, number>, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
  }

  async getServiceMetrics(): Promise<Array<{
    service: string;
    metrics: Record<string, number>;
  }>> {
    const result = await Metric.aggregate([
      {
        $group: {
          _id: { service: "$service", name: "$name" },
          avgValue: { $avg: "$value" }
        }
      },
      {
        $group: {
          _id: "$_id.service",
          metrics: {
            $push: {
              k: "$_id.name",
              v: "$avgValue"
            }
          }
        }
      },
      {
        $project: {
          service: "$_id",
          metrics: { $arrayToObject: "$metrics" },
          _id: 0
        }
      }
    ]);

    return result;
  }

  async getSystemResourceMetrics(): Promise<{
    cpu: { used: number; total: number };
    memory: { used: number; total: number };
    disk: { used: number; total: number };
  }> {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const cpuMetrics = await Metric.findOne({
      name: "cpu_usage",
      timestamp: { $gte: fiveMinutesAgo }
    }).sort({ timestamp: -1 }).lean<IMetric>();

    const memoryMetrics = await Metric.findOne({
      name: "memory_usage",
      timestamp: { $gte: fiveMinutesAgo }
    }).sort({ timestamp: -1 }).lean<IMetric>();

    const diskMetrics = await Metric.findOne({
      name: "disk_usage",
      timestamp: { $gte: fiveMinutesAgo }
    }).sort({ timestamp: -1 }).lean<IMetric>();

    return {
      cpu: {
        used: cpuMetrics?.value || 0,
        total: 100
      },
      memory: {
        used: memoryMetrics?.value || 0,
        total: 100
      },
      disk: {
        used: diskMetrics?.value || 0,
        total: 100
      }
    };
  }

  async getTrendAnalysis(): Promise<{
    trends: Array<{
      metric: string;
      trend: 'up' | 'down' | 'stable';
      change: number;
    }>;
    anomalies: Array<{
      metric: string;
      timestamp: Date;
      value: number;
      expected: number;
    }>;
  }> {
    // Simplified trend analysis
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const currentMetrics = await Metric.aggregate([
      {
        $match: {
          timestamp: { $gte: oneHourAgo }
        }
      },
      {
        $group: {
          _id: "$name",
          avgValue: { $avg: "$value" }
        }
      }
    ]);

    const previousMetrics = await Metric.aggregate([
      {
        $match: {
          timestamp: { $gte: twoHoursAgo, $lt: oneHourAgo }
        }
      },
      {
        $group: {
          _id: "$name",
          avgValue: { $avg: "$value" }
        }
      }
    ]);

    const trends = currentMetrics.map(curr => {
      const prev = previousMetrics.find(p => p._id === curr._id);
      const change = prev ? ((curr.avgValue - prev.avgValue) / prev.avgValue) * 100 : 0;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (change > 10) trend = 'up';
      else if (change < -10) trend = 'down';
      
      return {
        metric: curr._id || 'unknown',
        trend,
        change
      };
    });

    return {
      trends,
      anomalies: [] // Simplified - in real app would detect anomalies
    };
  }

  async deleteOldMetrics(days: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await Metric.deleteMany({ timestamp: { $lt: cutoffDate } });
    return result.deletedCount || 0;
  }
}