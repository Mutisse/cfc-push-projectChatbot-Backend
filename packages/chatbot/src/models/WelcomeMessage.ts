// src/models/WelcomeMessage.ts
import { Schema, model, Document } from 'mongoose';

export interface IWelcomeMessage extends Document {
  title: string;
  message: string;
  instructions: string;
  quickTip: string;
  isActive: boolean;
  version: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const WelcomeMessageSchema = new Schema<IWelcomeMessage>({
  title: { type: String, required: true },
  message: { type: String, required: true },
  instructions: { type: String, required: true },
  quickTip: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  version: { type: String, default: '1.0' },
  deletedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { 
  collection: 'welcomemessages', // Nome EXATO da collection
  timestamps: false // Já temos createdAt e updatedAt manualmente
});

export const WelcomeMessage = model<IWelcomeMessage>('welcomemessages', WelcomeMessageSchema);