// src/models/Session.ts - VERSÃO COMPLETA CORRIGIDA
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  serviceType: {
    type: String,
    default: 'chatbot'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'],
    default: 'active'
  },
  context: {
    type: {
      currentMenuId: {
        type: String,
        default: null
      },
      currentSubmenuId: {  // 🎯 CAMPO ADICIONADO
        type: String,
        default: null
      },
      navigationHistory: {
        type: [String],
        default: []
      },
      userPreferences: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map()
      }
    },
    default: () => ({
      currentMenuId: null,
      currentSubmenuId: null,  // 🎯 DEFAULT ADICIONADO
      navigationHistory: [],
      userPreferences: new Map()
    })
  },
  interactions: {
    type: [{
      timestamp: {
        type: Date,
        default: Date.now
      },
      userInput: String,
      botResponse: String,
      menuId: String,
      action: String
    }],
    default: []
  },
  completedAt: {
    type: Date,
    default: null
  },
  completionReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  collection: 'chatbot_sessions'
});

// Índices para performance
sessionSchema.index({ phoneNumber: 1, status: 1 });
sessionSchema.index({ lastInteraction: 1 });
sessionSchema.index({ sessionId: 1 });

// Middleware para garantir valores default ATUALIZADO
sessionSchema.pre('save', function(next) {
  const doc = this as any;
  
  if (!doc.context) {
    doc.context = {
      currentMenuId: null,
      currentSubmenuId: null,  // 🎯 GARANTIDO
      navigationHistory: [],
      userPreferences: new Map()
    };
  }
  
  if (!doc.context.currentMenuId) {
    doc.context.currentMenuId = null;
  }
  
  if (!doc.context.currentSubmenuId) {
    doc.context.currentSubmenuId = null;
  }
  
  if (!doc.context.navigationHistory) {
    doc.context.navigationHistory = [];
  }
  
  if (!doc.context.userPreferences) {
    doc.context.userPreferences = new Map();
  }
  
  if (!doc.interactions) {
    doc.interactions = [];
  }
  
  next();
});

export const SessionModel = mongoose.model('chatbot_sessions', sessionSchema);