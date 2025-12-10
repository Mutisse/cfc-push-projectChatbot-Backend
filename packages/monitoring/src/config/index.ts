// packages/monitoring/src/config/index.ts
import dotenv from 'dotenv';
import path from 'path';

// Carregar .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
  // URLs dos serviços
  MANAGEMENT_URL: process.env.MANAGEMENT_URL || 'http://localhost:7000',
  NOTIFY_URL: process.env.NOTIFY_URL || 'http://localhost:7002',
  MONITORING_URL: process.env.MONITORING_URL || 'http://localhost:7001',
  CHATBOT_URL: process.env.CHATBOT_URL || 'https://cfc-push-projectchatbot-backend.onrender.com',

  // Configurações do servidor
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '7001'),
  APP_NAME: process.env.APP_NAME || 'CFC Monitoring Service',
  HOST: process.env.HOST || 'localhost',

  // MongoDB - configurado para seu banco 'monitoring'
  MONGO: {
    URI: process.env.MONGO_URI || 'mongodb://localhost:27017',
    DB_NAME: process.env.MONGO_DB_NAME || 'monitoring',
    OPTIONS: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:9000,http://localhost:8080,http://localhost:3000',

  // Timeouts
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '10000'),
  HEALTH_CHECK_INTERVAL: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),

  // Segurança
  API_KEY: process.env.API_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || 'monitoring-secret-key',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_TO_FILE: process.env.LOG_TO_FILE === 'true',

  // Configurações específicas do monitoring
  METRICS_RETENTION_DAYS: parseInt(process.env.METRICS_RETENTION_DAYS || '30'),
  ALERT_THRESHOLD_RESPONSE_TIME: parseInt(process.env.ALERT_THRESHOLD_RESPONSE_TIME || '500'),
  ALERT_THRESHOLD_ERROR_RATE: parseInt(process.env.ALERT_THRESHOLD_ERROR_RATE || '5'),
  HEALTH_CHECK_ENABLED: process.env.HEALTH_CHECK_ENABLED !== 'false'
};

// Validação
const requiredConfigs = ['PORT', 'NODE_ENV'];
const missingConfigs = requiredConfigs.filter(
  key => !config[key as keyof typeof config] || String(config[key as keyof typeof config]).trim() === ''
);

if (missingConfigs.length > 0) {
  console.error('❌ Configurações obrigatórias ausentes:', missingConfigs);
  throw new Error(`Missing required configurations: ${missingConfigs.join(', ')}`);
}

if (!config.MONGO.URI || config.MONGO.URI.trim() === '') {
  console.warn('⚠️ MONGO_URI não configurado. Usando valor padrão.');
}

// Log em desenvolvimento
if (config.NODE_ENV === 'development') {
  console.log('📋 Configurações carregadas:');
  console.log('=============================');
  console.log(`PORT: ${config.PORT}`);
  console.log(`NODE_ENV: ${config.NODE_ENV}`);
  console.log(`MONGO_URI: ${config.MONGO.URI ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`DB_NAME: ${config.MONGO.DB_NAME}`);
  console.log('=============================');
}

export default config;