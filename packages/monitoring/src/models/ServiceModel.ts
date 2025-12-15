// packages/monitoring/src/database/models/ServiceModel.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IService extends Document {
  name: string;
  type: 'api' | 'database' | 'cache' | 'message_queue' | 'external' | 'internal' | 'monitoring' | 'auth' | 'file_storage' | 'gateway';
  description?: string;
  url: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'stopped' | 'unknown';
  displayName?: string;
  environment: 'production' | 'staging' | 'development' | 'testing';
  category: string;
  tags: string[];
  healthCheckEndpoint?: string;
  config: {
    timeout: number;
    retryAttempts: number;
    critical: boolean;
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    uptime: number;
    lastUpdated: Date;
  };
  metadata: {
    owner: string;
    department: string;
    sla: string;
    serviceType?: string;
    gatewayPath?: string;
    proxyService?: string;
    discoveredAt?: Date;
    lastSync?: Date;
    source?: string;
    notificationChannels?: {
      email?: boolean;
      whatsapp?: boolean;
      sms?: boolean;
      push?: boolean;
      slack?: boolean;
      telegram?: boolean;
      webhook?: boolean;
    };
    custom: Record<string, any>;
  };
  lastHealthCheck: Date;
  isMonitored: boolean;
  monitoringConfig: {
    checkInterval: number;
    alertOnFailure: boolean;
    alertThreshold: number;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos de instância
  updateMetrics(responseTime: number, isSuccess: boolean): this;
  
  // Métodos virtuais
  isHealthy: boolean;
  needsAttention: boolean;
  uptimeFormatted: string;
}

const ServiceSchema = new Schema<IService>(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      index: true
    },
    type: { 
      type: String, 
      required: true,
      enum: ['api', 'database', 'cache', 'message_queue', 'external', 'internal', 'monitoring', 'auth', 'file_storage', 'gateway'],
      default: 'api'
    },
    description: { 
      type: String, 
      trim: true 
    },
    url: { 
      type: String, 
      required: true,
      trim: true,
      index: true
    },
    status: { 
      type: String, 
      enum: ['healthy', 'degraded', 'unhealthy', 'stopped', 'unknown'],
      default: 'unknown',
      index: true
    },
    displayName: { 
      type: String, 
      trim: true 
    },
    environment: { 
      type: String, 
      enum: ['production', 'staging', 'development', 'testing'],
      default: 'development',
      index: true
    },
    category: { 
      type: String, 
      required: true,
      default: 'api'
    },
    tags: { 
      type: [String], 
      default: [] 
    },
    healthCheckEndpoint: { 
      type: String 
    },
    config: {
      timeout: { type: Number, default: 10000 },
      retryAttempts: { type: Number, default: 3 },
      critical: { type: Boolean, default: false }
    },
    metrics: {
      responseTime: { type: Number, default: 0 },
      errorRate: { type: Number, default: 0, min: 0, max: 100 },
      uptime: { type: Number, default: 100, min: 0, max: 100 },
      lastUpdated: { type: Date, default: Date.now }
    },
    metadata: {
      owner: { type: String, default: 'System Team' },
      department: { type: String, default: 'Operations' },
      sla: { type: String, default: '99%' },
      serviceType: { type: String },
      gatewayPath: { type: String },
      proxyService: { type: String },
      discoveredAt: { type: Date },
      lastSync: { type: Date },
      source: { type: String },
      notificationChannels: {
        email: { type: Boolean, default: false },
        whatsapp: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: false },
        slack: { type: Boolean, default: false },
        telegram: { type: Boolean, default: false },
        webhook: { type: Boolean, default: false }
      },
      custom: { type: Schema.Types.Mixed, default: {} }
    },
    lastHealthCheck: { 
      type: Date, 
      default: Date.now 
    },
    isMonitored: { 
      type: Boolean, 
      default: true 
    },
    monitoringConfig: {
      checkInterval: { type: Number, default: 300 },
      alertOnFailure: { type: Boolean, default: true },
      alertThreshold: { type: Number, default: 3 }
    }
  },
  { 
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        // Remove campos internos do Mongoose
        delete ret.__v;
        delete ret._id;
        return ret;
      }
    },
    toObject: { 
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v;
        delete ret._id;
        return ret;
      }
    }
  }
);

// Indexes compostos para melhor performance
ServiceSchema.index({ status: 1, environment: 1 });
ServiceSchema.index({ type: 1, environment: 1 });
ServiceSchema.index({ 'metadata.proxyService': 1 });
ServiceSchema.index({ tags: 1 });
ServiceSchema.index({ updatedAt: -1 });
ServiceSchema.index({ name: 1, environment: 1 });
ServiceSchema.index({ category: 1, status: 1 });

// Virtuals
ServiceSchema.virtual('isHealthy').get(function(this: IService) {
  return this.status === 'healthy';
});

ServiceSchema.virtual('needsAttention').get(function(this: IService) {
  return this.status === 'unhealthy' || this.status === 'degraded';
});

ServiceSchema.virtual('uptimeFormatted').get(function(this: IService) {
  return `${this.metrics.uptime.toFixed(2)}%`;
});

ServiceSchema.virtual('responseTimeFormatted').get(function(this: IService) {
  return `${this.metrics.responseTime.toFixed(2)}ms`;
});

ServiceSchema.virtual('errorRateFormatted').get(function(this: IService) {
  return `${this.metrics.errorRate.toFixed(2)}%`;
});

// Métodos de instância
ServiceSchema.methods.updateMetrics = function(
  responseTime: number,
  isSuccess: boolean
): IService {
  const now = new Date();
  
  // Valores atuais
  const currentResponseTime = this.metrics.responseTime || 0;
  const currentErrorRate = this.metrics.errorRate || 0;
  const currentUptime = this.metrics.uptime || 100;
  
  // Atualiza responseTime (média móvel ponderada)
  const alpha = 0.3; // Fator de suavização
  this.metrics.responseTime = currentResponseTime * (1 - alpha) + responseTime * alpha;
  
  // Atualiza errorRate
  if (!isSuccess) {
    this.metrics.errorRate = Math.min(100, currentErrorRate + 1);
  } else {
    this.metrics.errorRate = Math.max(0, currentErrorRate - 0.5);
  }
  
  // Atualiza uptime baseado no sucesso
  if (isSuccess) {
    this.metrics.uptime = Math.min(100, currentUptime + 0.1);
  } else {
    this.metrics.uptime = Math.max(0, currentUptime - 1);
  }
  
  this.metrics.lastUpdated = now;
  this.lastHealthCheck = now;
  
  return this;
};

ServiceSchema.methods.checkHealth = async function(): Promise<{
  isHealthy: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
}> {
  try {
    if (!this.url) {
      return {
        isHealthy: false,
        responseTime: 0,
        error: 'URL não configurada'
      };
    }

    const startTime = Date.now();
    
    // Tenta fazer uma requisição HEAD para verificar saúde
    const response = await fetch(this.url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(this.config.timeout || 10000)
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      isHealthy: response.ok,
      responseTime,
      statusCode: response.status
    };
  } catch (error: any) {
    return {
      isHealthy: false,
      responseTime: 0,
      error: error.message || 'Erro desconhecido'
    };
  }
};

ServiceSchema.methods.toClientFormat = function(): any {
  return {
    id: this._id,
    name: this.name,
    displayName: this.displayName || this.name,
    type: this.type,
    description: this.description,
    url: this.url,
    status: this.status,
    environment: this.environment,
    category: this.category,
    tags: this.tags,
    healthCheckEndpoint: this.healthCheckEndpoint,
    config: this.config,
    metrics: {
      ...this.metrics,
      responseTimeFormatted: `${this.metrics.responseTime.toFixed(2)}ms`,
      uptimeFormatted: `${this.metrics.uptime.toFixed(2)}%`,
      errorRateFormatted: `${this.metrics.errorRate.toFixed(2)}%`
    },
    metadata: this.metadata,
    lastHealthCheck: this.lastHealthCheck,
    isMonitored: this.isMonitored,
    monitoringConfig: this.monitoringConfig,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    
    // Campos virtuais
    isHealthy: this.status === 'healthy',
    needsAttention: this.status === 'unhealthy' || this.status === 'degraded',
    uptimeFormatted: `${this.metrics.uptime.toFixed(2)}%`
  };
};

// Middleware
ServiceSchema.pre('save', function(next) {
  // Garante que displayName existe
  if (!this.displayName) {
    this.displayName = this.name;
  }
  
  // Garante que as tags são únicas
  if (this.tags && Array.isArray(this.tags)) {
    this.tags = [...new Set(this.tags)];
  }
  
  // Atualiza lastSync se a URL mudou
  if (this.isModified('url')) {
    this.metadata.lastSync = new Date();
  }
  
  // Garante que métricas existem
  if (!this.metrics) {
    this.metrics = {
      responseTime: 0,
      errorRate: 0,
      uptime: 100,
      lastUpdated: new Date()
    };
  }
  
  next();
});

ServiceSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  
  if (update) {
    update.$set = update.$set || {};
    update.$set.updatedAt = new Date();
    
    // Se URL foi atualizada, atualiza lastSync
    if (update.$set.url) {
      update.$set['metadata.lastSync'] = new Date();
    }
  }
  
  next();
});

// Static methods
ServiceSchema.statics.findByStatus = function(status: IService['status']) {
  return this.find({ status });
};

ServiceSchema.statics.findByEnvironment = function(environment: IService['environment']) {
  return this.find({ environment });
};

ServiceSchema.statics.findByProxyService = function(proxyService: string) {
  return this.find({ 'metadata.proxyService': proxyService });
};

ServiceSchema.statics.getHealthSummary = async function() {
  const result = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$metrics.responseTime' },
        avgUptime: { $avg: '$metrics.uptime' }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        avgResponseTime: { $round: ['$avgResponseTime', 2] },
        avgUptime: { $round: ['$avgUptime', 2] },
        _id: 0
      }
    }
  ]);
  
  return result;
};

// Export do modelo
export const ServiceModel: Model<IService> = mongoose.model<IService>('Service', ServiceSchema);
export default ServiceModel;