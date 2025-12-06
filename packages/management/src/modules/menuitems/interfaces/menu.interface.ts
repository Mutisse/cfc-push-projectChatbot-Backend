import { Document, Types } from 'mongoose';

export interface IMenu extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  type: 'submenu' | 'info' | 'link' | 'action';
  parentId: Types.ObjectId | null;
  order: number;
  isActive: boolean;
  requiredRole: string;
  icon: string;
  quickReply: boolean;
  content: string;
  url: string;
  payload: string;
  keywords: string[];
  metadata: Record<string, unknown>;
  deletedAt: Date | null; // ← NOVO: Soft delete
  __v: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMenuDto {
  title: string;
  description: string;
  type: 'submenu' | 'info' | 'link' | 'action';
  parentId?: string | null;
  order: number;
  isActive: boolean;
  requiredRole: string;
  icon: string;
  quickReply: boolean;
  content?: string;
  url?: string;
  payload?: string;
  keywords?: string[];
  metadata?: Record<string, unknown>;
}

export type UpdateMenuDto = Partial<CreateMenuDto>;

export interface MenuResponse {
  _id: string;
  title: string;
  description: string;
  type: 'submenu' | 'info' | 'link' | 'action';
  parentId: string | null;
  order: number;
  isActive: boolean;
  requiredRole: string;
  icon: string;
  quickReply: boolean;
  content: string;
  url: string;
  payload: string;
  keywords: string[];
  metadata: Record<string, unknown>;
  deletedAt: string | null; // ← NOVO
  __v: number;
  createdAt: string;
  updatedAt: string;
}