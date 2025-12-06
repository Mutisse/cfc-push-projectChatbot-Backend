import { MetricRepository, MetricFilters } from '../repositories/MetricRepository';

export interface MetricServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export class MetricService {
  private metricRepository: MetricRepository;

  constructor() {
    this.metricRepository = new MetricRepository();
  }

  async getMetrics(
    filters: MetricFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<MetricServiceResponse> {
    try {
      const { metrics, total } = await this.metricRepository.findAll(filters, page, limit);
      
      return {
        success: true,
        message: 'Metrics retrieved successfully',
        data: {
          metrics,
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
        message: 'Failed to retrieve metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async createMetric(metricData: any): Promise<MetricServiceResponse> {
    try {
      const metric = await this.metricRepository.create(metricData);
      
      return {
        success: true,
        message: 'Metric created successfully',
        data: metric,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create metric',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async createBatchMetrics(metricsData: any[]): Promise<MetricServiceResponse> {
    try {
      const metrics = await this.metricRepository.createBatch(metricsData);
      
      return {
        success: true,
        message: 'Metrics created successfully',
        data: metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getRealtimeMetrics(): Promise<MetricServiceResponse> {
    try {
      const metrics = await this.metricRepository.getRealtimeMetrics();
      
      return {
        success: true,
        message: 'Realtime metrics retrieved successfully',
        data: metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve realtime metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getRequestsData(
    timeRange: string,
    startDate?: string,
    endDate?: string
  ): Promise<MetricServiceResponse> {
    try {
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      const data = await this.metricRepository.getTimeSeriesData(
        'gateway',
        'request_count',
        start,
        end,
        3600000 // 1 hour interval
      );

      return {
        success: true,
        message: 'Requests data retrieved successfully',
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve requests data',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getPerformanceMetrics(): Promise<MetricServiceResponse> {
    try {
      const performance = await this.metricRepository.getPerformanceMetrics();
      
      return {
        success: true,
        message: 'Performance metrics retrieved successfully',
        data: performance,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve performance metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getHttpMethodDistribution(): Promise<MetricServiceResponse> {
    try {
      const distribution = await this.metricRepository.getHttpMethodDistribution();
      
      return {
        success: true,
        message: 'HTTP method distribution retrieved successfully',
        data: distribution,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve HTTP method distribution',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getStatusCodeDistribution(): Promise<MetricServiceResponse> {
    try {
      const distribution = await this.metricRepository.getStatusCodeDistribution();
      
      return {
        success: true,
        message: 'Status code distribution retrieved successfully',
        data: distribution,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve status code distribution',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getServiceMetrics(): Promise<MetricServiceResponse> {
    try {
      const serviceMetrics = await this.metricRepository.getServiceMetrics();
      
      return {
        success: true,
        message: 'Service metrics retrieved successfully',
        data: serviceMetrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve service metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getSystemResourceMetrics(): Promise<MetricServiceResponse> {
    try {
      const resources = await this.metricRepository.getSystemResourceMetrics();
      
      return {
        success: true,
        message: 'System resource metrics retrieved successfully',
        data: resources,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve system resource metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getTrendAnalysis(): Promise<MetricServiceResponse> {
    try {
      const trends = await this.metricRepository.getTrendAnalysis();
      
      return {
        success: true,
        message: 'Trend analysis retrieved successfully',
        data: trends,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve trend analysis',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async exportMetrics(
    format: 'csv' | 'json' | 'pdf',
    dataType: 'all' | 'performance' | 'distribution' | 'services' = 'all'
  ): Promise<MetricServiceResponse> {
    try {
      // Mock export data
      const exportData = {
        format,
        dataType,
        generatedAt: new Date().toISOString(),
        metrics: [] // In real app, fetch actual metrics
      };

      return {
        success: true,
        message: 'Metrics export generated successfully',
        data: exportData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to export metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async compareServices(
    services: string[],
    metrics: string[]
  ): Promise<MetricServiceResponse> {
    try {
      if (!Array.isArray(services) || services.length === 0) {
        return {
          success: false,
          message: 'Services array is required',
          timestamp: new Date().toISOString()
        };
      }

      // Mock comparison data
      const comparison = services.map(service => ({
        service,
        metrics: metrics.reduce((acc, metric) => {
          acc[metric] = Math.random() * 100;
          return acc;
        }, {} as Record<string, number>),
        score: Math.random() * 100
      }));

      return {
        success: true,
        message: 'Services compared successfully',
        data: { comparison, services, metrics },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to compare services',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async performMetricMaintenance(): Promise<void> {
    try {
      const deletedCount = await this.metricRepository.deleteOldMetrics(30);
      console.log(`Cleaned up ${deletedCount} old metrics`);
    } catch (error) {
      console.error('Failed to perform metric maintenance:', error);
    }
  }
}

// Export singleton instance
export default new MetricService();