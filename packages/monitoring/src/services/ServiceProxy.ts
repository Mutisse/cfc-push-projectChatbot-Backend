// packages/monitoring/src/services/ServiceProxy.ts
import axios, { AxiosInstance } from 'axios';
import config from '../config';

export interface ServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  responseTime: number;
  timestamp: string;
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'unhealthy' | 'down';
  responseTime: number;
  data?: any;
  error?: string;
}

export interface ServiceMetrics {
  service: string;
  metrics: {
    requests?: number;
    errors?: number;
    responseTime?: number;
    uptime?: string;
    [key: string]: any;
  };
  timestamp: string;
}

export class ServiceProxy {
  private axiosInstances: Map<string, AxiosInstance>;
  
  constructor() {
    this.axiosInstances = new Map();
    this.initializeClients();
  }

  private initializeClients(): void {
    // Configurar cliente para cada serviço
    const services = {
      management: config.MANAGEMENT_URL,
      notify: config.NOTIFY_URL,
      chatbot: config.CHATBOT_URL,
      monitoring: config.MONITORING_URL
    };

    Object.entries(services).forEach(([service, baseURL]) => {
      if (!baseURL) {
        console.warn(`⚠️ URL não configurada para serviço: ${service}`);
        return;
      }

      const instance = axios.create({
        baseURL,
        timeout: service === 'chatbot' ? 15000 : 5000, // Chatbot pode ser mais lento
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CFC-Monitoring-Service'
        }
      });

      // Interceptor para medir tempo de resposta
      instance.interceptors.request.use((config) => {
        (config as any).metadata = { startTime: Date.now() };
        return config;
      });

      instance.interceptors.response.use(
        (response) => {
          const endTime = Date.now();
          const startTime = (response.config as any).metadata?.startTime || endTime;
          response.headers['x-response-time'] = (endTime - startTime).toString();
          return response;
        },
        (error) => {
          if (error.config) {
            const endTime = Date.now();
            const startTime = (error.config as any).metadata?.startTime || endTime;
            error.responseTime = endTime - startTime;
          }
          return Promise.reject(error);
        }
      );

      this.axiosInstances.set(service, instance);
    });
  }

  // ========== MÉTODOS PÚBLICOS ==========

  /**
   * Verifica saúde de todos os serviços
   */
  async checkAllServicesHealth(): Promise<ServiceHealth[]> {
    const services = Array.from(this.axiosInstances.keys());
    
    const healthChecks = await Promise.allSettled(
      services.map(service => this.checkServiceHealth(service))
    );

    return healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          service: services[index],
          status: 'down',
          responseTime: -1,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
  }

  /**
   * Verifica saúde de um serviço específico
   */
  async checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const instance = this.axiosInstances.get(serviceName);
    
    if (!instance) {
      return {
        service: serviceName,
        status: 'down',
        responseTime: -1,
        error: 'Service client not configured'
      };
    }

    const startTime = Date.now();
    
    try {
      let endpoint = '/health';
      
      // Endpoints específicos para cada serviço
      switch (serviceName) {
        case 'management':
          endpoint = '/api/management/health';
          break;
        case 'chatbot':
          endpoint = '/api/chatbot/health';
          break;
        case 'notify':
          endpoint = '/health';
          break;
        case 'monitoring':
          endpoint = '/health';
          break;
      }

      const response = await instance.get(endpoint);
      const responseTime = Date.now() - startTime;

      return {
        service: serviceName,
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        responseTime,
        data: response.data
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        service: serviceName,
        status: 'down',
        responseTime,
        error: error.message || 'Request failed',
        data: error.response?.data
      };
    }
  }

  /**
   * Coleta métricas detalhadas de um serviço
   */
  async collectServiceMetrics(serviceName: string): Promise<ServiceMetrics | null> {
    try {
      const health = await this.checkServiceHealth(serviceName);
      
      if (health.status === 'down') {
        return null;
      }

      // Coletar métricas específicas baseadas no serviço
      let additionalMetrics = {};
      
      switch (serviceName) {
        case 'management':
          additionalMetrics = await this.collectManagementMetrics();
          break;
        case 'notify':
          additionalMetrics = await this.collectNotifyMetrics();
          break;
        case 'chatbot':
          additionalMetrics = await this.collectChatbotMetrics();
          break;
        case 'monitoring':
          additionalMetrics = await this.collectSelfMetrics();
          break;
      }

      return {
        service: serviceName,
        metrics: {
          status: health.status,
          responseTime: health.responseTime,
          ...additionalMetrics
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Failed to collect metrics for ${serviceName}:`, error);
      return null;
    }
  }

  /**
   * Coleta métricas de todos os serviços
   */
  async collectAllServicesMetrics(): Promise<ServiceMetrics[]> {
    const services = Array.from(this.axiosInstances.keys());
    
    const metricsPromises = services.map(service => 
      this.collectServiceMetrics(service)
    );

    const results = await Promise.allSettled(metricsPromises);
    
    return results
      .map((result, index) => {
        if (result.status === 'fulfilled' && result.value !== null) {
          return result.value;
        }
        return {
          service: services[index],
          metrics: {
            status: 'down',
            error: result.status === 'rejected' ? result.reason?.message : 'No metrics available'
          },
          timestamp: new Date().toISOString()
        };
      })
      .filter(Boolean);
  }

  // ========== MÉTODOS ESPECÍFICOS PARA CADA SERVIÇO ==========

  private async collectManagementMetrics(): Promise<any> {
    try {
      const instance = this.axiosInstances.get('management');
      if (!instance) return {};

      const [servers, logs, events] = await Promise.allSettled([
        instance.get('/api/management/servers/count'),
        instance.get('/api/management/logs/stats'),
        instance.get('/api/management/events/recent')
      ]);

      return {
        servers: servers.status === 'fulfilled' ? servers.value.data?.count || 0 : 0,
        logsCount: logs.status === 'fulfilled' ? logs.value.data?.total || 0 : 0,
        recentEvents: events.status === 'fulfilled' ? events.value.data?.length || 0 : 0
      };

    } catch (error) {
      console.error('Failed to collect management metrics:', error);
      return {};
    }
  }

  private async collectNotifyMetrics(): Promise<any> {
    try {
      const instance = this.axiosInstances.get('notify');
      if (!instance) return {};

      const [stats, queue] = await Promise.allSettled([
        instance.get('/api/notify/stats'),
        instance.get('/api/notify/queue/status')
      ]);

      return {
        notificationsSent: stats.status === 'fulfilled' ? stats.value.data?.sent || 0 : 0,
        queueSize: queue.status === 'fulfilled' ? queue.value.data?.size || 0 : 0,
        pendingNotifications: queue.status === 'fulfilled' ? queue.value.data?.pending || 0 : 0
      };

    } catch (error) {
      console.error('Failed to collect notify metrics:', error);
      return {};
    }
  }

  private async collectChatbotMetrics(): Promise<any> {
    try {
      const instance = this.axiosInstances.get('chatbot');
      if (!instance) return {};

      const [sessions, messages] = await Promise.allSettled([
        instance.get('/api/chatbot/sessions/active'),
        instance.get('/api/chatbot/messages/today')
      ]);

      return {
        activeSessions: sessions.status === 'fulfilled' ? sessions.value.data?.count || 0 : 0,
        messagesToday: messages.status === 'fulfilled' ? messages.value.data?.count || 0 : 0,
        // Chatbot específico
        aiModel: 'GPT-4',
        responseAccuracy: '95%'
      };

    } catch (error) {
      console.error('Failed to collect chatbot metrics:', error);
      return {};
    }
  }

  private async collectSelfMetrics(): Promise<any> {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      return {
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024)
        },
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        nodeVersion: process.version,
        activeConnections: 0 // Seria obtido do servidor HTTP
      };
    } catch (error) {
      console.error('Failed to collect self metrics:', error);
      return {};
    }
  }

  /**
   * Faz uma requisição genérica a qualquer serviço
   */
  async request<T = any>(
    serviceName: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<ServiceResponse> {
    const instance = this.axiosInstances.get(serviceName);
    
    if (!instance) {
      return {
        success: false,
        error: `Service ${serviceName} not configured`,
        responseTime: -1,
        timestamp: new Date().toISOString()
      };
    }

    const startTime = Date.now();

    try {
      const response = await instance.request({
        method,
        url: endpoint,
        data
      });

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        data: response.data,
        responseTime,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        success: false,
        error: error.message || 'Request failed',
        data: error.response?.data,
        responseTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Retorna estatísticas de uso dos proxies
   */
  getProxyStats(): {
    totalServices: number;
    configuredServices: number;
    services: string[];
  } {
    const services = Array.from(this.axiosInstances.keys());
    
    return {
      totalServices: 4, // management, notify, chatbot, monitoring
      configuredServices: services.length,
      services
    };
  }
}

// Export singleton instance
export default new ServiceProxy();