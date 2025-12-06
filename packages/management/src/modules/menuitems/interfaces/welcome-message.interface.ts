import { Document, Types } from 'mongoose';

export interface IWelcomeMessage extends Document {
  _id: Types.ObjectId;
  title: string;
  message: string;
  instructions: string;
  quickTip: string;
  isActive: boolean;
  version: string;
  deletedAt: Date | null; // ← NOVO: Soft delete
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export interface CreateWelcomeMessageDto {
  title: string;
  message: string;
  instructions: string;
  quickTip: string;
  isActive: boolean;
  version: string;
}

export type UpdateWelcomeMessageDto = Partial<CreateWelcomeMessageDto>;

export interface WelcomeMessageResponse {
  _id: string;
  title: string;
  message: string;
  instructions: string;
  quickTip: string;
  isActive: boolean;
  version: string;
  deletedAt: string | null; // ← NOVO
  createdAt: string;
  updatedAt: string;
  __v: number;
}