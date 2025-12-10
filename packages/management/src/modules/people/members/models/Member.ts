// src/modules/people/members/models/Member.ts - CORRIGIDO
import { Schema, model } from "mongoose";
import { IMemberRegistration } from "../interfaces/member-registration.interface";

const memberRegistrationSchema = new Schema<IMemberRegistration>(
  {
    // Dados Pessoais
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    maritalStatus: {
      type: String,
      enum: ["single", "married", "divorced", "widowed"],
      required: true,
      default: "single", // ← ADICIONADO valor padrão
    },

    // Endereço
    address: {
      street: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      province: {  // ← MODELO usa 'province'
        type: String,
        required: true,
        trim: true,
      },
      neighborhood: {
        type: String,
        required: true,
        trim: true,
      },
      residenceType: {
        type: String,
        enum: ["own", "rented", "family"],
        required: true,
        default: "family",
      },
    },

    // Contato de Emergência
    emergencyContact: {
      name: String,
      phoneNumber: String,
      relationship: String,
    },

    // Informações Espirituais - CORRIGIDO: 'howDidYouHear' já existe na interface
    baptismStatus: {
      type: String,
      enum: ["baptized", "not_baptized", "want_baptism"],
      required: true,
      default: "not_baptized",
    },
    baptismDate: Date,
    previousChurch: String,
    spiritualInterest: [
      {
        type: String,
        trim: true,
      },
    ],
    howDidYouHear: {  // ← Este campo JÁ ESTÁ na interface corrigida
      type: String,
      enum: ["friend", "social_media", "event", "other"],
      required: true,
      default: "friend",
    },

    // Campos extras para compatibilidade
    howFoundChurch: {  // ← ADICIONADO para frontend
      type: String,
      trim: true,
    },
    profession: {  // ← ADICIONADO para frontend
      type: String,
      trim: true,
    },
    familyMembers: {  // ← ADICIONADO para frontend
      type: Number,
      default: 0,
    },

    // Status do Pedido
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    approvedBy: {
      type: Schema.Types.Mixed, // ← MUDADO para Mixed para aceitar string ou ObjectId
      ref: "User",
    },
    approvedAt: Date,
    rejectionReason: String,

    // Metadata
    source: {
      type: String,
      enum: ["chatbot", "website", "in_person", "manual", "referral"], // ← ADICIONADO opções
      required: true,
      default: "website",
    },
    notes: String,
    internalNotes: String,

    // Soft Delete
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para otimização
memberRegistrationSchema.index({ status: 1 });
memberRegistrationSchema.index({ phoneNumber: 1 });
memberRegistrationSchema.index({ createdAt: -1 });
memberRegistrationSchema.index({ source: 1 });
memberRegistrationSchema.index({ deletedAt: 1 });

export const MemberRegistration = model<IMemberRegistration>(
  "MemberRegistration",
  memberRegistrationSchema
);