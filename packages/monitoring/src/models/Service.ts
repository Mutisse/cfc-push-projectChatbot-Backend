import mongoose, { Schema, Document } from 'mongoose';

export interface IService extends Document {
  name: string;
  type: string;
  description?: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  checkInterval: number;
  environment: string;
  metadata?: Record<string, any>;
  dependencies?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    description: { type: String },
    url: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['healthy', 'unhealthy', 'unknown'],
      default: 'unknown' 
    },
    lastCheck: { type: Date, default: Date.now },
    checkInterval: { type: Number, default: 300 }, // 5 minutes in seconds
    environment: { type: String, default: 'production' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    dependencies: { type: [String], default: [] }
  },
  { timestamps: true }
);

// Indexes
ServiceSchema.index({ status: 1 });
ServiceSchema.index({ environment: 1 });

export const Service = mongoose.model<IService>('Service', ServiceSchema);