import { Request, Response } from "express";
import ServiceService from "../services/ServiceService";

export class ServiceController {
  async getServices(req: Request, res: Response): Promise<Response> {
    try {
      const {
        status,
        type,
        environment,
        search,
        page = "1",
        limit = "10",
      } = req.query;

      const filters = {
        status: status as string,
        type: type as string,
        environment: environment as string,
        search: search as string,
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

  async getServicesHealth(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await ServiceService.getServicesHealth();
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

  async restartService(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const result = await ServiceService.restartService(id);

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

  async stopService(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const result = await ServiceService.stopService(id);

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

  async startService(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const result = await ServiceService.startService(id);

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

  async forceHealthCheck(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const result = await ServiceService.forceHealthCheck(id);

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

      const result = await ServiceService.getServiceMetricsPeriod(
        id,
        timeRange as "1h" | "24h" | "7d" | "30d"
      );

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

      const result = await ServiceService.bulkUpdateServicesStatus(
        serviceIds,
        action as "start" | "stop" | "restart"
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

  // Adicione estes métodos à classe ServiceController:

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

      // Mock de logs do serviço
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

      // Mock de configuração
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

      // Mock de dependências
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
}

export default new ServiceController();
