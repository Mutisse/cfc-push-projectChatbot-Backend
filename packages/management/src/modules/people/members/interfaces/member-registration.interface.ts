// src/modules/people/members/interfaces/member-registration.interface.ts
import { Document, Types } from "mongoose";

export interface IMemberRegistration extends Document {
  _id: Types.ObjectId;

  // Dados Pessoais
  fullName: string;
  phoneNumber: string;
  phone?: string; // ← ADICIONE ESTE CAMPO SE NÃO EXISTIR

  email?: string;
  dateOfBirth: Date;
  gender: "male" | "female";
  maritalStatus: "single" | "married" | "divorced" | "widowed";

  // Endereço - CORRIGIDO para bater com o modelo
  address: {
    street: string;
    city: string;
    province: string; // ← MODELO usa 'province', não 'region'
    neighborhood: string;
    residenceType: "own" | "rented" | "family";
  };

  // Informações de Contato
  emergencyContact?: {
    name: string;
    phoneNumber: string;
    relationship: string;
  };

  // Informações Espirituais
  baptismStatus: "baptized" | "not_baptized" | "want_baptism";
  baptismDate?: Date;
  previousChurch?: string;
  spiritualInterest?: string[];
  howDidYouHear: "friend" | "social_media" | "event" | "other"; // ← ADICIONADO para bater com modelo

  // Status do Pedido
  status: "pending" | "approved" | "rejected" | "cancelled";
  approvedBy?: Types.ObjectId | string;
  approvedAt?: Date;
  rejectionReason?: string;

  // Metadata
  source: "chatbot" | "website" | "in_person";
  notes?: string;
  internalNotes?: string;

  // Campos extras para compatibilidade
  howFoundChurch?: string; // ← Mantido para frontend
  profession?: string;
  familyMembers?: number;

  // Soft Delete
  deletedAt: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// DTO para criação - compatível com frontend
export interface CreateMemberRegistrationDto {
  // Campos obrigatórios
  fullName: string;
  phoneNumber: string;
  dateOfBirth: Date | string;
  gender: "male" | "female";
  maritalStatus?: "single" | "married" | "divorced" | "widowed";

  // Endereço (modelo usa 'province', frontend pode enviar 'region')
  address: {
    street: string;
    city: string;
    province: string; // ← Nome do campo no MODELO
    neighborhood: string;
    residenceType?: "own" | "rented" | "family";
  };

  // Campos espirituais
  baptismStatus?: "baptized" | "not_baptized" | "want_baptism";
  howDidYouHear?: "friend" | "social_media" | "event" | "other";
  howFoundChurch?: string; // ← Para frontend

  // Outros campos
  email?: string;
  profession?: string;
  familyMembers?: number;
  previousChurch?: string;
  notes?: string;
  source?: "chatbot" | "website" | "in_person";
  status?: "pending" | "approved" | "rejected" | "cancelled";
  emergencyContact?: {
    name: string;
    phoneNumber: string;
    relationship: string;
  };

  // Para flexibilidade
  [key: string]: any;
}

// DTO para atualização - todos os campos são opcionais
export interface UpdateMemberRegistrationDto {
  fullName?: string;
  phoneNumber?: string;
  dateOfBirth?: Date | string;
  gender?: "male" | "female";
  maritalStatus?: "single" | "married" | "divorced" | "widowed";

  address?: {
    street?: string;
    city?: string;
    province?: string;
    neighborhood?: string;
    residenceType?: "own" | "rented" | "family";
  };

  email?: string;
  profession?: string;
  familyMembers?: number;
  baptismStatus?: "baptized" | "not_baptized" | "want_baptism";
  baptismDate?: Date | string;
  previousChurch?: string;
  spiritualInterest?: string[];
  howDidYouHear?: "friend" | "social_media" | "event" | "other";
  howFoundChurch?: string;

  emergencyContact?: {
    name?: string;
    phoneNumber?: string;
    relationship?: string;
  };

  status?: "pending" | "approved" | "rejected" | "cancelled";
  rejectionReason?: string;
  source?: "chatbot" | "website" | "in_person";
  notes?: string;
  internalNotes?: string;

  // Para flexibilidade
  [key: string]: any;
}

// Interface para resposta da API
export interface MemberRegistrationResponse {
  _id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  address: {
    street: string;
    city: string;
    province: string;
    neighborhood: string;
    residenceType: string;
  };
  emergencyContact?: {
    name: string;
    phoneNumber: string;
    relationship: string;
  };
  baptismStatus: string;
  baptismDate?: string;
  previousChurch?: string;
  spiritualInterest?: string[];
  howDidYouHear: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  source: string;
  notes?: string;
  internalNotes?: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
