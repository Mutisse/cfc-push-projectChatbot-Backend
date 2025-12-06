import { ServiceRepository, ServiceFilters } from '../repositories/ServiceRepository';
import axios from 'axios';

export interface ServiceServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export class ServiceService {
  private serviceRepository: ServiceRepository;

  constructor() {
    this.serviceRepository = new ServiceRepository();
  }

  async getServices(
    filters: ServiceFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<ServiceServiceResponse> {
    try {
      const { services, total } = await this.serviceRepository.findAll(filters, page, limit);
      
      return {
        success: true,
        message: 'Services retrieved successfully',
        data: {
          services,
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
        message: 'Failed to retrieve services',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getServiceById(id: string): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.findById(id);
      
      if (!service) {
        return {
          success: false,
          message: 'Service not found',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        message: 'Service retrieved successfully',
        data: service,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve service',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async createService(serviceData: any): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.create(serviceData);
      
      return {
        success: true,
        message: 'Service created successfully',
        data: service,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create service',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async updateService(id: string, serviceData: any): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.update(id, serviceData);
      
      if (!service) {
        return {
          success: false,
          message: 'Service not found',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        message: 'Service updated successfully',
        data: service,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update service',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async deleteService(id: string): Promise<ServiceServiceResponse> {
    try {
      const deleted = await this.serviceRepository.delete(id);
      
      if (!deleted) {
        return {
          success: false,
          message: 'Service not found',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        message: 'Service deleted successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete service',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async testServiceHealth(id: string): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.findById(id);
      
      if (!service) {
        return {
          success: false,
          message: 'Service not found',
          timestamp: new Date().toISOString()
        };
      }

      // Perform actual health check
      const startTime = Date.now();
      let healthStatus: 'healthy' | 'unhealthy' | 'unknown' = 'unknown';
      let responseTime: number | undefined;

      try {
        const response = await axios.get(service.url, { timeout: 5000 });
        responseTime = Date.now() - startTime;
        healthStatus = response.status >= 200 && response.status < 300 ? 'healthy' : 'unhealthy';
      } catch (error) {
        healthStatus = 'unhealthy';
      }

      // Update service status
      await this.serviceRepository.updateStatus(id, healthStatus);

      return {
        success: true,
        message: 'Service health check completed',
        data: {
          service,
          healthStatus,
          responseTime,
          lastCheck: new Date()
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to test service health',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getServicesHealth(): Promise<ServiceServiceResponse> {
    try {
      const healthChecks = await this.serviceRepository.getServicesHealth();
      
      return {
        success: true,
        message: 'Services health retrieved successfully',
        data: healthChecks,
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

  async getServicesSummary(): Promise<ServiceServiceResponse> {
    try {
      const summary = await this.serviceRepository.getSummary();
      
      return {
        success: true,
        message: 'Services summary retrieved successfully',
        data: summary,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve services summary',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async restartService(id: string): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.findById(id);
      
      if (!service) {
        return {
          success: false,
          message: 'Service not found',
          timestamp: new Date().toISOString()
        };
      }

      // In real app, call service restart endpoint
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate restart

      await this.serviceRepository.updateStatus(id, 'healthy');

      return {
        success: true,
        message: 'Service restarted successfully',
        data: { service },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to restart service',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async stopService(id: string): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.findById(id);
      
      if (!service) {
        return {
          success: false,
          message: 'Service not found',
          timestamp: new Date().toISOString()
        };
      }

      // In real app, call service stop endpoint
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate stop

      await this.serviceRepository.updateStatus(id, 'unhealthy');

      return {
        success: true,
        message: 'Service stopped successfully',
        data: { service },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to stop service',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async startService(id: string): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.findById(id);
      
      if (!service) {
        return {
          success: false,
          message: 'Service not found',
          timestamp: new Date().toISOString()
        };
      }

      // In real app, call service start endpoint
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate start

      await this.serviceRepository.updateStatus(id, 'healthy');

      return {
        success: true,
        message: 'Service started successfully',
        data: { service },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to start service',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async forceHealthCheck(id: string): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.findById(id);
      
      if (!service) {
        return {
          success: false,
          message: 'Service not found',
          timestamp: new Date().toISOString()
        };
      }

      // Perform immediate health check
      const result = await this.testServiceHealth(id);

      return {
        success: result.success,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to force health check',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getServiceMetricsPeriod(
    id: string,
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.findById(id);
      
      if (!service) {
        return {
          success: false,
          message: 'Service not found',
          timestamp: new Date().toISOString()
        };
      }

      // Mock metrics data
      const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const metrics = Array.from({ length: hours }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
        healthStatus: ['healthy', 'unhealthy', 'unknown'][Math.floor(Math.random() * 3)] as 'healthy' | 'unhealthy' | 'unknown',
        responseTime: Math.random() * 1000,
        uptime: Math.random() * 100
      }));

      return {
        success: true,
        message: 'Service metrics retrieved successfully',
        data: metrics,
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

  async bulkUpdateServicesStatus(
    serviceIds: string[],
    action: 'start' | 'stop' | 'restart'
  ): Promise<ServiceServiceResponse> {
    try {
      if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
        return {
          success: false,
          message: 'serviceIds array is required',
          timestamp: new Date().toISOString()
        };
      }

      let count = 0;
      const status = action === 'start' || action === 'restart' ? 'healthy' : 'unhealthy';

      if (action === 'restart' || action === 'stop' || action === 'start') {
        count = await this.serviceRepository.bulkUpdateStatus(serviceIds, status);
      }

      return {
        success: true,
        message: `${count} services ${action}ed successfully`,
        data: { count },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to ${action} services`,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export default new ServiceService();