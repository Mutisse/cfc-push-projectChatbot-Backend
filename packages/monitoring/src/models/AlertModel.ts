// packages/monitoring/src/database/models/AlertModel.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAlert extends Document {
  title: string;
  description?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'open' | 'acknowledged' | 'resolved' | 'muted';
  service: string;
  source?: string;
  assignedTo?: string;
  assignee?: string;
  notes?: string;
  metrics?: {
    currentValue?: number;
    threshold?: number;
    change?: number;
    responseTime?: number;
    errorRate?: number;
    uptime?: number;
    [key: string]: any;
  };
  metadata?: {
    serviceHealth?: any;
    creationSource?: string;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  mutedAt?: Date;
  mutedUntil?: Date;
  resolvedBy?: string;
  acknowledgedBy?: string;
  mutedBy?: string;
  escalationLevel?: number;
  duration?: string;
}

const AlertSchema = new Schema<IAlert>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['critical', 'high', 'medium', 'low', 'info'],
      default: 'info',
    },
    status: {
      type: String,
      required: true,
      enum: ['open', 'acknowledged', 'resolved', 'muted'],
      default: 'open',
    },
    service: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
      default: 'monitoring-service',
    },
    assignedTo: {
      type: String,
      trim: true,
    },
    assignee: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    metrics: {
      type: Schema.Types.Mixed,
      default: {},
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    resolvedAt: {
      type: Date,
    },
    acknowledgedAt: {
      type: Date,
    },
    mutedAt: {
      type: Date,
    },
    mutedUntil: {
      type: Date,
    },
    resolvedBy: {
      type: String,
      trim: true,
    },
    acknowledgedBy: {
      type: String,
      trim: true,
    },
    mutedBy: {
      type: String,
      trim: true,
    },
    escalationLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    duration: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'alerts',
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Índices para performance
AlertSchema.index({ service: 1, severity: 1 });
AlertSchema.index({ status: 1, createdAt: -1 });
AlertSchema.index({ createdAt: -1 });
AlertSchema.index({ resolvedAt: 1 });
AlertSchema.index({ 'metadata.creationSource': 1 });

// Virtual para status legível
AlertSchema.virtual('statusLabel').get(function (this: IAlert) {
  const statusMap: Record<string, string> = {
    open: 'Ativo',
    acknowledged: 'Reconhecido',
    resolved: 'Resolvido',
    muted: 'Silenciado',
  };
  return statusMap[this.status] || this.status;
});

// Virtual para severidade legível
AlertSchema.virtual('severityLabel').get(function (this: IAlert) {
  const severityMap: Record<string, string> = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Médio',
    low: 'Baixo',
    info: 'Informação',
  };
  return severityMap[this.severity] || this.severity;
});

export const AlertModel: Model<IAlert> = mongoose.model<IAlert>('Alert', AlertSchema);