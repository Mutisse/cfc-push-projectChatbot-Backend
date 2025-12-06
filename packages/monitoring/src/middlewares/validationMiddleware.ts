import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ALERT_SEVERITY, ALERT_STATUS, SERVICE_STATUS, LOG_LEVEL, LOG_SOURCE } from '../config/constants';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        })),
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

// Schemas de validação
export const alertSchemas = {
  create: Joi.object({
    title: Joi.string().required().min(3).max(200),
    description: Joi.string().required().min(10).max(1000),
    severity: Joi.string().valid(...Object.values(ALERT_SEVERITY)).required(),
    service: Joi.string().optional(),
    source: Joi.string().optional(),
    metadata: Joi.object().optional()
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(200),
    description: Joi.string().min(10).max(1000),
    severity: Joi.string().valid(...Object.values(ALERT_SEVERITY)),
    service: Joi.string().optional(),
    source: Joi.string().optional(),
    metadata: Joi.object().optional()
  }),

  action: Joi.object({
    resolvedBy: Joi.string().optional(),
    acknowledgedBy: Joi.string().optional(),
    mutedBy: Joi.string().optional(),
    mutedUntil: Joi.date().optional()
  })
};

export const serviceSchemas = {
  create: Joi.object({
    name: Joi.string().required().min(3).max(50).pattern(/^[a-z0-9-]+$/),
    displayName: Joi.string().required().min(3).max(100),
    description: Joi.string().required().min(10).max(500),
    url: Joi.string().required().uri(),
    type: Joi.string().required(),
    environment: Joi.string().required(),
    configuration: Joi.object().optional(),
    healthCheckUrl: Joi.string().uri().optional(),
    healthCheckInterval: Joi.number().min(10).max(3600).default(60),
    metricsInterval: Joi.number().min(5).max(300).default(30),
    isMonitored: Joi.boolean().default(true),
    version: Joi.string().optional(),
    ownerTeam: Joi.string().optional(),
    notificationChannels: Joi.array().items(Joi.string()).default([]),
    tags: Joi.array().items(Joi.string()).default([])
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(50).pattern(/^[a-z0-9-]+$/),
    displayName: Joi.string().min(3).max(100),
    description: Joi.string().min(10).max(500),
    url: Joi.string().uri(),
    type: Joi.string(),
    environment: Joi.string(),
    configuration: Joi.object(),
    healthCheckUrl: Joi.string().uri(),
    healthCheckInterval: Joi.number().min(10).max(3600),
    metricsInterval: Joi.number().min(5).max(300),
    isMonitored: Joi.boolean(),
    version: Joi.string(),
    ownerTeam: Joi.string(),
    notificationChannels: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.string())
  })
};

export const metricSchemas = {
  create: Joi.object({
    service: Joi.string().optional(),
    metricType: Joi.string().required(),
    value: Joi.number().required(),
    timestamp: Joi.date().optional(),
    metadata: Joi.object().optional(),
    unit: Joi.string().optional(),
    timeRange: Joi.string().optional(),
    aggregationType: Joi.string().valid('avg', 'max', 'min', 'sum', 'count', 'p95', 'p99').optional()
  }),

  batch: Joi.array().items(
    Joi.object({
      service: Joi.string().optional(),
      metricType: Joi.string().required(),
      value: Joi.number().required(),
      timestamp: Joi.date().optional(),
      metadata: Joi.object().optional(),
      unit: Joi.string().optional()
    })
  ).min(1).max(1000)
};

export const logSchemas = {
  create: Joi.object({
    level: Joi.string().valid(...Object.values(LOG_LEVEL)).required(),
    message: Joi.string().required().min(1).max(1000),
    source: Joi.string().valid(...Object.values(LOG_SOURCE)).required(),
    service: Joi.string().optional(),
    metadata: Joi.object().optional(),
    context: Joi.object().optional(),
    traceId: Joi.string().optional(),
    spanId: Joi.string().optional(),
    userId: Joi.string().optional(),
    ipAddress: Joi.string().ip().optional(),
    endpoint: Joi.string().optional(),
    httpMethod: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD').optional(),
    statusCode: Joi.number().min(100).max(599).optional(),
    responseTime: Joi.number().min(0).optional(),
    stackTrace: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional()
  }),

  batch: Joi.array().items(
    Joi.object({
      level: Joi.string().valid(...Object.values(LOG_LEVEL)).required(),
      message: Joi.string().required().min(1).max(1000),
      source: Joi.string().valid(...Object.values(LOG_SOURCE)).required(),
      service: Joi.string().optional(),
      metadata: Joi.object().optional(),
      context: Joi.object().optional(),
      traceId: Joi.string().optional(),
      userId: Joi.string().optional()
    })
  ).min(1).max(1000)
};