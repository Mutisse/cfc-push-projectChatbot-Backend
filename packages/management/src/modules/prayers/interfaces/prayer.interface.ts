// src/modules/prayers/interfaces/prayer.interface.ts
import { Document, Types } from 'mongoose';

export interface IPrayer extends Document {
  // Informações Pessoais
  name: string;
  phone: string;
  email?: string;
  
  // Pedido de Oração
  prayerType: 'saude' | 'familia' | 'financas' | 'emocional' | 'decisoes' | 
               'protecao' | 'trabalho' | 'estudos' | 'relacionamentos' | 'fe' | 'outro';
  description: string;
  
  // Urgência e Status
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_prayer' | 'completed' | 'archived';
  
  // Contato
  contactPreference: 'whatsapp' | 'phone' | 'email' | 'none';
  
  // Metadados de Oração
  prayerCount: number;
  lastPrayedAt?: Date;
  
  // Atribuição e Acompanhamento
  assignedTo?: Types.ObjectId;
  notes?: string;
  
  // Auditoria
  createdBy: string;
  updatedBy?: string;
  
  // Soft Delete
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  
  // Timestamps automáticos
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  isDeleted: boolean;
  isUrgent: boolean;
  isActive: boolean;
  
  // Métodos
  softDelete(deletedBy?: string): Promise<IPrayer>;
  restore(): Promise<IPrayer>;
}

// DTOs (Data Transfer Objects)
export interface CreatePrayerDto {
  name: string;
  phone: string;
  email?: string;
  prayerType: string;
  description: string;
  urgency?: string;
  contactPreference?: string;
  notes?: string;
}

export interface UpdatePrayerDto {
  name?: string;
  phone?: string;
  email?: string;
  prayerType?: string;
  description?: string;
  urgency?: string;
  status?: string;
  contactPreference?: string;
  prayerCount?: number;
  lastPrayedAt?: Date;
  assignedTo?: string;
  notes?: string;
}

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
  deleted: number;
  byUrgency: {
    low: number;
    medium: number;
    high: number;
  };
  byType: Record<string, number>;
  recentActivity: number;
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