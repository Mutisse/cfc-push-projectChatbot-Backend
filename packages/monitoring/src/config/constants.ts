// Alert constants
export const ALERT_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
} as const;

export const ALERT_STATUS = {
  OPEN: 'open',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
  MUTED: 'muted'
} as const;

// Log levels
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
} as const;

// Service types
export const SERVICE_TYPES = {
  API: 'api',
  DATABASE: 'database',
  CACHE: 'cache',
  QUEUE: 'queue',
  STORAGE: 'storage',
  AUTH: 'authentication',
  NOTIFICATION: 'notification',
  MONITORING: 'monitoring'
} as const;

// Metric types
export const METRIC_TYPES = {
  RESPONSE_TIME: 'response_time',
  REQUEST_COUNT: 'request_count',
  ERROR_COUNT: 'error_count',
  CPU_USAGE: 'cpu_usage',
  MEMORY_USAGE: 'memory_usage',
  DISK_USAGE: 'disk_usage',
  UPTIME: 'uptime',
  THROUGHPUT: 'throughput',
  LATENCY: 'latency'
} as const;

// Time ranges
export const TIME_RANGES = {
  HOUR_1: '1h',
  HOURS_24: '24h',
  DAYS_7: '7d',
  DAYS_30: '30d'
} as const;

// Export types
export const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  PDF: 'pdf',
  TEXT: 'text'
} as const;

// Dashboard refresh intervals
export const REFRESH_INTERVALS = {
  REALTIME: 5000, // 5 seconds
  FAST: 30000,    // 30 seconds
  NORMAL: 60000,  // 1 minute
  SLOW: 300000    // 5 minutes
} as const;

// Default limits
export const DEFAULT_LIMITS = {
  ALERTS_PER_PAGE: 10,
  LOGS_PER_PAGE: 20,
  SERVICES_PER_PAGE: 10,
  METRICS_PER_PAGE: 50,
  RECENT_ALERTS: 20,
  RECENT_LOGS: 50,
  ERROR_LOGS: 100,
  DASHBOARD_SERVICES: 10
} as const;

// Status colors
export const STATUS_COLORS = {
  HEALTHY: '#4CAF50',
  DEGRADED: '#FF9800',
  UNHEALTHY: '#F44336',
  UNKNOWN: '#9E9E9E',
  CRITICAL: '#D32F2F',
  WARNING: '#FFC107',
  INFO: '#2196F3'
} as const;

// Default configuration
export const DEFAULT_CONFIG = {
  ALERT_RETENTION_DAYS: 90,
  LOG_RETENTION_DAYS: 30,
  METRIC_RETENTION_DAYS: 60,
  HEALTH_CHECK_INTERVAL: 300, // 5 minutes in seconds
  AUTO_RESOLVE_HOURS: 48,
  DEFAULT_MUTE_HOURS: 24
} as const;

// ========== NOVA SEÇÃO ADICIONADA ==========

// Environments
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  STAGING: 'staging'
} as const;

// Default values for development
export const DEFAULT_VALUES = {
  PORT: 3000,
  APP_NAME: 'CFC Monitoring',
  MONGO_URI: 'mongodb://localhost:27017/monitoring',
  MONGO_DB_NAME: 'monitoring',
  MONGO_POOL_SIZE: 10,
  MONGO_TIMEOUT: 5000,
  MONGO_SOCKET_TIMEOUT: 45000,
  JWT_SECRET: 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: '24h',
  CORS_ORIGIN: 'http://localhost:3000',
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutos
  RATE_LIMIT_MAX_REQUESTS: 100,
  REDIS_HOST: 'localhost',
  REDIS_PORT: 6379,
  REDIS_PASSWORD: '',
  REDIS_ENABLED: false,
  LOG_LEVEL: 'info'
} as const;