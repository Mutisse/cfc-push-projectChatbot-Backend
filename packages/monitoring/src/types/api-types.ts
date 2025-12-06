export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message: string;
  error?: string;
  timestamp?: string;
}

export interface ExportResponse {
  success: boolean;
  data: {
    content: string | Buffer;
    filename: string;
    mimeType: string;
  };
  message: string;
  error?: string;
  timestamp?: string;
}

export interface SystemStatusResponse {
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  healthyServices: number;
  totalServices: number;
  activeAlerts: number;
  uptime: number;
  lastUpdated: Date;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: Date;
}