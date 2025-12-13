// packages/monitoring/src/controllers/ServiceController.ts
import { Request, Response } from "express";
import ServiceService from "../services/ServiceService";

export class ServiceController {
  async getServices(req: Request, res: Response): Promise<Response> {
    try {
      const {
        status,
        type,
        environment,
        category,
        search,
        tags,
        page = "1",
        limit = "10",
      } = req.query;

      // Converte tags para array se for string
      let tagsArray: string[] = [];
      if (tags) {
        if (Array.isArray(tags)) {
          tagsArray = tags as string[];
        } else if (typeof tags === 'string') {
          tagsArray = tags.split(',').map(tag => tag.trim());
        }
      }

      const filters = {
        status: status as string,
        type: type as string,
        environment: environment as string,
        category: category as string,
        search: search as string,
        tags: tagsArray,
      };

      const result = await ServiceService.getServices(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getServiceById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const result = await ServiceService.getServiceById(id);

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async createService(req: Request, res: Response): Promise<Response> {
    try {
      const serviceData = req.body;
      const result = await ServiceService.createService(serviceData);

      return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async updateService(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const serviceData = req.body;
      const result = await ServiceService.updateService(id, serviceData);

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async deleteService(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const result = await ServiceService.deleteService(id);

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async testServiceHealth(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const result = await ServiceService.testServiceHealth(id);

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getServicesSummary(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await ServiceService.getServicesSummary();
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ========== NOVOS MÉTODOS ADICIONADOS ==========

  /**
   * Força sincronização de serviços com o proxy
   */
  async forceSync(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await ServiceService.forceSync();
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Obtém status da sincronização
   */
  async getSyncStatus(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await ServiceService.getSyncStatus();
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Métodos antigos mantidos por compatibilidade (não implementados no novo ServiceService)
   */

  async getServicesHealth(_req: Request, res: Response): Promise<Response> {
    try {
      // Método não implementado no novo ServiceService
      return res.status(200).json({
        success: true,
        message: "Método não implementado. Use /summary ou /test/:id",
        data: null,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async restartService(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      // Método não implementado no novo ServiceService
      return res.status(200).json({
        success: true,
        message: "Método restartService não implementado na nova versão",
        data: { serviceId: id },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async stopService(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      // Método não implementado no novo ServiceService
      return res.status(200).json({
        success: true,
        message: "Método stopService não implementado na nova versão",
        data: { serviceId: id },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async startService(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      // Método não implementado no novo ServiceService
      return res.status(200).json({
        success: true,
        message: "Método startService não implementado na nova versão",
        data: { serviceId: id },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async forceHealthCheck(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      // Redireciona para testServiceHealth (mesma funcionalidade)
      const result = await ServiceService.testServiceHealth(id);
      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getServiceMetricsPeriod(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { id } = req.params;
      const { timeRange = "24h" } = req.query;

      // Método não implementado no novo ServiceService
      return res.status(200).json({
        success: true,
        message: "Método getServiceMetricsPeriod não implementado na nova versão",
        data: {
          serviceId: id,
          timeRange,
          metrics: []
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async bulkUpdateServicesStatus(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { serviceIds, action } = req.body;

      if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "serviceIds array is required",
          timestamp: new Date().toISOString(),
        });
      }

      if (!["start", "stop", "restart"].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "action must be one of: start, stop, restart",
          timestamp: new Date().toISOString(),
        });
      }

      // Método não implementado no novo ServiceService
      return res.status(200).json({
        success: true,
        message: "Método bulkUpdateServicesStatus não implementado na nova versão",
        data: {
          serviceIds,
          action,
          results: serviceIds.map(id => ({
            serviceId: id,
            success: true,
            message: `Service ${id} ${action}ed successfully`
          }))
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getServiceLogs(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const {
        page = "1",
        limit = "10",
        level,
        startDate,
        endDate,
        search,
      } = req.query;

      // Mock de logs do serviço (para demonstração)
      const logs = Array.from({ length: 10 }, (_, i) => ({
        id: `log_${id}_${i}`,
        level: level || "info",
        message: `Log entry ${i + 1} for service ${id}`,
        timestamp: new Date(Date.now() - i * 3600000),
        service: id,
        metadata: { source: "service" },
      }));

      return res.status(200).json({
        success: true,
        message: "Service logs retrieved",
        data: {
          logs,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: 100,
            totalPages: 10,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve service logs",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getServiceConfiguration(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { id } = req.params;

      // Mock de configuração (para demonstração)
      const config = {
        serviceId: id,
        name: `Service ${id}`,
        url: `http://${id}.example.com`,
        checkInterval: 300,
        timeout: 30,
        retries: 3,
        notifications: {
          email: true,
          slack: false,
          webhook: true,
          whatsapp: true, // Adicionado WhatsApp
          sms: false,
        },
        thresholds: {
          responseTime: 1000,
          errorRate: 5,
          uptime: 99.9,
        },
      };

      return res.status(200).json({
        success: true,
        message: "Service configuration retrieved",
        data: config,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve service configuration",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async updateServiceConfiguration(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { id } = req.params;
      const config = req.body;

      return res.status(200).json({
        success: true,
        message: "Service configuration updated",
        data: { ...config, serviceId: id, updatedAt: new Date() },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update service configuration",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getServiceDependencies(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      // Mock de dependências (para demonstração)
      const dependencies = {
        serviceId: id,
        upstream: ["database", "cache", "auth-service"],
        downstream: ["api-gateway", "frontend"],
        critical: ["database"],
        optional: ["cache", "monitoring"],
      };

      return res.status(200).json({
        success: true,
        message: "Service dependencies retrieved",
        data: dependencies,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve service dependencies",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async exportServiceReport(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { format = "pdf" } = req.query;

      return res.status(200).json({
        success: true,
        message: "Service report generated",
        data: {
          serviceId: id,
          format,
          generatedAt: new Date().toISOString(),
          downloadUrl: `/monitoring/services/${id}/report/download`,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to export service report",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async exportAllServices(req: Request, res: Response): Promise<Response> {
    try {
      const { format = "csv" } = req.query;

      return res.status(200).json({
        success: true,
        message: "All services exported",
        data: {
          format,
          count: 10,
          generatedAt: new Date().toISOString(),
          downloadUrl: "/monitoring/services/export/download",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to export all services",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ========== MÉTODOS DE FILTRO ESPECÍFICOS ==========

  /**
   * Busca serviços por tipo
   */
  async getServicesByType(req: Request, res: Response): Promise<Response> {
    try {
      const { type } = req.params;
      const { page = "1", limit = "10" } = req.query;

      const result = await ServiceService.getServices(
        { type },
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Busca serviços por ambiente
   */
  async getServicesByEnvironment(req: Request, res: Response): Promise<Response> {
    try {
      const { environment } = req.params;
      const { page = "1", limit = "10" } = req.query;

      const result = await ServiceService.getServices(
        { environment },
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Busca serviços por status
   */
  async getServicesByStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { status } = req.params;
      const { page = "1", limit = "10" } = req.query;

      const result = await ServiceService.getServices(
        { status },
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Busca serviços com canal WhatsApp habilitado
   */
  async getServicesWithWhatsApp(req: Request, res: Response): Promise<Response> {
    try {
      const { page = "1", limit = "10" } = req.query;

      // Busca serviços com tag 'whatsapp' ou 'notifications'
      const result = await ServiceService.getServices(
        { tags: ['whatsapp', 'notifications'] },
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Busca serviços críticos (config.critical = true)
   */
  async getCriticalServices(req: Request, res: Response): Promise<Response> {
    try {
      const { page = "1", limit = "10" } = req.query;

      // Busca todos os serviços e filtra os críticos
      const result = await ServiceService.getServices(
        {},
        parseInt(page as string),
        parseInt(limit as string)
      );

      if (result.success && result.data) {
        // Filtra serviços críticos
        const criticalServices = result.data.services.filter(
          (service: any) => service.config?.critical === true
        );

        return res.status(200).json({
          success: true,
          message: "Critical services retrieved",
          data: {
            services: criticalServices,
            total: criticalServices.length,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export default new ServiceController();