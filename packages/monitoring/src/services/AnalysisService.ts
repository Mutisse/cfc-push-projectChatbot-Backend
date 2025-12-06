import MetricService from './MetricService';
import LogService from './LogService';
import ServiceService from './ServiceService';

export interface AnalysisServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface AnalysisFilters {
  period: '24h' | '7d' | '30d';
  metric: string;
  service?: string;
  startDate?: Date;
  endDate?: Date;
}

export class AnalysisService {
  async getAnalysisData(filters: AnalysisFilters): Promise<AnalysisServiceResponse> {
    try {
      const { period, metric, service } = filters;
      
      // Get relevant data based on filters
      const [metricsData, logsData, servicesData] = await Promise.all([
        this.getMetricAnalysis(period, metric, service),
        this.getLogAnalysis(period, service),
        this.getServiceAnalysis(period, service)
      ]);

      const analysisData = {
        period,
        metric,
        service,
        metrics: metricsData,
        logs: logsData,
        services: servicesData,
        insights: this.generateInsightsFromData(metricsData, logsData, servicesData), // Mudei o nome aqui
        recommendations: this.generateRecommendations(metricsData, logsData, servicesData)
      };

      return {
        success: true,
        message: 'Analysis data retrieved successfully',
        data: analysisData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve analysis data',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async generateInsights(filters: AnalysisFilters): Promise<AnalysisServiceResponse> {
    try {
      const analysisData = await this.getAnalysisData(filters);
      
      if (!analysisData.success) {
        throw new Error(analysisData.message);
      }

      const insights = this.analyzeDataForInsights(analysisData.data);

      return {
        success: true,
        message: 'Insights generated successfully',
        data: insights,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate insights',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async exportAnalysisReport(
    period: string,
    format: 'pdf' | 'csv' | 'json'
  ): Promise<AnalysisServiceResponse> {
    try {
      const filters: AnalysisFilters = {
        period: period as '24h' | '7d' | '30d',
        metric: 'all'
      };

      const analysisData = await this.getAnalysisData(filters);
      
      if (!analysisData.success) {
        throw new Error(analysisData.message);
      }

      const report = {
        title: `System Analysis Report - ${period}`,
        generatedAt: new Date().toISOString(),
        period,
        format,
        data: analysisData.data,
        summary: this.generateReportSummary(analysisData.data)
      };

      return {
        success: true,
        message: 'Analysis report exported successfully',
        data: report,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to export analysis report',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async updateAnalysisSettings(settings: any): Promise<AnalysisServiceResponse> {
    try {
      // In real app, save to database
      return {
        success: true,
        message: 'Analysis settings updated successfully',
        data: settings,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update analysis settings',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async executeInsightAction(insightId: number): Promise<AnalysisServiceResponse> {
    try {
      // In real app, execute specific action based on insight
      const actions: Record<number, string> = {
        1: 'Increased monitoring frequency',
        2: 'Optimized resource allocation',
        3: 'Fixed configuration issue',
        4: 'Implemented caching strategy',
        5: 'Scaled service horizontally'
      };

      const action = actions[insightId] || 'General optimization applied';

      return {
        success: true,
        message: 'Insight action executed successfully',
        data: { insightId, action, executedAt: new Date().toISOString() },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to execute insight action',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getChartData(
    metric: string,
    period: string,
    service?: string
  ): Promise<AnalysisServiceResponse> {
    try {
      const filters: AnalysisFilters = {
        period: period as '24h' | '7d' | '30d',
        metric,
        service
      };

      const analysisData = await this.getAnalysisData(filters);
      
      if (!analysisData.success) {
        throw new Error(analysisData.message);
      }

      const chartData = this.formatDataForChart(analysisData.data);

      return {
        success: true,
        message: 'Chart data retrieved successfully',
        data: chartData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve chart data',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getHeatmapData(period: string): Promise<AnalysisServiceResponse> {
    try {
      // Mock heatmap data
      const days = period === '7d' ? 7 : 30;
      const hours = 24;
      
      const heatmapData = Array.from({ length: days }, (_, day) =>
        Array.from({ length: hours }, (_, hour) => ({
          day,
          hour,
          value: Math.random() * 100,
          intensity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
        }))
      ).flat();

      return {
        success: true,
        message: 'Heatmap data retrieved successfully',
        data: heatmapData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve heatmap data',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getComparisonData(
    metric: string,
    period: string
  ): Promise<AnalysisServiceResponse> {
    try {
      // Mock comparison data
      const services = ['gateway', 'notify', 'chatbot', 'management', 'monitoring'];
      
      const comparisonData = services.map(service => ({
        service,
        currentValue: Math.random() * 100,
        previousValue: Math.random() * 100,
        change: (Math.random() - 0.5) * 20, // -10% to +10%
        trend: Math.random() > 0.5 ? 'up' : 'down',
        benchmark: 85 // Industry standard
      }));

      return {
        success: true,
        message: 'Comparison data retrieved successfully',
        data: comparisonData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve comparison data',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async getMetricAnalysis(period: string, metric: string, service?: string) {
    const timeRange = period === '24h' ? '24h' : period === '7d' ? '7d' : '30d';
    
    if (service) {
      // Get specific service metrics
      const result = await MetricService.getRequestsData(timeRange);
      return result.success ? result.data : [];
    } else {
      // Get aggregated metrics
      const result = await MetricService.getPerformanceMetrics();
      return result.success ? result.data : {};
    }
  }

  private async getLogAnalysis(period: string, service?: string) {
    const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
    
    const filters: any = {};
    if (service) filters.service = service;

    const result = await LogService.getLogsStats();
    return result.success ? result.data : {};
  }

  private async getServiceAnalysis(period: string, service?: string) {
    if (service) {
      const result = await ServiceService.getServiceById(service);
      return result.success ? result.data : null;
    } else {
      const result = await ServiceService.getServicesHealth();
      return result.success ? result.data : [];
    }
  }

  // Mudei o nome desta função para evitar conflito
  private generateInsightsFromData(metrics: any, logs: any, services: any) {
    const insights = [];

    // Performance insights
    if (metrics?.responseTime?.avg > 500) {
      insights.push({
        id: 1,
        type: 'performance',
        title: 'High Response Time',
        description: `Average response time is ${Math.round(metrics.responseTime.avg)}ms, consider optimizing.`,
        severity: 'medium',
        action: 'optimize_requests'
      });
    }

    // Error insights
    if (logs?.errorRate > 5) {
      insights.push({
        id: 2,
        type: 'error',
        title: 'High Error Rate',
        description: `Error rate is ${logs.errorRate.toFixed(1)}%, investigate immediately.`,
        severity: 'high',
        action: 'investigate_errors'
      });
    }

    // Resource insights
    if (metrics?.cpu?.used > 90) {
      insights.push({
        id: 3,
        type: 'resource',
        title: 'High CPU Usage',
        description: `CPU usage at ${Math.round(metrics.cpu.used)}%, consider scaling.`,
        severity: 'medium',
        action: 'scale_resources'
      });
    }

    // Service health insights
    if (Array.isArray(services)) {
      const unhealthyServices = services.filter(s => s.healthStatus !== 'healthy');
      if (unhealthyServices.length > 0) {
        insights.push({
          id: 4,
          type: 'service',
          title: 'Unhealthy Services',
          description: `${unhealthyServices.length} service(s) are not healthy.`,
          severity: 'high',
          action: 'check_services'
        });
      }
    }

    // Trend insights
    if (metrics?.trends) {
      const downwardTrends = metrics.trends.filter((t: any) => t.trend === 'down' && t.change < -10);
      if (downwardTrends.length > 0) {
        insights.push({
          id: 5,
          type: 'trend',
          title: 'Negative Trends Detected',
          description: `${downwardTrends.length} metric(s) showing significant decline.`,
          severity: 'medium',
          action: 'analyze_trends'
        });
      }
    }

    return insights.slice(0, 5); // Limit to 5 insights
  }

  private generateRecommendations(metrics: any, logs: any, services: any) {
    const recommendations = [];

    if (metrics?.responseTime?.avg > 500) {
      recommendations.push({
        id: 1,
        title: 'Optimize Database Queries',
        description: 'Consider adding indexes or optimizing slow queries.',
        impact: 'high',
        effort: 'medium'
      });
    }

    if (logs?.errorRate > 5) {
      recommendations.push({
        id: 2,
        title: 'Implement Circuit Breaker',
        description: 'Add circuit breaker pattern to prevent cascade failures.',
        impact: 'high',
        effort: 'high'
      });
    }

    if (metrics?.memory?.used > 90) {
      recommendations.push({
        id: 3,
        title: 'Increase Memory Allocation',
        description: 'Consider increasing available memory or optimizing memory usage.',
        impact: 'medium',
        effort: 'low'
      });
    }

    return recommendations;
  }

  private analyzeDataForInsights(data: any) {
    // Additional analysis logic
    return [];
  }

  private generateReportSummary(data: any) {
    return {
      totalMetrics: Object.keys(data.metrics || {}).length,
      totalLogs: data.logs?.total || 0,
      totalServices: Array.isArray(data.services) ? data.services.length : 1,
      insightsCount: data.insights?.length || 0,
      recommendationsCount: data.recommendations?.length || 0,
      overallHealth: 'good' // Simplified
    };
  }

  private formatDataForChart(data: any) {
    // Format data for chart display
    return {
      labels: [],
      datasets: []
    };
  }
}

// Export singleton instance
export default new AnalysisService();