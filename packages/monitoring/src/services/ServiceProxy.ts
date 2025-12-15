// packages/monitoring/src/services/ServiceProxy.ts
import axios, { AxiosInstance } from "axios";
import config from "../config";
import logServiceInstance, { type LogStats } from "./LogService";
import type { LogEntry } from "../models/LogModel";

export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  responseTime: number;
  timestamp: string;
}

export interface ServiceHealth {
  service: string;
  status: "healthy" | "unhealthy" | "down";
  responseTime: number;
  data?: unknown;
  error?: string;
}

export interface ServiceMetrics {
  service: string;
  metrics: {
    requests?: number;
    errors?: number;
    responseTime?: number;
    uptime?: string;
    logs?: LogStats;
    [key: string]: unknown;
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
      monitoring: config.MONITORING_URL,
    };

    Object.entries(services).forEach(([service, baseURL]) => {
      if (!baseURL) {
        logServiceInstance.createLog({
          level: "warn",
          source: "monitoring",
          message: `Service URL not configured: ${service}`,
          metadata: { service },
        });
        return;
      }

      const instance = axios.create({
        baseURL,
        timeout: service === "chatbot" ? 15000 : 5000,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "CFC-Monitoring-Service",
          "X-Service-Name": service,
        },
      });

      // Interceptor para logging de requisições
      instance.interceptors.request.use((config) => {
        (config as any).metadata = { startTime: Date.now() };
        return config;
      });

      instance.interceptors.response.use(
        (response) => {
          const endTime = Date.now();
          const startTime =
            (response.config as any).metadata?.startTime || endTime;
          response.headers["x-response-time"] = (
            endTime - startTime
          ).toString();

          // Log de sucesso
          logServiceInstance.createLog({
            level: "info",
            source: "proxy",
            message: `Request to ${response.config.baseURL}${response.config.url}`,
            metadata: {
              service,
              method: response.config.method,
              status: response.status,
              responseTime: endTime - startTime,
            },
          });

          return response;
        },
        (error) => {
          const endTime = Date.now();
          const startTime =
            (error.config as any).metadata?.startTime || endTime;
          const responseTime = endTime - startTime;

          // Log de erro
          logServiceInstance.createLog({
            level: "error",
            source: "proxy",
            message: `Request failed to ${error.config?.baseURL}${error.config?.url}`,
            metadata: {
              service,
              method: error.config?.method,
              status: error.response?.status,
              responseTime,
              error: error.message,
            },
          });

          return Promise.reject(error);
        }
      );

      this.axiosInstances.set(service, instance);
    });
  }

  // ========== MÉTODOS PÚBLICOS ==========

  async checkAllServicesHealth(): Promise<ServiceHealth[]> {
    const services = Array.from(this.axiosInstances.keys());

    const healthChecks = await Promise.allSettled(
      services.map((service) => this.checkServiceHealth(service))
    );

    const results = healthChecks.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          service: services[index],
          status: "down" as const,
          responseTime: -1,
          error: result.reason?.message || "Unknown error",
        };
      }
    });

    // Log dos resultados
    results.forEach((result) => {
      logServiceInstance.createLog({
        level: result.status === "healthy" ? "info" : "error",
        source: "monitoring",
        message: `Service ${result.service} health: ${result.status}`,
        metadata: {
          service: result.service,
          status: result.status,
          responseTime: result.responseTime,
          error: result.error,
        },
      });
    });

    return results;
  }

  async checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const instance = this.axiosInstances.get(serviceName);

    if (!instance) {
      return {
        service: serviceName,
        status: "down",
        responseTime: -1,
        error: "Service client not configured",
      };
    }

    const startTime = Date.now();

    try {
      let endpoint = "/health";

      switch (serviceName) {
        case "management":
          endpoint = "/api/management/health";
          break;
        case "chatbot":
          endpoint = "/api/chatbot/health";
          break;
        case "notify":
          endpoint = "/health";
          break;
        case "monitoring":
          endpoint = "/health";
          break;
      }

      const response = await instance.get(endpoint);
      const responseTime = Date.now() - startTime;

      return {
        service: serviceName,
        status: response.status === 200 ? "healthy" : "unhealthy",
        responseTime,
        data: response.data,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        service: serviceName,
        status: "down",
        responseTime,
        error: error.message || "Request failed",
        data: error.response?.data,
      };
    }
  }

  async collectServiceMetrics(
    serviceName: string
  ): Promise<ServiceMetrics | null> {
    try {
      const health = await this.checkServiceHealth(serviceName);

      if (health.status === "down") {
        return null;
      }

      // Coletar métricas específicas e logs
      let additionalMetrics: Record<string, unknown> = {};

      switch (serviceName) {
        case "management":
          additionalMetrics = await this.collectManagementMetrics();
          break;
        case "notify":
          additionalMetrics = await this.collectNotifyMetrics();
          break;
        case "chatbot":
          additionalMetrics = await this.collectChatbotMetrics();
          break;
        case "monitoring":
          additionalMetrics = await this.collectSelfMetrics();
          break;
      }

      // Incluir métricas de logs do serviço
      const logStats = await logServiceInstance.collectServiceLogsMetrics();
      additionalMetrics.logs = logStats;

      return {
        service: serviceName,
        metrics: {
          status: health.status,
          responseTime: health.responseTime,
          ...additionalMetrics,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      console.error(`Failed to collect metrics for ${serviceName}:`, error);
      return null;
    }
  }

  async collectAllServicesMetrics(): Promise<ServiceMetrics[]> {
    const services = Array.from(this.axiosInstances.keys());

    const metricsPromises = services.map((service) =>
      this.collectServiceMetrics(service)
    );

    const results = await Promise.allSettled(metricsPromises);

    const collectedMetrics = results
      .map((result, index) => {
        if (result.status === "fulfilled" && result.value !== null) {
          return result.value;
        }
        return {
          service: services[index],
          metrics: {
            status: "down" as const,
            error:
              result.status === "rejected"
                ? result.reason?.message
                : "No metrics available",
          },
          timestamp: new Date().toISOString(),
        };
      })
      .filter(Boolean) as ServiceMetrics[];

    // Log do resumo
    logServiceInstance.createLog({
      level: "info",
      source: "monitoring",
      message: `Collected metrics from ${collectedMetrics.length} services`,
      metadata: {
        totalServices: collectedMetrics.length,
        healthyServices: collectedMetrics.filter(
          (m) => m.metrics.status === "healthy"
        ).length,
        downServices: collectedMetrics.filter(
          (m) => m.metrics.status === "down"
        ).length,
      },
    });

    return collectedMetrics;
  }

  // ========== MÉTODOS ESPECÍFICOS ==========

  private async collectManagementMetrics(): Promise<Record<string, unknown>> {
    try {
      const instance = this.axiosInstances.get("management");
      if (!instance) return {};

      const [servers, logs, events] = await Promise.allSettled([
        instance.get("/api/management/servers/count"),
        instance.get("/api/management/logs/stats"),
        instance.get("/api/management/events/recent"),
      ]);

      return {
        servers:
          servers.status === "fulfilled" ? servers.value.data?.count || 0 : 0,
        logsCount:
          logs.status === "fulfilled" ? logs.value.data?.total || 0 : 0,
        recentEvents:
          events.status === "fulfilled" ? events.value.data?.length || 0 : 0,
      };
    } catch (error: unknown) {
      console.error("Failed to collect management metrics:", error);
      return {};
    }
  }

  private async collectNotifyMetrics(): Promise<Record<string, unknown>> {
    try {
      const instance = this.axiosInstances.get("notify");
      if (!instance) return {};

      const [stats, queue] = await Promise.allSettled([
        instance.get("/api/notify/stats"),
        instance.get("/api/notify/queue/status"),
      ]);

      return {
        notificationsSent:
          stats.status === "fulfilled" ? stats.value.data?.sent || 0 : 0,
        queueSize:
          queue.status === "fulfilled" ? queue.value.data?.size || 0 : 0,
        pendingNotifications:
          queue.status === "fulfilled" ? queue.value.data?.pending || 0 : 0,
      };
    } catch (error: unknown) {
      console.error("Failed to collect notify metrics:", error);
      return {};
    }
  }

  private async collectChatbotMetrics(): Promise<Record<string, unknown>> {
    try {
      const instance = this.axiosInstances.get("chatbot");
      if (!instance) return {};

      const [sessions, messages] = await Promise.allSettled([
        instance.get("/api/chatbot/sessions/active"),
        instance.get("/api/chatbot/messages/today"),
      ]);

      return {
        activeSessions:
          sessions.status === "fulfilled" ? sessions.value.data?.count || 0 : 0,
        messagesToday:
          messages.status === "fulfilled" ? messages.value.data?.count || 0 : 0,
        aiModel: "GPT-4",
        responseAccuracy: "95%",
      };
    } catch (error: unknown) {
      console.error("Failed to collect chatbot metrics:", error);
      return {};
    }
  }

  private async collectSelfMetrics(): Promise<Record<string, unknown>> {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      const serviceHealth = await logServiceInstance.getServiceHealth();

      return {
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        },
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor(
          (uptime % 3600) / 60
        )}m`,
        nodeVersion: process.version,
        logsService: serviceHealth,
        activeConnections: 0,
      };
    } catch (error: unknown) {
      console.error("Failed to collect self metrics:", error);
      return {};
    }
  }

  // ========== REQUEST METHODS ==========

  async request<T = unknown>(
    serviceName: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data?: unknown
  ): Promise<ServiceResponse<T>> {
    const instance = this.axiosInstances.get(serviceName);

    if (!instance) {
      return {
        success: false,
        error: `Service ${serviceName} not configured`,
        responseTime: -1,
        timestamp: new Date().toISOString(),
      };
    }

    const startTime = Date.now();

    try {
      const response = await instance.request({
        method,
        url: endpoint,
        data,
      });

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        data: response.data as T,
        responseTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      return {
        success: false,
        error: error.message || "Request failed",
        data: error.response?.data as T,
        responseTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ========== LOG INTEGRATION METHODS ==========

  async getServiceLogs(
    serviceName: string,
    filters?: {
      level?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<LogEntry[]> {
    try {
      const serviceFilters = {
        source: serviceName,
        ...(filters?.level && { level: filters.level }),
        ...(filters?.startDate && { startDate: new Date(filters.startDate) }),
        ...(filters?.endDate && { endDate: new Date(filters.endDate) }),
      };

      const response = await logServiceInstance.searchLogs(
        `source:"${serviceName}"`,
        ["source", "message"],
        filters?.limit || 100
      );

      return response.data || [];
    } catch (error: unknown) {
      console.error(`Failed to get logs for service ${serviceName}:`, error);
      return [];
    }
  }

  async monitorServicePerformance(serviceName: string): Promise<void> {
    try {
      // Verificar saúde
      const health = await this.checkServiceHealth(serviceName);

      // Coletar métricas
      const metrics = await this.collectServiceMetrics(serviceName);

      // Coletar logs recentes
      const recentLogs = await this.getServiceLogs(serviceName, { limit: 10 });

      // Registrar performance
      logServiceInstance.createLog({
        level: health.status === "healthy" ? "info" : "warn",
        source: "performance-monitor",
        message: `Performance check for ${serviceName}`,
        metadata: {
          service: serviceName,
          status: health.status,
          responseTime: health.responseTime,
          metrics: metrics?.metrics,
          recentLogsCount: recentLogs.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      console.error(`Failed to monitor service ${serviceName}:`, error);
    }
  }

  // ========== STATS METHODS ==========

  getProxyStats(): {
    totalServices: number;
    configuredServices: number;
    services: string[];
    lastCheck: string;
  } {
    const services = Array.from(this.axiosInstances.keys());

    return {
      totalServices: 4,
      configuredServices: services.length,
      services,
      lastCheck: new Date().toISOString(),
    };
  }

  async getPerformanceReport(): Promise<{
    timestamp: string;
    servicesHealth: ServiceHealth[];
    metrics: ServiceMetrics[];
    summary: {
      totalServices: number;
      healthyServices: number;
      unhealthyServices: number;
      downServices: number;
      averageResponseTime: number;
    };
  }> {
    const healthChecks = await this.checkAllServicesHealth();
    const metrics = await this.collectAllServicesMetrics();

    const healthyServices = healthChecks.filter(
      (h) => h.status === "healthy"
    ).length;

    const validResponseTimes = healthChecks
      .filter((h) => h.responseTime > 0)
      .map((h) => h.responseTime);

    const avgResponseTime =
      validResponseTimes.length > 0
        ? validResponseTimes.reduce((sum, time) => sum + time, 0) /
          validResponseTimes.length
        : 0;

    return {
      timestamp: new Date().toISOString(),
      servicesHealth: healthChecks,
      metrics,
      summary: {
        totalServices: healthChecks.length,
        healthyServices,
        unhealthyServices: healthChecks.filter((h) => h.status === "unhealthy")
          .length,
        downServices: healthChecks.filter((h) => h.status === "down").length,
        averageResponseTime: Math.round(avgResponseTime),
      },
    };
  }
}

// Export singleton instance
export default new ServiceProxy();



