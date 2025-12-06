import ServiceService from './ServiceService';
import AlertService from './AlertService';
import MetricService from './MetricService';
import LogService from './LogService';

export interface DashboardServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export class DashboardService {
  async getDashboardData(): Promise<DashboardServiceResponse> {
    try {
      // Fetch all dashboard data in parallel
      const [
        servicesHealth,
        alertStats,
        systemMetrics,
        recentAlerts,
        dailyStats
      ] = await Promise.all([
        ServiceService.getServicesHealth(),
        AlertService.getAlertStats(),
        MetricService.getSystemResourceMetrics(),
        AlertService.getRecentAlerts(10),
        this.getDailyStats()
      ]);

      const overallStatus = this.calculateOverallStatus(
        servicesHealth.data,
        alertStats.data,
        systemMetrics.data
      );

      return {
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: {
          overallStatus,
          servicesHealth: servicesHealth.data,
          alertStats: alertStats.data,
          systemMetrics: systemMetrics.data,
          recentAlerts: recentAlerts.data,
          dailyStats: dailyStats.data,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve dashboard data',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getServicesHealth(): Promise<DashboardServiceResponse> {
    try {
      const servicesHealth = await ServiceService.getServicesHealth();
      
      if (!servicesHealth.success) {
        throw new Error(servicesHealth.message);
      }

      return {
        success: true,
        message: 'Services health retrieved successfully',
        data: servicesHealth.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve services health',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getRecentAlerts(limit: number = 20): Promise<DashboardServiceResponse> {
    try {
      const recentAlerts = await AlertService.getRecentAlerts(limit);
      
      if (!recentAlerts.success) {
        throw new Error(recentAlerts.message);
      }

      return {
        success: true,
        message: 'Recent alerts retrieved successfully',
        data: recentAlerts.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve recent alerts',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getSystemStatus(): Promise<DashboardServiceResponse> {
    try {
      const [
        servicesHealth,
        alertStats,
        systemMetrics,
        recentAlerts
      ] = await Promise.all([
        ServiceService.getServicesHealth(),
        AlertService.getAlertStats(),
        MetricService.getSystemResourceMetrics(),
        AlertService.getRecentAlerts(5)
      ]);

      if (!servicesHealth.success || !alertStats.success || !systemMetrics.success) {
        throw new Error('Failed to fetch system status data');
      }

      const overallStatus = this.calculateOverallStatus(
        servicesHealth.data,
        alertStats.data,
        systemMetrics.data
      );

      const systemStatus = {
        overallStatus: overallStatus.status,
        overallScore: overallStatus.score,
        healthyServices: this.countHealthyServices(servicesHealth.data),
        totalServices: this.countTotalServices(servicesHealth.data),
        activeAlerts: recentAlerts.success ? (recentAlerts.data as any[]).length : 0,
        systemResources: systemMetrics.data,
        lastUpdated: new Date().toISOString()
      };

      return {
        success: true,
        message: 'System status retrieved successfully',
        data: systemStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve system status',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getPerformanceMetrics(): Promise<DashboardServiceResponse> {
    try {
      const performanceMetrics = await MetricService.getPerformanceMetrics();
      
      if (!performanceMetrics.success) {
        throw new Error(performanceMetrics.message);
      }

      return {
        success: true,
        message: 'Performance metrics retrieved successfully',
        data: performanceMetrics.data,
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

  async getDailyStats(): Promise<DashboardServiceResponse> {
    try {
      // Mock daily stats (in real app, aggregate from database)
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const dailyStats = {
        totalRequests: Math.floor(Math.random() * 10000),
        successfulRequests: Math.floor(Math.random() * 9500),
        failedRequests: Math.floor(Math.random() * 500),
        avgResponseTime: Math.random() * 500 + 100,
        errorRate: Math.random() * 5,
        peakHour: `${Math.floor(Math.random() * 24)}:00`,
        busiestService: 'gateway',
        date: startOfDay.toISOString()
      };

      return {
        success: true,
        message: 'Daily stats retrieved successfully',
        data: dailyStats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve daily stats',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private calculateOverallStatus(
    servicesHealth: any,
    alertStats: any,
    systemMetrics: any
  ): { status: string; score: number; color: string; icon: string } {
    let score = 100;

    // Deduct points for unhealthy services
    if (servicesHealth) {
      const unhealthyCount = servicesHealth.filter((service: any) => 
        service.healthStatus !== 'healthy'
      ).length;
      score -= unhealthyCount * 10;
    }

    // Deduct points for open alerts
    if (alertStats?.open) {
      score -= alertStats.open * 5;
    }

    // Deduct points for system resource issues
    if (systemMetrics) {
      if (systemMetrics.cpu?.used > 90) score -= 10;
      if (systemMetrics.memory?.used > 90) score -= 10;
      if (systemMetrics.disk?.used > 90) score -= 10;
    }

    // Determine status
    let status: string;
    let color: string;
    let icon: string;

    if (score >= 90) {
      status = 'healthy';
      color = 'green';
      icon = 'check_circle';
    } else if (score >= 70) {
      status = 'degraded';
      color = 'orange';
      icon = 'warning';
    } else {
      status = 'unhealthy';
      color = 'red';
      icon = 'error';
    }

    return { status, score, color, icon };
  }

  private countHealthyServices(servicesHealth: any[]): number {
    return servicesHealth.filter(service => 
      service.healthStatus === 'healthy'
    ).length;
  }

  private countTotalServices(servicesHealth: any[]): number {
    return servicesHealth.length;
  }

  async getHistoricalMetrics(
    serviceName: string,
    metricName: string,
    timeRange: string = '24h'
  ): Promise<DashboardServiceResponse> {
    try {
      // Mock historical metrics
      const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const interval = timeRange === '1h' ? 5 : timeRange === '24h' ? 30 : 60; // minutes

      const historicalData = Array.from({ length: hours * (60 / interval) }, (_, i) => ({
        timestamp: new Date(Date.now() - i * interval * 60 * 1000),
        value: Math.random() * 100,
        service: serviceName,
        metric: metricName
      }));

      return {
        success: true,
        message: 'Historical metrics retrieved successfully',
        data: historicalData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve historical metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export default new DashboardService();