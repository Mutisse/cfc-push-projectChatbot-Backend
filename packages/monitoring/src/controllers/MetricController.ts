// packages/monitoring/src/controllers/MetricController.ts - VERSÃO CORRIGIDA
import { Request, Response } from "express";
import MetricService from "../services/MetricService";

export class MetricController {
  // ✅ Métodos estáticos para compatibilidade com rotas
  static async getMetrics(req: Request, res: Response): Promise<Response> {
    try {
      const { page = "1", limit = "10" } = req.query;

      const result = await MetricService.getMetrics(
        {},
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

  static async getRealtimeMetrics(
    _req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const result = await MetricService.getRealtimeMetrics();
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

  static async getRequestsData(req: Request, res: Response): Promise<Response> {
    try {
      const { timeRange = "24h", startDate, endDate } = req.query;

      const result = await MetricService.getRequestsData(
        timeRange as string,
        startDate as string,
        endDate as string
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

  static async getPerformanceMetrics(
    _req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const result = await MetricService.getPerformanceMetrics();
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

  static async getHttpMethodDistribution(
    _req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const result = await MetricService.getHttpMethodDistribution();
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

  static async getStatusCodeDistribution(
    _req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const result = await MetricService.getStatusCodeDistribution();
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

  static async getServiceMetrics(
    _req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const result = await MetricService.getServiceMetrics();
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

  static async getSystemResourceMetrics(
    _req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const result = await MetricService.getSystemResourceMetrics();
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

  static async getTrendAnalysis(
    _req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const result = await MetricService.getTrendAnalysis();
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

  // Outros métodos podem retornar dados padrão
  static async exportMetrics(_req: Request, res: Response): Promise<Response> {
    return res.status(200).json({
      success: true,
      message: "Export ready",
      data: { message: "Export feature coming soon" },
      timestamp: new Date().toISOString(),
    });
  }

  static async createMetric(req: Request, res: Response): Promise<Response> {
    return res.status(201).json({
      success: true,
      message: "Metric created",
      data: req.body,
      timestamp: new Date().toISOString(),
    });
  }

  static async createBatchMetrics(
    req: Request,
    res: Response
  ): Promise<Response> {
    return res.status(201).json({
      success: true,
      message: "Batch metrics created",
      data: req.body.metrics,
      timestamp: new Date().toISOString(),
    });
  }

  static async compareServices(req: Request, res: Response): Promise<Response> {
    return res.status(200).json({
      success: true,
      message: "Services compared",
      data: req.body,
      timestamp: new Date().toISOString(),
    });
  }
}

// ✅ Exporta a classe, não instância
export default MetricController;
