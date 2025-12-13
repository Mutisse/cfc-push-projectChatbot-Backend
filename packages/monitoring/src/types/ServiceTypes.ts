// packages/monitoring/src/repositories/types/ServiceTypes.ts

export interface ServiceFilters {
  status?: string;
  type?: string;
  environment?: string;
  category?: string;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface ServiceStats {
  total: number;
  healthy: number;
  degraded: number;
  unhealthy: number;
  stopped: number;
  unknown: number;
  byType: Record<string, number>;
  byEnvironment: Record<string, number>;
  avgUptime: number;
  avgResponseTime: number;
}

export interface ServicePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}