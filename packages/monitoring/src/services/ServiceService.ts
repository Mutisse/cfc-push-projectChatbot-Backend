// packages/monitoring/src/services/ServiceService.ts
import ServiceRepository from "../repositories/ServiceRepository";
import { IService } from "../models/ServiceModel";
import ServiceProxy, { ServiceHealth } from "./ServiceProxy";
import { ServiceFilters } from "../repositories/ServiceRepository";

export interface ServiceServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export class ServiceService {
  private serviceRepository: typeof ServiceRepository;
  private serviceProxy: typeof ServiceProxy;
  private syncInterval: NodeJS.Timeout | null = null;
  private proxyConfigs: Map<string, any>;

  constructor() {
    this.serviceRepository = ServiceRepository;
    this.serviceProxy = ServiceProxy;
    this.proxyConfigs = new Map();
    
    // Carrega configurações do proxy
    this.loadProxyConfigs();
    
    // Inicia sincronização automática
    this.startAutoSync();
  }

  /**
   * Carrega configurações do proxy a partir das variáveis de ambiente
   */
  private loadProxyConfigs(): void {
    const env = process.env;
    
    const configs = [
      {
        key: 'management',
        name: 'Management Service',
        url: env.MANAGEMENT_URL,
        path: '/api/management',
        category: 'authentication',
        tags: ['management', 'auth', 'users', 'admin'],
        type: 'api' as const
      },
      {
        key: 'monitoring',
        name: 'Monitoring Service', 
        url: env.MONITORING_URL,
        path: '/api/monitoring',
        category: 'monitoring',
        tags: ['monitoring', 'metrics', 'alerts'],
        type: 'monitoring' as const
      },
      {
        key: 'notify',
        name: 'Notification Service',
        url: env.NOTIFY_URL,
        path: '/api/notify',
        category: 'notification',
        tags: ['notifications', 'email', 'push', 'whatsapp', 'sms'],
        type: 'external' as const
      },
      {
        key: 'chatbot',
        name: 'Chatbot Service',
        url: env.CHATBOT_URL,
        path: '/api/chatbot',
        category: 'ai',
        tags: ['chatbot', 'ai', 'assistant'],
        type: 'external' as const
      },
      {
        key: 'gateway',
        name: 'API Gateway',
        url: env.HOST || 'http://localhost:8080',
        path: '/api/gateway',
        category: 'gateway',
        tags: ['gateway', 'router', 'proxy'],
        type: 'gateway' as const
      }
    ];

    // Filtra apenas serviços com URL configurada
    configs.forEach(config => {
      if (config.url && config.url.trim() !== '') {
        this.proxyConfigs.set(config.key, config);
      }
    });
  }

  /**
   * Inicia sincronização automática com o proxy
   */
  private startAutoSync(): void {
    // Sincroniza imediatamente ao iniciar (com delay)
    setTimeout(async () => {
      try {
        await this.syncServicesFromProxy();
      } catch (error) {
        console.error('Erro na sincronização inicial:', error);
      }
    }, 5000);
    
    // Sincroniza a cada 5 minutos
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncServicesFromProxy();
      } catch (error) {
        console.error('Erro na sincronização periódica:', error);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Sincroniza serviços do proxy para o banco de dados
   */
  async syncServicesFromProxy(): Promise<{
    added: number;
    updated: number;
    total: number;
  }> {
    console.log('🔄 Sincronizando serviços do proxy...');
    
    const proxyStats = this.getProxyStats();
    console.log(`📊 Serviços configurados no proxy: ${proxyStats.totalConfigured}`);
    
    let added = 0;
    let updated = 0;
    
    // Para cada serviço configurado no proxy
    for (const [key, config] of this.proxyConfigs) {
      try {
        const serviceData = await this.createServiceDataFromProxy(config);
        
        // Verifica se o serviço já existe
        const existingService = await this.serviceRepository.findByUrl(config.url);
        
        if (existingService) {
          // Atualiza serviço existente
          const updateData: Partial<IService> = {
            ...serviceData,
            metadata: {
              ...existingService.metadata,
              ...serviceData.metadata,
              lastSync: new Date()
            }
          };
          
          await this.serviceRepository.update(existingService._id.toString(), updateData);
          updated++;
          console.log(`🔁 Serviço atualizado: ${config.name}`);
        } else {
          // Cria novo serviço
          await this.serviceRepository.create(serviceData);
          added++;
          console.log(`➕ Serviço criado: ${config.name}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar serviço ${config.name}:`, error);
      }
    }
    
    console.log(`✅ Sincronização concluída: ${added} novos, ${updated} atualizados`);
    return { added, updated, total: this.proxyConfigs.size };
  }

  /**
   * Cria dados do serviço a partir da configuração do proxy
   */
  private async createServiceDataFromProxy(
    config: any
  ): Promise<Partial<IService>> {
    // Verifica saúde inicial
    let status: IService["status"] = "unknown";
    let responseTime = 0;
    
    if (config.url) {
      try {
        const health = await this.testServiceHealthDirectly(config.url);
        status = health.status === 'healthy' ? 'healthy' : 
                 health.status === 'unhealthy' ? 'unhealthy' : 'unknown';
        responseTime = health.responseTime;
      } catch (error) {
        status = 'unknown';
      }
    }
    
    // Determina ambiente
    const environment = this.getEnvironmentFromUrl(config.url);
    
    // Configura canais de notificação baseados no tipo de serviço
    const notificationChannels = this.getNotificationChannelsForService(config.key);
    
    return {
      name: config.name,
      type: config.type,
      description: this.generateDescription(config.key),
      url: config.url,
      status,
      displayName: config.name,
      environment,
      category: config.category,
      tags: config.tags,
      healthCheckEndpoint: this.getHealthEndpoint(config.key),
      config: {
        timeout: 10000,
        retryAttempts: 3,
        critical: this.isCriticalService(config.key)
      },
      metrics: {
        responseTime,
        errorRate: status === "healthy" ? 0 : 10,
        uptime: status === "healthy" ? 100 : 0,
        lastUpdated: new Date()
      },
      metadata: {
        owner: this.getServiceOwner(config.key),
        department: this.getServiceDepartment(config.key),
        sla: this.getServiceSLA(config.key),
        gatewayPath: config.path,
        proxyService: config.key,
        discoveredAt: new Date(),
        lastSync: new Date(),
        source: 'proxy-discovery',
        notificationChannels,
        custom: {}
      },
      lastHealthCheck: new Date(),
      isMonitored: true,
      monitoringConfig: {
        checkInterval: 300,
        alertOnFailure: true,
        alertThreshold: 3
      }
    };
  }

  /**
   * Determina canais de notificação baseados no tipo de serviço
   */
  private getNotificationChannelsForService(serviceKey: string): {
    email?: boolean;
    whatsapp?: boolean;
    sms?: boolean;
    push?: boolean;
    slack?: boolean;
    telegram?: boolean;
    webhook?: boolean;
  } {
    switch (serviceKey) {
      case 'notify':
        return {
          email: true,
          whatsapp: true,
          sms: true,
          push: true,
          slack: false,
          telegram: false,
          webhook: true
        };
      case 'monitoring':
        return {
          email: true,
          whatsapp: true,
          sms: true,
          push: false,
          slack: true,
          telegram: true,
          webhook: true
        };
      case 'management':
        return {
          email: true,
          whatsapp: false,
          sms: false,
          push: false,
          slack: true,
          telegram: false,
          webhook: true
        };
      default:
        return {
          email: true,
          whatsapp: false,
          sms: false,
          push: false,
          slack: false,
          telegram: false,
          webhook: false
        };
    }
  }

  /**
   * Determina ambiente baseado na URL
   */
  private getEnvironmentFromUrl(url: string): IService["environment"] {
    if (!url) return "development";
    
    if (url.includes("localhost") || url.includes("127.0.0.1")) {
      return "development";
    } else if (url.includes("staging") || url.includes("test")) {
      return "staging";
    } else if (url.includes("render.com") || url.includes("onrender.com")) {
      return "production";
    } else {
      return "production";
    }
  }

  /**
   * Gera descrição automática para o serviço
   */
  private generateDescription(serviceKey: string): string {
    const descriptions: Record<string, string> = {
      'management': 'API de gerenciamento de usuários, autenticação e administração',
      'monitoring': 'Sistema de monitoramento e métricas em tempo real',
      'notify': 'Serviço de notificações push, email, WhatsApp e SMS',
      'chatbot': 'Serviço de IA para atendimento automático via chat',
      'gateway': 'Gateway central que roteia todas as requisições'
    };
    
    return descriptions[serviceKey] || `Serviço ${serviceKey}`;
  }

  /**
   * Obtém endpoint de saúde
   */
  private getHealthEndpoint(serviceKey: string): string {
    const endpoints: Record<string, string> = {
      'management': '/api/management/health',
      'monitoring': '/health',
      'notify': '/health',
      'chatbot': '/api/chatbot/health',
      'gateway': '/api/gateway/proxies/health'
    };
    
    return endpoints[serviceKey] || '/health';
  }

  /**
   * Determina se o serviço é crítico
   */
  private isCriticalService(serviceKey: string): boolean {
    const criticalServices = ['management', 'gateway', 'monitoring'];
    return criticalServices.includes(serviceKey);
  }

  /**
   * Obtém dono do serviço
   */
  private getServiceOwner(serviceKey: string): string {
    const owners: Record<string, string> = {
      'management': 'Development Team',
      'monitoring': 'DevOps Team',
      'notify': 'Marketing Team',
      'chatbot': 'AI Team',
      'gateway': 'Infrastructure Team'
    };
    
    return owners[serviceKey] || 'System Team';
  }

  /**
   * Obtém departamento
   */
  private getServiceDepartment(serviceKey: string): string {
    const departments: Record<string, string> = {
      'management': 'IT',
      'monitoring': 'Infrastructure',
      'notify': 'Communication',
      'chatbot': 'Innovation',
      'gateway': 'DevOps'
    };
    
    return departments[serviceKey] || 'Operations';
  }

  /**
   * Obtém SLA
   */
  private getServiceSLA(serviceKey: string): string {
    const slas: Record<string, string> = {
      'management': '99.9%',
      'monitoring': '99.95%',
      'notify': '99.5%',
      'chatbot': '98%',
      'gateway': '99.99%'
    };
    
    return slas[serviceKey] || '99%';
  }

  /**
   * Retorna estatísticas da descoberta
   */
  private getProxyStats(): {
    totalConfigured: number;
    discovered: number;
    services: Array<{key: string, name: string, url: string}>
  } {
    const services = Array.from(this.proxyConfigs.values());
    
    return {
      totalConfigured: services.length,
      discovered: services.filter(s => s.url).length,
      services: services.map(s => ({
        key: s.key,
        name: s.name,
        url: s.url
      }))
    };
  }

  // ========== MÉTODOS PRINCIPAIS DA API ==========

  async getServices(
    filters: ServiceFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<ServiceServiceResponse> {
    try {
      // Primeiro sincroniza para ter dados atualizados
      await this.syncServicesFromProxy().catch(error => {
        console.warn('Aviso: Sincronização falhou, usando dados do banco:', error);
      });
      
      const { services, total } = await this.serviceRepository.findAll(filters, page, limit);

      // Adiciona dados de saúde em tempo real usando o proxy
      const servicesWithHealth = await Promise.all(
        services.map(async (service) => {
          if (service.type === "external" || service.type === "api") {
            try {
              const serviceName = service.metadata?.proxyService;
              if (serviceName) {
                const health = await this.serviceProxy.checkServiceHealth(serviceName);
                return {
                  ...service,
                  realtimeHealth: {
                    status: health.status,
                    responseTime: health.responseTime,
                    lastChecked: new Date().toISOString(),
                  },
                };
              }
            } catch (error) {
              console.error(`Failed to check health for service ${service._id}:`, error);
            }
          }
          return service;
        })
      );

      return {
        success: true,
        message: "Services retrieved successfully",
        data: {
          services: servicesWithHealth,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to retrieve services",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getServiceById(id: string): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.findById(id);

      if (!service) {
        return {
          success: false,
          message: "Service not found",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: "Service retrieved successfully",
        data: service,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to retrieve service",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async createService(
    serviceData: Partial<IService>
  ): Promise<ServiceServiceResponse> {
    try {
      // Verifica se serviço com mesmo nome já existe
      const existing = await this.serviceRepository.findByName(
        serviceData.name || ""
      );
      if (existing) {
        return {
          success: false,
          message: "Service with this name already exists",
          timestamp: new Date().toISOString(),
        };
      }

      // Garante que metadata tem o campo custom
      if (serviceData.metadata && !serviceData.metadata.custom) {
        serviceData.metadata.custom = {};
      }

      // Verifica saúde inicial se for serviço externo
      if (
        (serviceData.type === "external" || serviceData.type === "api") &&
        serviceData.url
      ) {
        try {
          const health = await this.testServiceHealthDirectly(serviceData.url);
          serviceData.status =
            health.status === "healthy"
              ? "healthy"
              : health.status === "unhealthy"
              ? "unhealthy"
              : "unknown";
          serviceData.lastHealthCheck = new Date();

          // Inicializa métricas
          if (!serviceData.metrics) {
            serviceData.metrics = {
              responseTime: health.responseTime,
              errorRate: serviceData.status === "healthy" ? 0 : 10,
              uptime: serviceData.status === "healthy" ? 100 : 0,
              lastUpdated: new Date(),
            };
          }
        } catch (error) {
          serviceData.status = "unknown";
        }
      }

      const service = await this.serviceRepository.create(serviceData);

      return {
        success: true,
        message: "Service created successfully",
        data: service,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to create service",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async updateService(
    id: string,
    serviceData: Partial<IService>
  ): Promise<ServiceServiceResponse> {
    try {
      // Garante que metadata tem o campo custom se for fornecido
      if (serviceData.metadata && !serviceData.metadata.custom) {
        serviceData.metadata.custom = {};
      }

      const service = await this.serviceRepository.update(id, serviceData);

      if (!service) {
        return {
          success: false,
          message: "Service not found",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: "Service updated successfully",
        data: service,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update service",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async deleteService(id: string): Promise<ServiceServiceResponse> {
    try {
      const deleted = await this.serviceRepository.delete(id);

      if (!deleted) {
        return {
          success: false,
          message: "Service not found",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: "Service deleted successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to delete service",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async testServiceHealth(id: string): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.findById(id);

      if (!service) {
        return {
          success: false,
          message: "Service not found",
          timestamp: new Date().toISOString(),
        };
      }

      const health = await this.testServiceHealthDirectly(service.url);
      const status =
        health.status === "healthy"
          ? "healthy"
          : health.status === "unhealthy"
          ? "unhealthy"
          : "unknown";

      // Atualiza status no banco
      await this.serviceRepository.updateStatus(id, status);

      // Atualiza métricas
      await this.serviceRepository.updateMetrics(
        id,
        health.responseTime,
        health.status === "healthy"
      );

      return {
        success: true,
        message: "Service health check completed",
        data: {
          service,
          healthResult: health,
          status,
          responseTime: health.responseTime,
          lastCheck: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to test service health",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getServicesSummary(): Promise<ServiceServiceResponse> {
    try {
      const summary = await this.serviceRepository.getSummary();

      return {
        success: true,
        message: "Services summary retrieved successfully",
        data: summary,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to retrieve services summary",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ========== MÉTODOS ADICIONAIS PARA COMPATIBILIDADE ==========

  /**
   * Obtém saúde de todos os serviços (para compatibilidade com AnalysisService)
   */
  async getServicesHealth(): Promise<ServiceServiceResponse> {
    try {
      const { services } = await this.serviceRepository.findAll({}, 1, 100);
      
      const servicesHealth = services.map(service => ({
        service: service.name,
        status: service.status,
        responseTime: service.metrics?.responseTime || 0,
        data: {
          url: service.url,
          environment: service.environment,
          lastHealthCheck: service.lastHealthCheck,
          uptime: service.metrics?.uptime || 0
        }
      }));

      return {
        success: true,
        message: "Services health retrieved successfully",
        data: servicesHealth,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to retrieve services health",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async restartService(id: string): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.findById(id);

      if (!service) {
        return {
          success: false,
          message: "Service not found",
          timestamp: new Date().toISOString(),
        };
      }

      // Marca como saudável após "restart"
      await this.serviceRepository.updateStatus(id, "healthy");

      return {
        success: true,
        message: "Service marked as restarted",
        data: { service },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to restart service",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async stopService(id: string): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.findById(id);

      if (!service) {
        return {
          success: false,
          message: "Service not found",
          timestamp: new Date().toISOString(),
        };
      }

      // Marca como não saudável
      await this.serviceRepository.updateStatus(id, "unhealthy");

      return {
        success: true,
        message: "Service marked as stopped",
        data: { service },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to stop service",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async startService(id: string): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.findById(id);

      if (!service) {
        return {
          success: false,
          message: "Service not found",
          timestamp: new Date().toISOString(),
        };
      }

      // Marca como saudável
      await this.serviceRepository.updateStatus(id, "healthy");

      return {
        success: true,
        message: "Service marked as started",
        data: { service },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to start service",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async forceHealthCheck(id: string): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.findById(id);

      if (!service) {
        return {
          success: false,
          message: "Service not found",
          timestamp: new Date().toISOString(),
        };
      }

      // Verificação imediata
      const result = await this.testServiceHealth(id);

      // Se for serviço externo, coleta métricas detalhadas
      if (service.type === "external" && result.success && result.data) {
        const serviceName = service.metadata?.proxyService;
        if (serviceName) {
          const metrics = await this.serviceProxy.collectServiceMetrics(
            serviceName
          );
          if (metrics) {
            (result.data as any).detailedMetrics = metrics;
          }
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: "Failed to force health check",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getServiceMetricsPeriod(
    id: string,
    timeRange: "1h" | "24h" | "7d" | "30d" = "24h"
  ): Promise<ServiceServiceResponse> {
    try {
      const service = await this.serviceRepository.findById(id);

      if (!service) {
        return {
          success: false,
          message: "Service not found",
          timestamp: new Date().toISOString(),
        };
      }

      // Retorna métricas atuais
      return {
        success: true,
        message: "Service metrics retrieved successfully",
        data: {
          current: {
            responseTime: service.metrics?.responseTime || 0,
            errorRate: service.metrics?.errorRate || 0,
            uptime: service.metrics?.uptime || 0,
            lastUpdated: service.metrics?.lastUpdated || new Date()
          },
          historical: []
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to retrieve service metrics",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async bulkUpdateServicesStatus(
    serviceIds: string[],
    action: "start" | "stop" | "restart"
  ): Promise<ServiceServiceResponse> {
    try {
      if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
        return {
          success: false,
          message: "serviceIds array is required",
          timestamp: new Date().toISOString(),
        };
      }

      const results = [];

      // Executa a ação para cada serviço
      for (const serviceId of serviceIds) {
        try {
          let result;
          if (action === "restart") {
            result = await this.restartService(serviceId);
          } else if (action === "stop") {
            result = await this.stopService(serviceId);
          } else if (action === "start") {
            result = await this.startService(serviceId);
          }

          if (result) {
            results.push({
              serviceId,
              success: result.success,
              message: result.message,
            });
          }
        } catch (error) {
          results.push({
            serviceId,
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const successful = results.filter((r) => r.success).length;

      return {
        success: successful > 0,
        message: `${successful} of ${serviceIds.length} services ${action}ed successfully`,
        data: {
          results,
          total: serviceIds.length,
          successful,
          failed: serviceIds.length - successful,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to ${action} services`,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ========== MÉTODOS DE CONTROLE ==========

  async forceSync(): Promise<ServiceServiceResponse> {
    try {
      const stats = await this.syncServicesFromProxy();
      
      return {
        success: true,
        message: 'Sincronização forçada concluída',
        data: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Falha na sincronização',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getSyncStatus(): Promise<ServiceServiceResponse> {
    try {
      const discoveryStats = this.getProxyStats();
      const dbStats = await this.serviceRepository.getSummary();
      
      return {
        success: true,
        message: 'Status da sincronização obtido',
        data: {
          discovery: discoveryStats,
          database: dbStats,
          autoSyncEnabled: !!this.syncInterval,
          lastSyncAttempt: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Falha ao obter status',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // ========== MÉTODOS PRIVADOS AUXILIARES ==========

  private async testServiceHealthDirectly(url: string): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - startTime;

      return {
        service: url,
        status: response.ok ? "healthy" : "unhealthy",
        responseTime,
        data: { status: response.status },
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        service: url,
        status: "down",
        responseTime,
        error: error.message || "Request failed",
      };
    }
  }
}

// Export singleton instance
export default new ServiceService();