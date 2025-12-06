import dotenv from "dotenv";

dotenv.config();

export interface ServerConfig {
  name: string;
  host: string;
  port: number;
  path: string;
  protocol: "http" | "https";
  timeout: number;
  healthEndpoint?: string;
}

export interface AppConfig {
  // Ambiente
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  HOST: string;
  APP_NAME: string;

  // Segurança
  JWT_SECRET: string;
  JWT_AUDIENCE: string;
  JWT_ISSUER: string;
  CORS_ORIGIN: string[];
  ALLOWED_IPS: string[]; // IPs permitidos em produção

  // Logging
  LOG_LEVEL: "error" | "warn" | "info" | "debug";
  LOG_DIR: string;
  ENABLE_AUDIT_LOG: boolean;

  // Servidores
  SERVERS: Record<string, ServerConfig>;

  // Timeouts
  REQUEST_TIMEOUT: number;
  HEALTH_CHECK_INTERVAL: number;

  // Monitoramento
  ENABLE_METRICS: boolean;
  METRICS_PORT: number;

  // MongoDB (Atlas)
  MONGODB_URI: string;
  MONGODB_DATABASE: string;
}

// Configuração padrão para desenvolvimento
const defaultConfig: AppConfig = {
  NODE_ENV: "development",
  PORT: 3001,
  HOST: "localhost",
  APP_NAME: "CFC Push Gateway Manager",
  JWT_SECRET: "your-secret-key-change-in-production",
  JWT_AUDIENCE: "cfc-push-api",
  JWT_ISSUER: "http://localhost:3001",
  CORS_ORIGIN: ["http://localhost:8080", "http://localhost:3000"],
  ALLOWED_IPS: ["127.0.0.1", "::1", "localhost"],
  LOG_LEVEL: "debug",
  LOG_DIR: "./logs",
  ENABLE_AUDIT_LOG: true,
  SERVERS: {},
  REQUEST_TIMEOUT: 30000,
  HEALTH_CHECK_INTERVAL: 30000,
  ENABLE_METRICS: true,
  METRICS_PORT: 9090,
  MONGODB_URI: "",
  MONGODB_DATABASE: "cfc-push-chatbot",
};

// Helper para extrair informações do MongoDB Atlas URI
const extractMongoDBInfo = (uri: string | undefined): { database: string } => {
  const defaultDatabase = "cfc-push-chatbot";

  if (!uri) return { database: defaultDatabase };

  try {
    // Extrair database da URI - método mais robusto
    const dbNameMatch = uri.match(/\/([^/?]+)(?:\?|$)/);
    if (dbNameMatch && dbNameMatch[1]) {
      return { database: dbNameMatch[1] };
    }

    return { database: defaultDatabase };
  } catch {
    return { database: defaultDatabase };
  }
};

const mongoDBInfo = extractMongoDBInfo(process.env.MONGODB_URI);

// Serviços disponíveis (APENAS SERVIÇOS HTTP)
const servicesConfig: Record<string, ServerConfig> = {
  // Gateway principal
  gateway: {
    name: "Gateway",
    host: process.env.GATEWAY_HOST || "localhost",
    port: parseInt(process.env.GATEWAY_PORT || "3001"),
    path: "/health",
    protocol: "http",
    timeout: 5000,
  },

  // Serviço de Chatbot
  chatbot: {
    name: "Chatbot Service",
    host: process.env.CHATBOT_HOST || "localhost",
    port: parseInt(process.env.CHATBOT_PORT || "3000"),
    path: "/health",
    protocol: "http",
    timeout: 5000,
  },

  // Serviço de Gerenciamento
  management: {
    name: "Management Service",
    host: process.env.MANAGEMENT_HOST || "localhost",
    port: parseInt(process.env.MANAGEMENT_PORT || "3003"),
    path: "/health",
    protocol: "http",
    timeout: 5000,
  },

  // Serviço de Monitoramento
  monitoring: {
    name: "Monitoring Service",
    host: process.env.MONITORING_HOST || "localhost",
    port: parseInt(process.env.MONITORING_PORT || "3004"),
    path: "/health",
    protocol: "http",
    timeout: 5000,
  },

  // Serviço de Notificações
  notify: {
    name: "Notification Service",
    host: process.env.NOTIFY_HOST || "localhost",
    port: parseInt(process.env.NOTIFY_PORT || "3002"),
    path: "/health",
    protocol: "http",
    timeout: 5000,
  },
};

// Configuração completa
const config: AppConfig = {
  // Ambiente
  NODE_ENV:
    (process.env.NODE_ENV as "development" | "production" | "test") ||
    defaultConfig.NODE_ENV,
  PORT: parseInt(process.env.PORT || defaultConfig.PORT.toString()),
  HOST: process.env.HOST || defaultConfig.HOST,
  APP_NAME: process.env.APP_NAME || defaultConfig.APP_NAME,

  // Segurança
  JWT_SECRET: process.env.JWT_SECRET || defaultConfig.JWT_SECRET,
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || defaultConfig.JWT_AUDIENCE,
  JWT_ISSUER: process.env.JWT_ISSUER || defaultConfig.JWT_ISSUER,
  CORS_ORIGIN: process.env.CORS_ORIGIN?.split(",") || defaultConfig.CORS_ORIGIN,
  ALLOWED_IPS: process.env.ALLOWED_IPS?.split(",") || defaultConfig.ALLOWED_IPS,

  // Logging
  LOG_LEVEL:
    (process.env.LOG_LEVEL as "error" | "warn" | "info" | "debug") ||
    defaultConfig.LOG_LEVEL,
  LOG_DIR: process.env.LOG_DIR || defaultConfig.LOG_DIR,
  ENABLE_AUDIT_LOG:
    process.env.ENABLE_AUDIT_LOG === "true" || defaultConfig.ENABLE_AUDIT_LOG,

  // Servidores (APENAS serviços HTTP)
  SERVERS: servicesConfig,

  // Timeouts
  REQUEST_TIMEOUT: parseInt(
    process.env.REQUEST_TIMEOUT || defaultConfig.REQUEST_TIMEOUT.toString()
  ),
  HEALTH_CHECK_INTERVAL: parseInt(
    process.env.HEALTH_CHECK_INTERVAL ||
      defaultConfig.HEALTH_CHECK_INTERVAL.toString()
  ),

  // Monitoramento
  ENABLE_METRICS:
    process.env.ENABLE_METRICS === "true" || defaultConfig.ENABLE_METRICS,
  METRICS_PORT: parseInt(
    process.env.METRICS_PORT || defaultConfig.METRICS_PORT.toString()
  ),

  // MongoDB Atlas
  MONGODB_URI: process.env.MONGODB_URI || defaultConfig.MONGODB_URI,
  MONGODB_DATABASE: mongoDBInfo.database,
};

// Validação da configuração
if (config.NODE_ENV === "production") {
  if (
    !config.JWT_SECRET ||
    config.JWT_SECRET === "your-secret-key-change-in-production"
  ) {
    throw new Error("JWT_SECRET must be set in production environment");
  }

  if (!process.env.CORS_ORIGIN) {
    console.warn(
      "⚠️  CORS_ORIGIN not set in production. Using default localhost origins"
    );
  }

  if (
    !process.env.ALLOWED_IPS ||
    process.env.ALLOWED_IPS === "127.0.0.1,::1,localhost"
  ) {
    console.warn("⚠️  ALLOWED_IPS not properly configured in production");
  }

  // Validação do MongoDB Atlas em produção
  if (!config.MONGODB_URI) {
    throw new Error("MONGODB_URI must be set in production environment");
  }

  if (!config.MONGODB_URI.includes("mongodb+srv://")) {
    console.warn(
      "⚠️  MONGODB_URI seems to be using local MongoDB instead of Atlas"
    );
  }
}

// Log de configuração (apenas desenvolvimento)
if (config.NODE_ENV === "development") {
  console.log("=".repeat(50));
  console.log("⚙️  CONFIGURAÇÃO DO GATEWAY");
  console.log("=".repeat(50));
  console.log(`🌍 Ambiente: ${config.NODE_ENV}`);
  console.log(`📡 Porta: ${config.PORT}`);
  console.log(`🔗 Serviços monitorados: ${Object.keys(config.SERVERS).length}`);
  console.log(
    `🗄️  MongoDB Atlas: ${
      config.MONGODB_URI ? "✅ Configurado" : "❌ Não configurado"
    }`
  );
  if (config.MONGODB_URI) {
    const maskedURI = config.MONGODB_URI.replace(
      /\/\/([^:]+):([^@]+)@/,
      "//***:***@"
    );
    console.log(`   Database: ${config.MONGODB_DATABASE}`);
  }
  console.log("=".repeat(50));
}

export default config;
