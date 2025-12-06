import { Request } from 'express';

// Extendendo o Request do Express para incluir usuário
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email?: string;
  };
}

// Tipos para respostas padronizadas
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Tipos para filtros
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

// Tipos para erros
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export type SafeError = {
  message: string;
  code?: string;
  details?: any;
};