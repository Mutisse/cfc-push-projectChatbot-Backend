// src/services/serverManager.ts
import axios from "axios";
import config, { ServerConfig } from "../config/app.config";

// Tipos para axios (versão 1.x)
type AxiosInstance = ReturnType<typeof axios.create>;

// Interface para resposta de health check
interface HealthCheckResponse {
  status?: string;
  uptime?: number;
  version?: string;
  name?: string;
  [key: string]: any;
}

export interface ServerStatus {
  name: string;
  host: string;
  port: number;
  status: "up" | "down" | "unknown";
  responseTime?: number;
  lastCheck: Date;
  error?: string;
  uptime?: number;
  version?: string;
}

export class ServerManager {
  private servers: Map<string, ServerConfig>;
  private statuses: Map<string, ServerStatus>;
  private axiosInstances: Map<string, AxiosInstance>;
  private checkInterval?: NodeJS.Timeout;

  constructor() {
    this.servers = new Map(Object.entries(config.SERVERS));
    this.statuses = new Map();
    this.axiosInstances = new Map();

    this.initializeInstances();
    this.startHealthChecks();
  }

  private initializeInstances(): void {
    for (const [key, server] of this.servers.entries()) {
      const axiosInstance = axios.create({
        baseURL: `${server.protocol}://${server.host}:${server.port}`,
        timeout: server.timeout,
        headers: {
          "User-Agent": `${config.APP_NAME}/1.0`,
          "X-Server-Manager": "true",
        },
      });

      // Interceptor para logging
      axiosInstance.interceptors.request.use(
        (request: any) => {
          console.debug(
            `[${key}] Request to: ${request.baseURL}${request.url}`
          );
          return request;
        },
        (error: any) => Promise.reject(error)
      );

      this.axiosInstances.set(key, axiosInstance);
    }
  }

  /**
   * Verificar saúde de um servidor específico
   */
  async checkServerHealth(serverKey: string): Promise<ServerStatus> {
    const server = this.servers.get(serverKey);
    if (!server) {
      throw new Error(`Server ${serverKey} not found`);
    }

    const startTime = Date.now();
    let status: ServerStatus = {
      name: server.name,
      host: server.host,
      port: server.port,
      status: "unknown",
      lastCheck: new Date(),
      responseTime: undefined,
      error: undefined,
    };

    try {
      // ✅ ROTAS DE HEALTH CORRETAS PARA CADA SERVIÇO
      const getHealthPath = (key: string): string => {
        switch (key) {
          case 'chatbot':
            return '/api/chatbot/health';  // ✅ Chatbot tem rota específica
          case 'management':
            return '/health';  // ✅ Management agora tem /health
          case 'monitoring':
            return '/health';  // ⚠️ Verificar se Monitoring tem /health
          case 'notify':
            return '/health';  // ⚠️ Verificar se Notify tem /health
          default:
            return server.path || '/health';
        }
      };

      const healthPath = getHealthPath(serverKey);

      const response = await axios.get<HealthCheckResponse>(
        `${server.protocol}://${server.host}:${server.port}${healthPath}`,
        {
          timeout: server.timeout,
          headers: {
            "User-Agent": `${config.APP_NAME}/1.0`,
            "X-Health-Check": "true",
          },
        }
      );

      const responseTime = Date.now() - startTime;
      const responseData = response.data;

      status.status = response.status === 200 ? "up" : "down";
      status.responseTime = responseTime;

      // Extrair informações adicionais se disponíveis
      if (responseData) {
        status.uptime = responseData.uptime;
        status.version = responseData.version;
        if (responseData.name) {
          status.name = responseData.name;
        }
      }

      console.log(`[${serverKey}] ${server.name} is UP (${responseTime}ms)`);
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      status.status = "down";
      status.responseTime = responseTime;
      status.error = error?.message || "Unknown error";

      console.error(
        `[${serverKey}] ${server.name} is DOWN:`,
        error?.message || error
      );
    }

    this.statuses.set(serverKey, status);
    return status;
  }

  /**
   * Verificar saúde de todos os servidores
   */
  async checkAllServers(): Promise<Record<string, ServerStatus>> {
    console.log("Checking all servers health...");

    const checks = Array.from(this.servers.keys()).map(async (key) => {
      return await this.checkServerHealth(key);
    });

    const results = await Promise.allSettled(checks);
    const statusMap: Record<string, ServerStatus> = {};

    results.forEach((result, index) => {
      const key = Array.from(this.servers.keys())[index];
      const server = this.servers.get(key);

      if (result.status === "fulfilled") {
        statusMap[key] = result.value;
      } else {
        statusMap[key] = {
          name: server?.name || "Unknown",
          host: server?.host || "unknown",
          port: server?.port || 0,
          status: "down",
          lastCheck: new Date(),
          error:
            result.reason instanceof Error
              ? result.reason.message
              : "Unknown error",
        };
      }
    });

    // Log do resumo
    const upCount = Object.values(statusMap).filter(
      (s) => s.status === "up"
    ).length;
    const totalCount = Object.keys(statusMap).length;

    console.log(
      `Health check summary: ${upCount}/${totalCount} services UP`
    );

    return statusMap;
  }

  /**
   * Iniciar verificações periódicas de saúde
   */
  startHealthChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      try {
        console.log("Running scheduled health checks...");
        await this.checkAllServers();
      } catch (error: any) {
        console.error("Error in health check interval:", error);
      }
    }, config.HEALTH_CHECK_INTERVAL);

    console.log(
      `Health checks started (interval: ${config.HEALTH_CHECK_INTERVAL}ms)`
    );
  }

  /**
   * Parar verificações de saúde
   */
  stopHealthChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
      console.log("Health checks stopped");
    }
  }

  /**
   * Obter status atual de todos os servidores
   */
  getServerStatuses(): Record<string, ServerStatus> {
    const statuses: Record<string, ServerStatus> = {};
    this.statuses.forEach((status, key) => {
      statuses[key] = status;
    });
    return statuses;
  }

  /**
   * Obter status de um servidor específico
   */
  getServerStatus(serverKey: string): ServerStatus | undefined {
    return this.statuses.get(serverKey);
  }

  /**
   * Obter instância Axios para um servidor específico
   */
  getAxiosInstance(serverKey: string): AxiosInstance | undefined {
    return this.axiosInstances.get(serverKey);
  }

  /**
   * Adicionar novo servidor dinamicamente
   */
  addServer(key: string, serverConfig: ServerConfig): void {
    this.servers.set(key, serverConfig);

    const axiosInstance = axios.create({
      baseURL: `${serverConfig.protocol}://${serverConfig.host}:${serverConfig.port}`,
      timeout: serverConfig.timeout,
      headers: {
        "User-Agent": `${config.APP_NAME}/1.0`,
        "X-Server-Manager": "true",
      },
    });

    this.axiosInstances.set(key, axiosInstance);

    // Verificar saúde do novo servidor
    this.checkServerHealth(key).catch((error) => {
      console.error(`Failed to check health of new server ${key}:`, error);
    });

    console.log(`Added server: ${key} (${serverConfig.name})`);
  }

  /**
   * Remover servidor
   */
  removeServer(key: string): void {
    const server = this.servers.get(key);
    if (!server) {
      console.warn(`Server ${key} not found for removal`);
      return;
    }

    this.servers.delete(key);
    this.axiosInstances.delete(key);
    this.statuses.delete(key);

    console.log(`Removed server: ${key} (${server.name})`);
  }

  /**
   * Atualizar configuração de servidor existente
   */
  updateServer(key: string, updates: Partial<ServerConfig>): boolean {
    const server = this.servers.get(key);
    if (!server) {
      console.warn(`Server ${key} not found for update`);
      return false;
    }

    const updatedServer = { ...server, ...updates };
    this.servers.set(key, updatedServer);

    // Recriar instância axios se URL mudou
    if (updates.host || updates.port || updates.protocol) {
      const axiosInstance = axios.create({
        baseURL: `${updatedServer.protocol}://${updatedServer.host}:${updatedServer.port}`,
        timeout: updatedServer.timeout,
        headers: {
          "User-Agent": `${config.APP_NAME}/1.0`,
          "X-Server-Manager": "true",
        },
      });

      this.axiosInstances.set(key, axiosInstance);
    }

    console.log(`Updated server: ${key}`);
    return true;
  }

  /**
   * Gerar relatório de status
   */
  generateReport(): {
    timestamp: string;
    summary: {
      total: number;
      up: number;
      down: number;
      uptimePercentage: string;
    };
    servers: Record<string, ServerStatus>;
    environment: string;
  } {
    const statuses = this.getServerStatuses();
    const total = Object.keys(statuses).length;
    const up = Object.values(statuses).filter((s) => s.status === "up").length;
    const down = total - up;
    const uptimePercentage =
      total > 0 ? ((up / total) * 100).toFixed(2) : "0.00";

    return {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        up,
        down,
        uptimePercentage,
      },
      servers: statuses,
      environment: config.NODE_ENV,
    };
  }

  /**
   * Verificar se todos os serviços estão saudáveis
   */
  areAllServicesHealthy(): boolean {
    const statuses = this.getServerStatuses();
    return Object.values(statuses).every((service) => service.status === "up");
  }

  /**
   * Obter serviços problemáticos
   */
  getProblematicServices(): Array<{ key: string; status: ServerStatus }> {
    const problematic: Array<{ key: string; status: ServerStatus }> = [];

    this.statuses.forEach((status, key) => {
      if (status.status !== "up") {
        problematic.push({ key, status });
      }
    });

    return problematic;
  }

  /**
   * Reinicializar todas as instâncias (útil após mudanças de configuração)
   */
  reinitialize(): void {
    console.log("Reinitializing all server instances...");

    // Parar verificações de saúde
    this.stopHealthChecks();

    // Limpar instâncias existentes
    this.axiosInstances.clear();
    this.statuses.clear();

    // Recriar instâncias
    this.initializeInstances();

    // Reiniciar verificações
    this.startHealthChecks();

    console.log("Server instances reinitialized");
  }
}

// Instância singleton
export const serverManager = new ServerManager();
export default serverManager;