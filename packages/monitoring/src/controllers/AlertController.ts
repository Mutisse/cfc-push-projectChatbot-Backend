import { Request, Response } from "express";
import AlertService from "../services/AlertService";
import { AlertFilters } from "../repositories/AlertRepository";
import { ALERT_STATUS, ALERT_SEVERITY } from "../config/constants";

export class AlertController {
  async getAlerts(req: Request, res: Response): Promise<Response> {
    try {
      const {
        search,
        severity,
        status,
        service,
        startDate,
        endDate,
        source,
        page = "1",
        limit = "10",
      } = req.query;

      // Criar objeto de filtros usando type assertion
      const filters = {
        search: search as string | undefined,
        severity: severity as
          | (typeof ALERT_SEVERITY)[keyof typeof ALERT_SEVERITY]
          | undefined,
        status: status as
          | (typeof ALERT_STATUS)[keyof typeof ALERT_STATUS]
          | undefined,
        service: service as string | undefined,
        source: source as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      } as AlertFilters; // Usar type assertion aqui

      const result = await AlertService.getAlerts(
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

  async getAlertById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Alert ID is required",
          timestamp: new Date().toISOString(),
        });
      }

      const result = await AlertService.getAlertById(id);

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

  async createAlert(req: Request, res: Response): Promise<Response> {
    try {
      const alertData = req.body;
      const result = await AlertService.createAlert(alertData);

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

  async updateAlert(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Alert ID is required",
          timestamp: new Date().toISOString(),
        });
      }

      const alertData = req.body;
      const result = await AlertService.updateAlert(id, alertData);

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

  async deleteAlert(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Alert ID is required",
          timestamp: new Date().toISOString(),
        });
      }

      const result = await AlertService.deleteAlert(id);

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

  async getAlertStats(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await AlertService.getAlertStats();
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

  async getAlertChartData(req: Request, res: Response): Promise<Response> {
    try {
      const { timeRange = "24h" } = req.query;
      const result = await AlertService.getAlertChartData(
        timeRange as "24h" | "7d" | "30d"
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

  async resolveAlert(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Alert ID is required",
          timestamp: new Date().toISOString(),
        });
      }

      const { resolvedBy } = req.body;
      const result = await AlertService.resolveAlert(id, resolvedBy);

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

  async acknowledgeAlert(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Alert ID is required",
          timestamp: new Date().toISOString(),
        });
      }

      const { acknowledgedBy } = req.body;
      const result = await AlertService.acknowledgeAlert(id, acknowledgedBy);

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

  async muteAlert(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Alert ID is required",
          timestamp: new Date().toISOString(),
        });
      }

      const { mutedBy, mutedUntil } = req.body;
      const muteUntilDate = mutedUntil ? new Date(mutedUntil) : undefined;

      const result = await AlertService.muteAlert(id, mutedBy, muteUntilDate);
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

  async unmuteAlert(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Alert ID is required",
          timestamp: new Date().toISOString(),
        });
      }

      const result = await AlertService.unmuteAlert(id);

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

  async escalateAlert(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Alert ID is required",
          timestamp: new Date().toISOString(),
        });
      }

      const result = await AlertService.escalateAlert(id);

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

  async getAlertSettings(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await AlertService.getAlertSettings();
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

  async saveAlertSettings(req: Request, res: Response): Promise<Response> {
    try {
      const settings = req.body;
      const result = await AlertService.saveAlertSettings(settings);

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

  async bulkResolveAlerts(req: Request, res: Response): Promise<Response> {
    try {
      const { alertIds, resolvedBy } = req.body;

      if (!Array.isArray(alertIds) || alertIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "alertIds array is required",
          timestamp: new Date().toISOString(),
        });
      }

      const result = await AlertService.bulkResolveAlerts(alertIds, resolvedBy);
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

  async bulkAcknowledgeAlerts(req: Request, res: Response): Promise<Response> {
    try {
      const { alertIds, acknowledgedBy } = req.body;

      if (!Array.isArray(alertIds) || alertIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "alertIds array is required",
          timestamp: new Date().toISOString(),
        });
      }

      const result = await AlertService.bulkAcknowledgeAlerts(
        alertIds,
        acknowledgedBy
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

  async clearAlerts(req: Request, res: Response): Promise<Response> {
    try {
      const { alertIds } = req.body;

      if (!Array.isArray(alertIds) || alertIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "alertIds array is required",
          timestamp: new Date().toISOString(),
        });
      }

      const result = await AlertService.clearAlerts(alertIds);
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

  async getRecentAlerts(req: Request, res: Response): Promise<Response> {
    try {
      const { limit = "20" } = req.query;
      const result = await AlertService.getRecentAlerts(
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

  async getCriticalAlerts(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await AlertService.getCriticalAlerts();
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

export default new AlertController();
