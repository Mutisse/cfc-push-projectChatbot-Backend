import mongoose, { Schema, Document } from 'mongoose';
import { ALERT_SEVERITY, ALERT_STATUS } from '../config/constants';

export interface IAlert extends Document {
  title: string;
  description: string;
  severity: typeof ALERT_SEVERITY[keyof typeof ALERT_SEVERITY];
  status: typeof ALERT_STATUS[keyof typeof ALERT_STATUS];
  service: string;
  source: string;
  metadata?: Record<string, any>;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  mutedUntil?: Date;
  mutedBy?: string;
  escalationLevel?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { 
      type: String, 
      enum: Object.values(ALERT_SEVERITY),
      required: true 
    },
    status: { 
      type: String, 
      enum: Object.values(ALERT_STATUS),
      default: ALERT_STATUS.OPEN 
    },
    service: { type: String, required: true },
    source: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    acknowledgedBy: { type: String },
    acknowledgedAt: { type: Date },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
    mutedUntil: { type: Date },
    mutedBy: { type: String },
    escalationLevel: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Indexes for better query performance
AlertSchema.index({ service: 1, status: 1 });
AlertSchema.index({ severity: 1, createdAt: -1 });
AlertSchema.index({ status: 1, createdAt: -1 });

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);