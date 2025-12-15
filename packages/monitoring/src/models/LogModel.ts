// src/models/LogModel.ts
import mongoose, { Schema, Document } from "mongoose";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogSource =
  | "gateway"
  | "notify"
  | "chatbot"
  | "management"
  | "monitoring"
  | "system"
  | "proxy"
  | "performance-monitor";

export interface ILog extends Document {
  _id?: string;
  id?: string;
  level: LogLevel;
  message: string;
  source: LogSource;
  service?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
  userId?: string;
  ipAddress?: string;
  endpoint?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Adicione esta interface
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  source: LogSource;
  message: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
  userId?: string;
  ipAddress?: string;
  endpoint?: string;
  service?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const LogSchema = new Schema<ILog>(
  {
    level: {
      type: String,
      enum: ["debug", "info", "warn", "error", "fatal"],
      required: true,
    },
    message: { type: String, required: true },
    source: { type: String, required: true },
    service: { type: String, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    stackTrace: { type: String },
    userId: { type: String },
    ipAddress: { type: String },
    endpoint: { type: String },
  },
  { timestamps: true }
);

// Indexes for common queries
LogSchema.index({ level: 1, timestamp: -1 });
LogSchema.index({ source: 1, timestamp: -1 });

export const Log = mongoose.model<ILog>("Log", LogSchema);
export const LogModel = Log; 