import { Schema, model } from "mongoose";
import { IWelcomeMessage } from "../interfaces/welcome-message.interface";

const welcomeMessageSchema = new Schema<IWelcomeMessage>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    instructions: {
      type: String,
      required: true,
      trim: true,
    },
    quickTip: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    version: {
      type: String,
      default: "1.0",
    },
    deletedAt: {
      // ← NOVO: Campo para soft delete
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

// Garantir que só tenha uma mensagem ativa
welcomeMessageSchema.index(
  { isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

// Índice para queries de soft delete
welcomeMessageSchema.index({ deletedAt: 1 });

export const WelcomeMessage = model<IWelcomeMessage>(
  "WelcomeMessage",
  welcomeMessageSchema
);
