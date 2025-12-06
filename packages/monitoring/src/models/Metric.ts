import mongoose, { Schema, Document } from 'mongoose';

export interface IMetric extends Document {
  service: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

const MetricSchema = new Schema<IMetric>(
  {
    service: { type: String, required: true, index: true },
    name: { type: String, required: true, index: true },
    value: { type: Number, required: true },
    unit: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true },
    tags: { type: Schema.Types.Mixed, default: {} },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// Indexes for time-series queries
MetricSchema.index({ service: 1, name: 1, timestamp: -1 });
MetricSchema.index({ timestamp: -1 });

export const Metric = mongoose.model<IMetric>('Metric', MetricSchema);