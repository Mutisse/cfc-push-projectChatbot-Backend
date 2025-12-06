// src/models/DailyAnalyticsReport.ts
import { Schema, model, Document } from 'mongoose';

export interface IDailyAnalyticsReport extends Document {
  date: string; // Formato YYYY-MM-DD
  totalSessions: number;
  totalMessages: number;
  uniqueUsers: number;
  popularMenus: Array<{
    menuId: string;
    title?: string;
    count: number;
  }>;
  peakHours: number[]; // Array com 24 posições
  userRetention: string[]; // Array de hashes de telefone
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DailyAnalyticsReportSchema = new Schema<IDailyAnalyticsReport>({
  date: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  totalSessions: { type: Number, default: 0 },
  totalMessages: { type: Number, default: 0 },
  uniqueUsers: { type: Number, default: 0 },
  popularMenus: [{
    menuId: { type: String, required: true },
    title: String,
    count: { type: Number, default: 1 }
  }],
  peakHours: [{ type: Number, default: 0 }], // 24 horas
  userRetention: [String], // Hashes de telefone
  generatedAt: { type: Date, default: Date.now }
}, { 
  collection: 'daily_analytics_reports',
  timestamps: true 
});

export const DailyAnalyticsReport = model<IDailyAnalyticsReport>(
  'DailyAnalyticsReport', 
  DailyAnalyticsReportSchema
);