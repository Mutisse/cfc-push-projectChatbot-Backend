// src/models/Menu.ts - MODELO CORRIGIDO E COMPLETO
import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['submenu', 'info', 'link', 'action'],
    default: 'info'
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    default: null
  },
  order: {
    type: Number,
    required: true,
    min: 0
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
  isActive: {
    type: Boolean,
    default: true
  },
  // ⚠️ ADICIONE ESTES CAMPOS QUE EXISTEM NA SUA COLLECTION:
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
  keywords: [{
    type: String
  }],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'menuitems'  // ⚠️ MANTENHA 'menuitems'
});

// Índices para performance
menuSchema.index({ parentId: 1, order: 1 });
menuSchema.index({ isActive: 1 });
menuSchema.index({ order: 1 });
menuSchema.index({ parentId: 1, isActive: 1 });

// Crie o modelo com o NOME EXATO 'MenuItem' e especifique a collection
export const MenuModel = mongoose.model('MenuItem', menuSchema, 'menuitems');