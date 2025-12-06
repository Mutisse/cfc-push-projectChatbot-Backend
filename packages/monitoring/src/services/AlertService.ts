import { AlertRepository, AlertFilters } from "../repositories/AlertRepository";
import { ALERT_SEVERITY, ALERT_STATUS } from "../config/constants";

export interface AlertServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export class AlertService {
  private alertRepository: AlertRepository;

  constructor() {
    this.alertRepository = new AlertRepository();
  }

  async getAlerts(
    filters: AlertFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<AlertServiceResponse> {
    try {
      const { alerts, total } = await this.alertRepository.findAll(
        filters,
        page,
        limit
      );

      return {
        success: true,
        message: "Alerts retrieved successfully",
        data: {
          alerts,
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
        message: "Failed to retrieve alerts",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAlertById(id: string): Promise<AlertServiceResponse> {
    try {
      const alert = await this.alertRepository.findById(id);

      if (!alert) {
        return {
          success: false,
          message: "Alert not found",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: "Alert retrieved successfully",
        data: alert,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to retrieve alert",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async createAlert(alertData: any): Promise<AlertServiceResponse> {
    try {
      const alert = await this.alertRepository.create(alertData);

      return {
        success: true,
        message: "Alert created successfully",
        data: alert,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to create alert",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async updateAlert(id: string, alertData: any): Promise<AlertServiceResponse> {
    try {
      const alert = await this.alertRepository.update(id, alertData);

      if (!alert) {
        return {
          success: false,
          message: "Alert not found",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: "Alert updated successfully",
        data: alert,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to update alert",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async deleteAlert(id: string): Promise<AlertServiceResponse> {
    try {
      const deleted = await this.alertRepository.delete(id);

      if (!deleted) {
        return {
          success: false,
          message: "Alert not found",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: "Alert deleted successfully",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to delete alert",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAlertStats(): Promise<AlertServiceResponse> {
    try {
      const stats = await this.alertRepository.getStats();

      return {
        success: true,
        message: "Alert stats retrieved successfully",
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to retrieve alert stats",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // No método getAlertChartData, adicione comentário ou use o parâmetro:
  async getAlertChartData(
    timeRange: "24h" | "7d" | "30d"
  ): Promise<AlertServiceResponse> {
    try {
      // Use o timeRange para determinar o intervalo de tempo
      const now = new Date();
      let hoursBack = 24;

      if (timeRange === "7d") {
        hoursBack = 24 * 7;
      } else if (timeRange === "30d") {
        hoursBack = 24 * 30;
      }

      // Mock data for chart baseado no timeRange
      const chartData = [
        {
          timestamp: new Date(now.getTime() - hoursBack * 60 * 60 * 1000),
          count: 10,
        },
        {
          timestamp: new Date(
            now.getTime() - hoursBack * 0.75 * 60 * 60 * 1000
          ),
          count: 15,
        },
        {
          timestamp: new Date(now.getTime() - hoursBack * 0.5 * 60 * 60 * 1000),
          count: 8,
        },
        {
          timestamp: new Date(
            now.getTime() - hoursBack * 0.25 * 60 * 60 * 1000
          ),
          count: 20,
        },
        { timestamp: now, count: 12 },
      ];

      return {
        success: true,
        message: "Chart data retrieved successfully",
        data: chartData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to retrieve chart data",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async resolveAlert(
    id: string,
    resolvedBy: string
  ): Promise<AlertServiceResponse> {
    try {
      const alert = await this.alertRepository.resolveAlert(id, resolvedBy);

      if (!alert) {
        return {
          success: false,
          message: "Alert not found",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: "Alert resolved successfully",
        data: alert,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to resolve alert",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async acknowledgeAlert(
    id: string,
    acknowledgedBy: string
  ): Promise<AlertServiceResponse> {
    try {
      const alert = await this.alertRepository.acknowledgeAlert(
        id,
        acknowledgedBy
      );

      if (!alert) {
        return {
          success: false,
          message: "Alert not found",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: "Alert acknowledged successfully",
        data: alert,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to acknowledge alert",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async muteAlert(
    id: string,
    mutedBy: string,
    mutedUntil?: Date
  ): Promise<AlertServiceResponse> {
    try {
      const alert = await this.alertRepository.muteAlert(
        id,
        mutedBy,
        mutedUntil
      );

      if (!alert) {
        return {
          success: false,
          message: "Alert not found",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: "Alert muted successfully",
        data: alert,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to mute alert",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async unmuteAlert(id: string): Promise<AlertServiceResponse> {
    try {
      const alert = await this.alertRepository.unmuteAlert(id);

      if (!alert) {
        return {
          success: false,
          message: "Alert not found",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: "Alert unmuted successfully",
        data: alert,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to unmute alert",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async escalateAlert(id: string): Promise<AlertServiceResponse> {
    try {
      const alert = await this.alertRepository.escalateAlert(id);

      if (!alert) {
        return {
          success: false,
          message: "Alert not found",
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: "Alert escalated successfully",
        data: alert,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to escalate alert",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAlertSettings(): Promise<AlertServiceResponse> {
    try {
      const settings = {
        severityLevels: ALERT_SEVERITY,
        statuses: ALERT_STATUS,
        defaultMuteDuration: 24, // hours
        autoResolveAfter: 48, // hours
        escalationRules: [
          { level: 1, afterMinutes: 30 },
          { level: 2, afterMinutes: 60 },
          { level: 3, afterMinutes: 120 },
        ],
      };

      return {
        success: true,
        message: "Alert settings retrieved successfully",
        data: settings,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to retrieve alert settings",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async saveAlertSettings(settings: any): Promise<AlertServiceResponse> {
    try {
      // In real app, save to database
      return {
        success: true,
        message: "Alert settings saved successfully",
        data: settings,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to save alert settings",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async bulkResolveAlerts(
    alertIds: string[],
    resolvedBy: string
  ): Promise<AlertServiceResponse> {
    try {
      const count = await this.alertRepository.bulkResolve(
        alertIds,
        resolvedBy
      );

      return {
        success: true,
        message: `${count} alerts resolved successfully`,
        data: { count },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to bulk resolve alerts",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async bulkAcknowledgeAlerts(
    alertIds: string[],
    acknowledgedBy: string
  ): Promise<AlertServiceResponse> {
    try {
      const count = await this.alertRepository.bulkAcknowledge(
        alertIds,
        acknowledgedBy
      );

      return {
        success: true,
        message: `${count} alerts acknowledged successfully`,
        data: { count },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to bulk acknowledge alerts",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async clearAlerts(alertIds: string[]): Promise<AlertServiceResponse> {
    try {
      const count = await this.alertRepository.bulkDelete(alertIds);

      return {
        success: true,
        message: `${count} alerts cleared successfully`,
        data: { count },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to clear alerts",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getRecentAlerts(limit: number = 20): Promise<AlertServiceResponse> {
    try {
      const alerts = await this.alertRepository.getRecent(limit);

      return {
        success: true,
        message: "Recent alerts retrieved successfully",
        data: alerts,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to retrieve recent alerts",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getCriticalAlerts(): Promise<AlertServiceResponse> {
    try {
      const alerts = await this.alertRepository.getCritical();

      return {
        success: true,
        message: "Critical alerts retrieved successfully",
        data: alerts,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to retrieve critical alerts",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export default new AlertService();
