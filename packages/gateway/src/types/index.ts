// Tipos comuns para o gateway

export interface ServiceHealth {
  name: string;
  url: string;
  status: 'healthy' | 'unhealthy' | 'down';
  lastChecked: Date;
  responseTime?: number;
}

export interface GatewayConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  services: {
    chatbot: string;
    management: string;
    notify: string;
  };
}

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  signature?: string;
}

export interface OrchestrationRequest {
  action: string;
  service: 'chatbot' | 'management' | 'notify';
  payload: any;
  callbackUrl?: string;
}

export interface GatewayResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Tipos para autenticação
export interface UserToken {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  exp: number;
  iat: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
  expiresIn: number;
}

// Tipos para auditoria
export interface AuditLogEntry {
  id: string;
  action: string;
  service: string;
  userId?: string;
  details: any;
  timestamp: Date;
}