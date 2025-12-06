import { Schema, model, Document, Model } from "mongoose";

// Interface para o documento
export interface IAuditLog extends Document {
  action: string;
  service: "gateway" | "chatbot" | "management" | "monitoring" | "notify";
  userId?: string;
  entityType?: string;
  entityId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  sourceService?: "chatbot" | "management" | "monitoring" | "notify";
  targetService?: "chatbot" | "management" | "monitoring" | "notify";
  status: "success" | "failed" | "pending";
  responseTime?: number;
  timestamp: Date;
}

// Interface para os métodos estáticos do modelo
interface IAuditLogModel extends Model<IAuditLog> {
  log(data: Partial<IAuditLog>): Promise<IAuditLog>;
  logProxy(
    source: IAuditLog["service"],
    target: IAuditLog["service"],
    action: string,
    details: any,
    status?: IAuditLog["status"],
    responseTime?: number
  ): Promise<IAuditLog>;
  logEvent(
    event: string,
    sourceService: IAuditLog["sourceService"],
    targetService: IAuditLog["targetService"],
    data: any,
    status?: IAuditLog["status"]
  ): Promise<IAuditLog>;
  logOrchestration(
    action: string,
    data: any,
    services: { from?: string; to?: string },
    status?: IAuditLog["status"]
  ): Promise<IAuditLog>;
  getStats(timeRange?: "hour" | "day" | "week"): Promise<any[]>;
  cleanupOldLogs(daysToKeep?: number): Promise<number>;
}

const AuditLogSchema = new Schema<IAuditLog, IAuditLogModel>(
  {
    action: {
      type: String,
      required: true,
      index: true,
      enum: [
        // Ações do Gateway
        "gateway_start",
        "gateway_shutdown",
        "health_check",
        "service_status_check",

        // Ações de Proxy
        "proxy_request",
        "proxy_response",
        "proxy_error",

        // Ações de Orquestração
        "event_received",
        "event_processed",
        "event_failed",
        "notification_created",
        "notification_sent",
        "notification_failed",

        // Ações de Serviços
        "webhook_received",
        "webhook_processed",
        "webhook_failed",
        "service_call",
        "service_response",

        // Ações Específicas
        "member_approved",
        "prayer_request",
        "visit_scheduled",
        "status_changed",
        "alert_triggered",
        "analytics_recorded",
      ],
    },
    service: {
      type: String,
      required: true,
      enum: ["gateway", "chatbot", "management", "monitoring", "notify"],
      index: true,
    },
    sourceService: {
      type: String,
      enum: ["chatbot", "management", "monitoring", "notify"],
      index: true,
    },
    targetService: {
      type: String,
      enum: ["chatbot", "management", "monitoring", "notify"],
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    entityType: {
      type: String,
      index: true,
    },
    entityId: {
      type: String,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: String,
    userAgent: String,
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
      index: true,
    },
    responseTime: {
      type: Number, // em milissegundos
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    collection: "gateway_audit_logs",
    timestamps: true,
    versionKey: false,
  }
);

// ========== INDEXES PARA PERFORMANCE ==========

// Para buscar logs por serviço e ação
AuditLogSchema.index({ service: 1, action: 1, timestamp: -1 });

// Para monitoramento de fluxo entre serviços
AuditLogSchema.index({ sourceService: 1, targetService: 1, timestamp: -1 });

// Para análise de performance
AuditLogSchema.index({ status: 1, responseTime: 1 });

// Para análise temporal
AuditLogSchema.index({ timestamp: -1, action: 1 });

// Para auditoria de usuários
AuditLogSchema.index({ userId: 1, timestamp: -1 });

// Para análise de entidades
AuditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });

// ========== MÉTODOS ESTÁTICOS ==========

// Log simplificado
AuditLogSchema.statics.log = function (data: Partial<IAuditLog>) {
  return this.create({
    ...data,
    timestamp: new Date(),
  });
};

// Log de proxy
AuditLogSchema.statics.logProxy = function (
  source: IAuditLog["service"],
  target: IAuditLog["service"],
  action: string,
  details: any,
  status: IAuditLog["status"] = "success",
  responseTime?: number
) {
  return this.create({
    action: `proxy_${action}`,
    service: "gateway",
    sourceService: source,
    targetService: target,
    details,
    status,
    responseTime,
    timestamp: new Date(),
  });
};

// Log de evento entre serviços
AuditLogSchema.statics.logEvent = function (
  event: string,
  sourceService: IAuditLog["sourceService"],
  targetService: IAuditLog["targetService"],
  data: any,
  status: IAuditLog["status"] = "success"
) {
  return this.create({
    action: `event_${event}`,
    service: "gateway",
    sourceService,
    targetService,
    details: data,
    status,
    timestamp: new Date(),
  });
};

// Log de orquestração
AuditLogSchema.statics.logOrchestration = function (
  action: string,
  data: any,
  services: { from?: string; to?: string },
  status: IAuditLog["status"] = "success"
) {
  return this.create({
    action: `orchestration_${action}`,
    service: "gateway",
    sourceService: services.from as any,
    targetService: services.to as any,
    details: data,
    status,
    timestamp: new Date(),
  });
};

// Método para estatísticas
AuditLogSchema.statics.getStats = async function (
  timeRange: "hour" | "day" | "week" = "day"
) {
  const now = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case "hour":
      startDate.setHours(now.getHours() - 1);
      break;
    case "day":
      startDate.setDate(now.getDate() - 1);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
  }

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
      },
    },
    {
      $facet: {
        // Total por serviço
        byService: [
          {
            $group: {
              _id: "$service",
              count: { $sum: 1 },
              success: {
                $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
              },
              failed: {
                $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
              },
              avgResponseTime: { $avg: "$responseTime" },
            },
          },
        ],
        // Total por ação
        byAction: [
          {
            $group: {
              _id: "$action",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        // Fluxo entre serviços
        serviceFlow: [
          {
            $match: {
              sourceService: { $ne: null },
              targetService: { $ne: null },
            },
          },
          {
            $group: {
              _id: {
                from: "$sourceService",
                to: "$targetService",
              },
              count: { $sum: 1 },
            },
          },
        ],
        // Estatísticas gerais
        summary: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              successRate: {
                $avg: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
              },
              avgResponseTime: { $avg: "$responseTime" },
            },
          },
        ],
      },
    },
  ]);
};

// Método para limpar logs antigos
AuditLogSchema.statics.cleanupOldLogs = async function (
  daysToKeep: number = 30
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate },
  });

  return result.deletedCount;
};

// Exportar modelo tipado
export const AuditLog = model<IAuditLog, IAuditLogModel>(
  "AuditLog",
  AuditLogSchema
);
export default AuditLog;
