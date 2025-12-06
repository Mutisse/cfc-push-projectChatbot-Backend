import { Document, Types } from "mongoose";

export interface IMemberRegistration extends Document {
  _id: Types.ObjectId;

  // Dados Pessoais
  fullName: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth: Date;
  gender: "male" | "female";
  maritalStatus: "single" | "married" | "divorced" | "widowed";

  // Endereço
  address: {
    street: string;
    city: string;
    province: string;
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
  spiritualInterest: string[];
  howDidYouHear: "friend" | "social_media" | "event" | "other";

  // Status do Pedido
  status: "pending" | "approved" | "rejected" | "cancelled";
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;

  // Metadata
  source: "chatbot" | "website" | "in_person";
  notes?: string;
  internalNotes?: string;

  // Soft Delete
  deletedAt: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMemberRegistrationDto {
  fullName: string;
  phoneNumber: string;
  email?: string;
  dateOfBirth: Date;
  gender: "male" | "female";
  maritalStatus: "single" | "married" | "divorced" | "widowed";
  address: {
    street: string;
    city: string;
    province: string;
    neighborhood: string;
    residenceType: "own" | "rented" | "family";
  };
  emergencyContact?: {
    name: string;
    phoneNumber: string;
    relationship: string;
  };
  baptismStatus: "baptized" | "not_baptized" | "want_baptism";
  baptismDate?: Date;
  previousChurch?: string;
  spiritualInterest: string[];
  howDidYouHear: "friend" | "social_media" | "event" | "other";
  source: "chatbot" | "website" | "in_person";
  notes?: string;
}

export interface UpdateMemberRegistrationDto
  extends Partial<CreateMemberRegistrationDto> {
  status?: "pending" | "approved" | "rejected" | "cancelled";
  rejectionReason?: string;
  internalNotes?: string;
}

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
  spiritualInterest: string[];
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
