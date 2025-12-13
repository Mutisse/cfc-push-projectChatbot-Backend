// src/modules/prayers/interfaces/prayer.interface.ts
import { Document, Types } from "mongoose";

export interface IPrayer extends Document {
  name: string;
  phone: string;
  email?: string;
  prayerType: string;
  description: string;
  urgency: "low" | "medium" | "high";
  status: "pending" | "in_prayer" | "completed" | "archived";
  contactPreference: "whatsapp" | "phone" | "email" | "none";
  prayerCount?: number;
  lastPrayedAt?: Date;
  assignedTo?: Types.ObjectId;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePrayerDto {
  name: string;
  phone: string;
  email?: string;
  prayerType: string;
  description: string;
  urgency?: "low" | "medium" | "high";
  contactPreference?: "whatsapp" | "phone" | "email" | "none";
  status?: "pending" | "in_prayer" | "completed" | "archived";
  notes?: string;
  assignedTo?: string;
}

export type UpdatePrayerDto = Partial<CreatePrayerDto>;

export interface FilterPrayerDto {
  status?: string;
  urgency?: string;
  prayerType?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  includeDeleted?: boolean;
}

export interface PrayerStats {
  total: number;
  pending: number;
  in_prayer: number;
  completed: number;
  archived: number;
  byUrgency: {
    low: number;
    medium: number;
    high: number;
  };
  byType: Record<string, number>;
  weeklyTrend: number[];
}

export interface PrayerSummary {
  _id: string;
  name: string;
  phone: string;
  prayerType: string;
  description: string;
  urgency: string;
  status: string;
  prayerCount: number;
  lastPrayedAt?: Date;
  createdAt: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}
