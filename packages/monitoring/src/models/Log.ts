import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  source: string;
  service?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  stackTrace?: string;
  userId?: string;
  ipAddress?: string;
  endpoint?: string;
}

const LogSchema = new Schema<ILog>(
  {
    level: { 
      type: String, 
      enum: ['debug', 'info', 'warn', 'error', 'fatal'],
      required: true 
    },
    message: { type: String, required: true },
    source: { type: String, required: true },
    service: { type: String, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    stackTrace: { type: String },
    userId: { type: String },
    ipAddress: { type: String },
    endpoint: { type: String }
  },
  { timestamps: true }
);

// Indexes for common queries
LogSchema.index({ level: 1, timestamp: -1 });
LogSchema.index({ source: 1, timestamp: -1 });

export const Log = mongoose.model<ILog>('Log', LogSchema);