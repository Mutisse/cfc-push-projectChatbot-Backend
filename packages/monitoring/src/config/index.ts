import dotenv from 'dotenv';
import { ENVIRONMENTS, DEFAULT_VALUES } from './constants';

dotenv.config();

const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT,
  PORT: parseInt(process.env.PORT || DEFAULT_VALUES.PORT.toString()),
  APP_NAME: process.env.APP_NAME || DEFAULT_VALUES.APP_NAME,
  
  // MongoDB
  MONGO: {
    URI: process.env.MONGO_URI || DEFAULT_VALUES.MONGO_URI,
    DB_NAME: process.env.MONGO_DB_NAME || DEFAULT_VALUES.MONGO_DB_NAME,
    OPTIONS: {
      maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE || DEFAULT_VALUES.MONGO_POOL_SIZE.toString()),
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_TIMEOUT || DEFAULT_VALUES.MONGO_TIMEOUT.toString()),
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT || DEFAULT_VALUES.MONGO_SOCKET_TIMEOUT.toString()),
    }
  },
  
  // JWT
  JWT: {
    SECRET: process.env.JWT_SECRET || DEFAULT_VALUES.JWT_SECRET,
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || DEFAULT_VALUES.JWT_EXPIRES_IN
  },
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || DEFAULT_VALUES.CORS_ORIGIN,
  
  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || DEFAULT_VALUES.RATE_LIMIT_WINDOW_MS.toString()),
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || DEFAULT_VALUES.RATE_LIMIT_MAX_REQUESTS.toString())
  },
  
  // Redis (opcional para cache)
  REDIS: {
    HOST: process.env.REDIS_HOST || DEFAULT_VALUES.REDIS_HOST,
    PORT: parseInt(process.env.REDIS_PORT || DEFAULT_VALUES.REDIS_PORT.toString()),
    PASSWORD: process.env.REDIS_PASSWORD || DEFAULT_VALUES.REDIS_PASSWORD,
    ENABLED: process.env.REDIS_ENABLED === 'true' || DEFAULT_VALUES.REDIS_ENABLED
  },
  
  // API URLs de outros serviços
  SERVICES: {
    GATEWAY: process.env.GATEWAY_URL || 'http://localhost:3001',
    NOTIFY: process.env.NOTIFY_URL || 'http://localhost:3002',
    CHATBOT: process.env.CHATBOT_URL || 'http://localhost:3003',
    MANAGEMENT: process.env.MANAGEMENT_URL || 'http://localhost:3004'
  },
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || DEFAULT_VALUES.LOG_LEVEL
};

// Validação básica em produção
if (config.NODE_ENV === ENVIRONMENTS.PRODUCTION) {
  const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

export default config;