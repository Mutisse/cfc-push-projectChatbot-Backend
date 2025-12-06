import mongoose, { Schema, Document } from 'mongoose';

export interface IDashboardMetric extends Document {
  icon: string;
  title: string;
  value: string;
  trend: string;
  trendIcon: string;
  trendClass: string;
  subtitle?: string;
  service: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DashboardMetricSchema = new Schema<IDashboardMetric>(
  {
    icon: { type: String, required: true },
    title: { type: String, required: true },
    value: { type: String, required: true },
    trend: { type: String, required: true },
    trendIcon: { type: String, required: true },
    trendClass: { type: String, required: true },
    subtitle: { type: String },
    service: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Index para consultas rápidas
DashboardMetricSchema.index({ service: 1, timestamp: -1 });
DashboardMetricSchema.index({ title: 1 });

export const DashboardMetric = mongoose.model<IDashboardMetric>('DashboardMetric', DashboardMetricSchema);