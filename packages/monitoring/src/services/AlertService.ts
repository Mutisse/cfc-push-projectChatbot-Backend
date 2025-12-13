// packages/monitoring/src/services/AlertService.ts
import AlertRepository, { AlertFilters, AlertStats } from "../repositories/AlertRepository";
import { ALERT_SEVERITY, ALERT_STATUS } from "../config/constants";
import ServiceProxy, { ServiceHealth, ServiceMetrics } from "./ServiceProxy";
import { IAlert } from "../models/AlertModel";

// Tipos alinhados com MongoDB
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'muted';

// Tipos para UI (compatibilidade)
export type AlertStatusUI = 'active' | 'acknowledged' | 'resolved' | 'muted';

export interface AlertData {
  title: string;
  description?: string;
  severity: AlertSeverity;
  service: string;
  status?: AlertStatus;
  metrics?: {
    currentValue?: number;
    threshold?: number;
    change?: number;
    responseTime?: number;
    errorRate?: number;
    uptime?: number;
    [key: string]: any;
  };
  source?: string;
  assignedTo?: string;
  assignee?: string;
  notes?: string;
  metadata?: Record<string, any>;
  duration?: string;
  escalationLevel?: number;
}

export interface AlertUpdateData extends Partial<AlertData> {
  resolvedBy?: string;
  acknowledgedBy?: string;
  mutedBy?: string;
  mutedUntil?: Date;
}

export interface AlertSettings {
  severityLevels: Record<string, string>;
  statuses: Record<string, string>;
  defaultMuteDuration: number;
  autoResolveAfter: number;
  escalationRules: Array<{
    level: number;
    afterMinutes: number;
  }>;
  notificationChannels?: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
  };
}

export interface AlertServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface AlertChartData {
  label: string;
  critical: number;
  warning: number;
  info: number;
  criticalValue: number;
  warningValue: number;
  infoValue: number;
  timestamp: Date;
}

export interface EnrichedAlertStats extends AlertStats {
  servicesHealth?: {
    total: number;
    healthy: number;
    unhealthy: number;
    down: number;
    services: ServiceHealth[];
  };
}

export class AlertService {
  private alertRepository: typeof AlertRepository;
  private serviceProxy: typeof ServiceProxy;

  constructor() {
    this.alertRepository = AlertRepository;
    this.serviceProxy = ServiceProxy;
  }

  // Converte severidade para formato do MongoDB
  private normalizeSeverity(severity: string): AlertSeverity {
    const severityLower = severity.toLowerCase();
    
    const severityMap: Record<string, AlertSeverity> = {
      'critical': 'critical',
      'critico': 'critical',
      'critica': 'critical',
      'high': 'high',
      'alto': 'high',
      'alerta': 'high',
      'medium': 'medium',
      'medio': 'medium',
      'warning': 'medium', // WARNING mapeia para MEDIUM
      'avisos': 'medium',
      'low': 'low',
      'baixo': 'low',
      'info': 'info',
      'informação': 'info',
      'informacao': 'info',
      'information': 'info'
    };

    return severityMap[severityLower] || 'info';
  }

  // Converte status para formato do MongoDB
  private normalizeStatus(status: string): AlertStatus {
    const statusLower = status.toLowerCase();
    
    const statusMap: Record<string, AlertStatus> = {
      'active': 'open',
      'open': 'open',
      'aberto': 'open',
      'resolved': 'resolved',
      'resolvido': 'resolved',
      'acknowledged': 'acknowledged',
      'reconhecido': 'acknowledged',
      'muted': 'muted',
      'silenciado': 'muted'
    };

    return statusMap[statusLower] || 'open';
  }

  // Converte status do MongoDB para UI
  private statusToUI(status: AlertStatus): AlertStatusUI {
    return status === 'open' ? 'active' : status;
  }

  // Normaliza dados do alerta para o MongoDB
  private normalizeAlertData(data: AlertData): Partial<IAlert> {
    return {
      title: data.title,
      description: data.description,
      severity: this.normalizeSeverity(data.severity),
      service: data.service,
      status: data.status ? this.normalizeStatus(data.status) : 'open',
      metrics: data.metrics || {},
      source: data.source || 'monitoring-service',
      assignedTo: data.assignedTo,
      assignee: data.assignee,
      notes: data.notes,
      metadata: data.metadata || {},
      duration: data.duration,
      escalationLevel: data.escalationLevel || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Normaliza resposta para UI
  private normalizeAlertResponse(alert: IAlert | null): any {
    if (!alert) return null;
    
    const alertObj = alert.toObject ? alert.toObject() : alert;
    
    return {
      ...alertObj,
      id: alertObj._id?.toString(),
      _id: alertObj._id?.toString(),
      status: this.statusToUI(alertObj.status as AlertStatus),
      statusLabel: alertObj.status === 'open' ? 'Ativo' : 
                   alertObj.status === 'resolved' ? 'Resolvido' :
                   alertObj.status === 'acknowledged' ? 'Reconhecido' : 'Silenciado',
      severityLabel: alertObj.severity === 'critical' ? 'Crítico' :
                     alertObj.severity === 'high' ? 'Alto' :
                     alertObj.severity === 'medium' ? 'Médio' :
                     alertObj.severity === 'low' ? 'Baixo' : 'Informação',
      // Garantir que metrics sempre existe
      metrics: alertObj.metrics || {}
    };
  }

  async getAlerts(
    filters: AlertFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<AlertServiceResponse> {
    try {
      // Normalizar filtros para MongoDB
      const mongoFilters: AlertFilters = {
        ...filters,
        status: filters.status ? this.normalizeStatus(filters.status) : undefined
      };

      const result = await this.alertRepository.findAll(mongoFilters, page, limit);

      // Normalizar respostas para UI
      const normalizedAlerts = result.alerts.map(alert => this.normalizeAlertResponse(alert));

      return {
        success: true,
        message: "Alerts retrieved successfully",
        data: {
          alerts: normalizedAlerts,
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: Math.ceil(result.total / limit),
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

      const normalizedAlert = this.normalizeAlertResponse(alert);

      return {
        success: true,
        message: "Alert retrieved successfully",
        data: normalizedAlert,
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

  async createAlert(alertData: AlertData): Promise<AlertServiceResponse> {
    try {
      // Verificar saúde do serviço antes de criar alerta
      let serviceHealth = null;
      try {
        serviceHealth = await this.serviceProxy.checkServiceHealth(alertData.service);
      } catch {
        // Ignora erro de saúde se serviço não estiver configurado
      }
      
      // Normalizar e enriquecer dados
      const normalizedData = this.normalizeAlertData(alertData);
      
      const enrichedData: Partial<IAlert> = {
        ...normalizedData,
        metadata: {
          ...normalizedData.metadata,
          serviceHealth: serviceHealth ? {
            status: serviceHealth.status,
            responseTime: serviceHealth.responseTime,
            checkedAt: new Date()
          } : null,
          creationSource: 'monitoring-service'
        }
      };

      const alert = await this.alertRepository.create(enrichedData);
      const normalizedAlert = this.normalizeAlertResponse(alert);

      return {
        success: true,
        message: "Alert created successfully",
        data: normalizedAlert,
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

  async updateAlert(id: string, alertData: AlertUpdateData): Promise<AlertServiceResponse> {
    try {
      // Normalizar dados para MongoDB
      const updateData: Partial<IAlert> = { ...alertData };
      
      if (alertData.severity) {
        updateData.severity = this.normalizeSeverity(alertData.severity);
      }
      
      if (alertData.status) {
        updateData.status = this.normalizeStatus(alertData.status);
      }

      const alert = await this.alertRepository.update(id, updateData);

      if (!alert) {
        return {
          success: false,
          message: "Alert not found",
          timestamp: new Date().toISOString(),
        };
      }

      const normalizedAlert = this.normalizeAlertResponse(alert);

      return {
        success: true,
        message: "Alert updated successfully",
        data: normalizedAlert,
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

  async getAlertStats(): Promise<AlertServiceResponse<EnrichedAlertStats>> {
    try {
      const stats = await this.alertRepository.getStats();

      // Coletar métricas de saúde dos serviços
      let servicesHealth: ServiceHealth[] = [];
      try {
        servicesHealth = await this.serviceProxy.checkAllServicesHealth();
      } catch {
        // Ignora erro se não conseguir coletar saúde
      }
      
      // Adicionar estatísticas de saúde dos serviços
      const enrichedStats: EnrichedAlertStats = {
        ...stats,
        servicesHealth: {
          total: servicesHealth.length,
          healthy: servicesHealth.filter(s => s.status === 'healthy').length,
          unhealthy: servicesHealth.filter(s => s.status === 'unhealthy').length,
          down: servicesHealth.filter(s => s.status === 'down').length,
          services: servicesHealth
        }
      };

      return {
        success: true,
        message: "Alert stats retrieved successfully",
        data: enrichedStats,
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

  async getAlertChartData(
    timeRange: "24h" | "7d" | "30d"
  ): Promise<AlertServiceResponse<AlertChartData[]>> {
    try {
      // Usar método específico do repository para time range
      const alerts = await this.alertRepository.getAlertsByTimeRange(timeRange);
      
      // Agrupar por hora/dia
      const groupedData = this.groupAlertsForChart(alerts, timeRange);
      
      // Gerar dados para o gráfico
      const chartData = this.generateChartData(groupedData, timeRange);

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

  private groupAlertsForChart(alerts: IAlert[], timeRange: string): Record<string, any> {
    const groups: Record<string, any> = {};
    
    alerts.forEach(alert => {
      if (!alert.createdAt) return;
      
      const date = new Date(alert.createdAt);
      let key: string;
      
      if (timeRange === '24h') {
        key = `${date.getHours().toString().padStart(2, '0')}:00`;
      } else if (timeRange === '7d') {
        key = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      } else {
        key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      }
      
      if (!groups[key]) {
        groups[key] = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
      }
      
      const severity = alert.severity?.toLowerCase() || 'info';
      
      if (severity === 'critical') {
        groups[key].critical++;
      } else if (severity === 'high') {
        groups[key].high++;
      } else if (severity === 'medium') {
        groups[key].medium++;
      } else if (severity === 'low') {
        groups[key].low++;
      } else {
        groups[key].info++;
      }
    });
    
    return groups;
  }

  private generateChartData(groups: Record<string, any>, timeRange: string): AlertChartData[] {
    const labels = Object.keys(groups);
    if (labels.length === 0) {
      return [];
    }
    
    const maxValue = Math.max(
      ...Object.values(groups).map((g: any) => 
        Math.max(g.critical || 0, g.high || 0, g.medium || 0, g.low || 0, g.info || 0)
      )
    );
    
    return labels.map(label => {
      const group = groups[label] || { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
      const criticalValue = group.critical || 0;
      const warningValue = (group.high || 0) + (group.medium || 0); // high + medium como warning
      const infoValue = (group.low || 0) + (group.info || 0); // low + info como info
      
      return {
        label,
        critical: maxValue > 0 ? (criticalValue / maxValue) * 100 : 0,
        warning: maxValue > 0 ? (warningValue / maxValue) * 100 : 0,
        info: maxValue > 0 ? (infoValue / maxValue) * 100 : 0,
        criticalValue,
        warningValue,
        infoValue,
        timestamp: new Date()
      };
    });
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

      const normalizedAlert = this.normalizeAlertResponse(alert);

      return {
        success: true,
        message: "Alert resolved successfully",
        data: normalizedAlert,
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
      const alert = await this.alertRepository.acknowledgeAlert(id, acknowledgedBy);

      if (!alert) {
        return {
          success: false,
          message: "Alert not found",
          timestamp: new Date().toISOString(),
        };
      }

      const normalizedAlert = this.normalizeAlertResponse(alert);

      return {
        success: true,
        message: "Alert acknowledged successfully",
        data: normalizedAlert,
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
      const alert = await this.alertRepository.muteAlert(id, mutedBy, mutedUntil);

      if (!alert) {
        return {
          success: false,
          message: "Alert not found",
          timestamp: new Date().toISOString(),
        };
      }

      const normalizedAlert = this.normalizeAlertResponse(alert);

      return {
        success: true,
        message: "Alert muted successfully",
        data: normalizedAlert,
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

      const normalizedAlert = this.normalizeAlertResponse(alert);

      return {
        success: true,
        message: "Alert unmuted successfully",
        data: normalizedAlert,
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

      const normalizedAlert = this.normalizeAlertResponse(alert);

      return {
        success: true,
        message: "Alert escalated successfully",
        data: normalizedAlert,
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

  async getAlertSettings(): Promise<AlertServiceResponse<AlertSettings>> {
    try {
      const settings: AlertSettings = {
        severityLevels: ALERT_SEVERITY,
        statuses: ALERT_STATUS,
        defaultMuteDuration: 24,
        autoResolveAfter: 48,
        escalationRules: [
          { level: 1, afterMinutes: 30 },
          { level: 2, afterMinutes: 60 },
          { level: 3, afterMinutes: 120 },
        ],
        notificationChannels: {
          email: true,
          slack: false,
          webhook: false
        }
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

  async saveAlertSettings(settings: AlertSettings): Promise<AlertServiceResponse> {
    try {
      const validatedSettings: AlertSettings = {
        ...settings,
        defaultMuteDuration: Math.max(1, Math.min(settings.defaultMuteDuration, 168)),
        autoResolveAfter: Math.max(1, Math.min(settings.autoResolveAfter, 720))
      };

      return {
        success: true,
        message: "Alert settings saved successfully",
        data: validatedSettings,
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
      const count = await this.alertRepository.bulkResolve(alertIds, resolvedBy);

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
      const count = await this.alertRepository.bulkAcknowledge(alertIds, acknowledgedBy);

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
      const normalizedAlerts = alerts.map(alert => this.normalizeAlertResponse(alert));

      return {
        success: true,
        message: "Recent alerts retrieved successfully",
        data: normalizedAlerts,
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
      const normalizedAlerts = alerts.map(alert => this.normalizeAlertResponse(alert));

      return {
        success: true,
        message: "Critical alerts retrieved successfully",
        data: normalizedAlerts,
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

  async simulateAlert(serviceName: string): Promise<AlertServiceResponse> {
    try {
      // Verificar saúde do serviço
      let health: ServiceHealth = { status: 'down', responseTime: -1, service: serviceName };
      try {
        health = await this.serviceProxy.checkServiceHealth(serviceName);
      } catch {
        // Mantém o estado 'down' padrão
      }
      
      // Determinar severidade baseada na saúde
      let severity: AlertSeverity = 'info';
      if (health.status === 'down') severity = 'critical';
      else if (health.status === 'unhealthy') severity = 'high';
      
      // Criar alerta
      const alertData: AlertData = {
        title: `Health Check - ${serviceName}`,
        description: `Service ${serviceName} is ${health.status}. Response time: ${health.responseTime}ms`,
        severity: severity,
        service: serviceName,
        metrics: {
          responseTime: health.responseTime,
          currentValue: health.status === 'healthy' ? 100 : 
                       health.status === 'unhealthy' ? 50 : 0,
          uptime: health.status === 'healthy' ? 100 : 0
        },
        source: 'health-check',
        metadata: {
          healthCheck: true,
          simulation: true,
          healthData: health
        }
      };

      const result = await this.createAlert(alertData);

      return {
        success: result.success,
        message: `Alert simulated for ${serviceName}`,
        data: result.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to simulate alert",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getServicesHealth(): Promise<AlertServiceResponse> {
    try {
      const healthData = await this.serviceProxy.checkAllServicesHealth();
      
      return {
        success: true,
        message: "Services health retrieved successfully",
        data: healthData,
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

  async getServiceMetrics(serviceName: string): Promise<AlertServiceResponse> {
    try {
      const metrics = await this.serviceProxy.collectServiceMetrics(serviceName);
      
      if (!metrics) {
        return {
          success: false,
          message: `No metrics available for ${serviceName}`,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: `Metrics retrieved for ${serviceName}`,
        data: metrics,
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

  async testAlert(alertData: Partial<AlertData>): Promise<AlertServiceResponse> {
    try {
      const testAlert: AlertData = {
        title: alertData.title || 'Test Alert',
        description: alertData.description || 'This is a test alert',
        severity: alertData.severity || 'info',
        service: alertData.service || 'monitoring',
        status: 'open',
        source: 'test',
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
          ...alertData.metadata
        }
      };

      const result = await this.createAlert(testAlert);

      return {
        success: result.success,
        message: result.message || 'Alert test completed',
        data: result.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to test alert",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async searchAlerts(searchTerm: string, limit: number = 50): Promise<AlertServiceResponse> {
    try {
      const alerts = await this.alertRepository.searchAlerts(searchTerm, limit);
      const normalizedAlerts = alerts.map(alert => this.normalizeAlertResponse(alert));

      return {
        success: true,
        message: "Alerts searched successfully",
        data: normalizedAlerts,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to search alerts",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getAlertsByService(service: string, limit: number = 50): Promise<AlertServiceResponse> {
    try {
      const alerts = await this.alertRepository.getAlertsByService(service, limit);
      const normalizedAlerts = alerts.map(alert => this.normalizeAlertResponse(alert));

      return {
        success: true,
        message: `Alerts for service ${service} retrieved successfully`,
        data: normalizedAlerts,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve alerts for service ${service}`,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  async cleanupOldAlerts(days: number = 90): Promise<AlertServiceResponse> {
    try {
      const count = await this.alertRepository.cleanupOldAlerts(days);

      return {
        success: true,
        message: `${count} old alerts cleaned up successfully`,
        data: { count },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to cleanup old alerts",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Export singleton instance
export default new AlertService();