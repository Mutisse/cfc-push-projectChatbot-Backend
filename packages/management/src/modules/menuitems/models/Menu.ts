import { Schema, model, Types } from 'mongoose';
import { IMenu } from '../interfaces/menu.interface';

const menuSchema = new Schema<IMenu>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['submenu', 'info', 'link', 'action'],
    required: true
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Menu',
    default: null
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  requiredRole: {
    type: String,
    default: 'user'
  },
  icon: {
    type: String,
    default: ''
  },
  quickReply: {
    type: Boolean,
    default: false
  },
  content: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    default: ''
  },
  payload: {
    type: String,
    default: ''
  },
  keywords: [{
    type: String
  }],
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  deletedAt: { // ← NOVO: Campo para soft delete
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  versionKey: '__v'
});

// Índices para melhor performance
menuSchema.index({ parentId: 1, order: 1 });
menuSchema.index({ isActive: 1 });
menuSchema.index({ type: 1 });
menuSchema.index({ deletedAt: 1 }); // ← NOVO: Índice para soft delete

export const Menu = model<IMenu>('menuitems', menuSchema);