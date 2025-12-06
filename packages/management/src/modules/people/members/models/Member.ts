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
      province: {
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
      },
    },

    // Contato de Emergência
    emergencyContact: {
      name: String,
      phoneNumber: String,
      relationship: String,
    },

    // Informações Espirituais
    baptismStatus: {
      type: String,
      enum: ["baptized", "not_baptized", "want_baptism"],
      required: true,
    },
    baptismDate: Date,
    previousChurch: String,
    spiritualInterest: [
      {
        type: String,
        trim: true,
      },
    ],
    howDidYouHear: {
      type: String,
      enum: ["friend", "social_media", "event", "other"],
      required: true,
    },

    // Status do Pedido
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    rejectionReason: String,

    // Metadata
    source: {
      type: String,
      enum: ["chatbot", "website", "in_person"],
      required: true,
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
