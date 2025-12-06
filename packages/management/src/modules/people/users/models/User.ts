// src/models/User.ts
import { Schema, model } from 'mongoose';
import { IUser } from '../../users/interface/user.interface';

const userSchema = new Schema<IUser>({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'grupo_pastoral', 'leader'],
    required: true
  },
  status: {
    type: String,
    enum: ['ativo', 'desativado', 'bloqueado'],
    default: 'ativo'
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Índices para performance
userSchema.index({ phoneNumber: 1 });
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });
userSchema.index({ deletedAt: 1 });

export const User = model<IUser>('User', userSchema);