// src/types/log.types.ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogSource = 
  | 'gateway' 
  | 'notify' 
  | 'chatbot' 
  | 'management' 
  | 'monitoring' 
  | 'system' 
  | 'proxy' 
  | 'performance-monitor';

export interface ILog {
  _id?: string;          // MongoDB id (opcional na criação)
  id?: string;           // ID alternativo (opcional)
  timestamp: Date;
  level: LogLevel;
  source: LogSource;
  message: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
  userId?: string;
  ipAddress?: string;
  endpoint?: string;
  service?: string;
  duration?: number;
  statusCode?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Alias LogEntry para compatibilidade
export type LogEntry = Required<Pick<ILog, 'id'>> & Omit<ILog, 'id'>;