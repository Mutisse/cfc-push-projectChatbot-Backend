// src/modules/analytics/types/models.ts
import { Types } from 'mongoose';

export interface BaseModel {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PrayerRequestModel extends BaseModel {
  title?: string;
  name?: string;
  description?: string;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  status?: string;
  createdAt?: Date;
}

export interface MemberRegistrationModel extends BaseModel {
  name?: string;
  email?: string;
  registrationComplete?: boolean;
  status?: string;
  createdAt?: Date;
}

export interface PastoralVisitModel extends BaseModel {
  location?: string;
  address?: string;
  purpose?: string;
  createdAt?: Date;
}

export interface NotificationModel extends BaseModel {
  title?: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  createdAt?: Date;
}

// Tipo genérico para objetos .lean()
export type LeanDocument<T> = Omit<T, '_id'> & { _id: string };