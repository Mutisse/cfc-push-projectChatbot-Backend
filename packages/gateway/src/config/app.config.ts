import dotenv from "dotenv";

dotenv.config();

export interface ServerConfig {
  name: string;
  url: string;
  host: string;
  port: number;
  path: string;
  protocol: "http" | "https";
  timeout: number;
  healthEndpoint: string;
}

export interface AppConfig {
  // Ambiente
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  APP_NAME: string;

  // Segurança
  JWT_SECRET: string;
  JWT_AUDIENCE: string;
  JWT_ISSUER: string;
  CORS_ORIGIN: string[];
  ALLOWED_IPS: string[];

  // Logging
  LOG_LEVEL: string;
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

  // MongoDB
  MONGODB_URI: string;
  MONGODB_DATABASE: string;
  MONGODB_MAX_POOL_SIZE: number;
  MONGODB_SERVER_SELECTION_TIMEOUT: number;
  MONGODB_SOCKET_TIMEOUT: number;

  // Gateway
  PROXY_TIMEOUT: number;
}

// Funções auxiliares para obter valores do .env - SEM FALLBACK
const getRequiredString = (varName: string): string => {
  const value = process.env[varName];
  if (!value || value.trim() === "") {
    throw new Error(`❌ Variável obrigatória não definida: ${varName}`);
  }
  return value.trim();
};

const getRequiredNumber = (varName: string): number => {
  const value = getRequiredString(varName);
  const num = parseInt(value);
  if (isNaN(num)) {
    throw new Error(`❌ Variável ${varName} deve ser um número: ${value}`);
  }
  return num;
};

const getRequiredBoolean = (varName: string): boolean => {
  const value = getRequiredString(varName);
  if (value !== "true" && value !== "false") {
    throw new Error(
      `❌ Variável ${varName} deve ser 'true' ou 'false': ${value}`
    );
  }
  return value === "true";
};

const getRequiredArray = (
  varName: string,
  separator: string = ","
): string[] => {
  const value = getRequiredString(varName);
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter((item) => item);
};

// Validação das variáveis de ambiente obrigatórias
const validateEnvironment = (): void => {
  // Lista de variáveis que DEVEM estar no .env
  const requiredEnvVars = [
    // Ambiente do Gateway
    "PORT",
    "NODE_ENV",
    "HOST",
    "APP_NAME",

    // Segurança
    "JWT_SECRET",
    "JWT_AUDIENCE",
    "JWT_ISSUER",
    "CORS_ORIGIN",
    "ALLOWED_IPS",

    // Logging
    "LOG_LEVEL",
    "LOG_DIR",
    "ENABLE_AUDIT_LOG",

    // Timeouts
    "REQUEST_TIMEOUT",
    "HEALTH_CHECK_INTERVAL",

    // Monitoramento
    "ENABLE_METRICS",
    "METRICS_PORT",

    // MongoDB
    "MONGODB_URI",
    "MONGODB_DATABASE",
    "MONGODB_MAX_POOL_SIZE",
    "MONGODB_SERVER_SELECTION_TIMEOUT",
    "MONGODB_SOCKET_TIMEOUT",

    // Gateway
    "PROXY_TIMEOUT",

    // Microserviços
    "MANAGEMENT_URL",
    "NOTIFY_URL",
    "MONITORING_URL",
    "CHATBOT_URL",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `❌ Variáveis de ambiente ausentes: ${missingVars.join(", ")}`
    );
  }

  // Validações numéricas
  const port = parseInt(process.env.PORT!);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`❌ PORT inválido: ${process.env.PORT}`);
  }

  // Validação de URLs dos serviços
  const serviceUrlVars = [
    "MANAGEMENT_URL",
    "NOTIFY_URL",
    "MONITORING_URL",
    "CHATBOT_URL",
  ];
  serviceUrlVars.forEach((varName) => {
    const url = process.env[varName]!;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      throw new Error(
        `❌ ${varName} deve ser uma URL válida (começar com http:// ou https://): ${url}`
      );
    }

    try {
      new URL(url);
    } catch {
      throw new Error(`❌ ${varName} é uma URL inválida: ${url}`);
    }
  });
};

// Executar validação
validateEnvironment();

// Configuração dos serviços
const parseAndCreateServerConfig = (
  serviceName: string,
  urlVarName: string
): ServerConfig => {
  const serviceUrl = getRequiredString(urlVarName);

  try {
    const url = new URL(serviceUrl);

    const serviceNames: Record<string, string> = {
      MANAGEMENT_URL: "Management Service",
      NOTIFY_URL: "Notification Service",
      MONITORING_URL: "Monitoring Service",
      CHATBOT_URL: "Chatbot Service",
    };

    let port = 80;
    if (url.port) {
      port = parseInt(url.port);
    } else if (url.protocol === "https:") {
      port = 443;
    }

    return {
      name: serviceNames[urlVarName],
      url: serviceUrl,
      host: url.hostname,
      port: port,
      path: "/health",
      protocol: url.protocol.replace(":", "") as "http" | "https",
      timeout: 5000,
      healthEndpoint: "/health",
    };
  } catch (error) {
    throw new Error(
      `❌ Falha ao analisar URL do serviço ${urlVarName}: ${serviceUrl}`
    );
  }
};

const servicesConfig: Record<string, ServerConfig> = {
  management: parseAndCreateServerConfig("management", "MANAGEMENT_URL"),
  notify: parseAndCreateServerConfig("notify", "NOTIFY_URL"),
  monitoring: parseAndCreateServerConfig("monitoring", "MONITORING_URL"),
  chatbot: parseAndCreateServerConfig("chatbot", "CHATBOT_URL"),
};

// Configuração completa - APENAS valores do .env
const config: AppConfig = {
  // Ambiente
  NODE_ENV: getRequiredString("NODE_ENV"),
  PORT: getRequiredNumber("PORT"),
  HOST: getRequiredString("HOST"),
  APP_NAME: getRequiredString("APP_NAME"),

  // Segurança
  JWT_SECRET: getRequiredString("JWT_SECRET"),
  JWT_AUDIENCE: getRequiredString("JWT_AUDIENCE"),
  JWT_ISSUER: getRequiredString("JWT_ISSUER"),
  CORS_ORIGIN: getRequiredArray("CORS_ORIGIN"),
  ALLOWED_IPS: getRequiredArray("ALLOWED_IPS"),

  // Logging
  LOG_LEVEL: getRequiredString("LOG_LEVEL"),
  LOG_DIR: getRequiredString("LOG_DIR"),
  ENABLE_AUDIT_LOG: getRequiredBoolean("ENABLE_AUDIT_LOG"),

  // Servidores
  SERVERS: servicesConfig,

  // Timeouts
  REQUEST_TIMEOUT: getRequiredNumber("REQUEST_TIMEOUT"),
  HEALTH_CHECK_INTERVAL: getRequiredNumber("HEALTH_CHECK_INTERVAL"),

  // Monitoramento
  ENABLE_METRICS: getRequiredBoolean("ENABLE_METRICS"),
  METRICS_PORT: getRequiredNumber("METRICS_PORT"),

  // MongoDB
  MONGODB_URI: getRequiredString("MONGODB_URI"),
  MONGODB_DATABASE: getRequiredString("MONGODB_DATABASE"),
  MONGODB_MAX_POOL_SIZE: getRequiredNumber("MONGODB_MAX_POOL_SIZE"),
  MONGODB_SERVER_SELECTION_TIMEOUT: getRequiredNumber(
    "MONGODB_SERVER_SELECTION_TIMEOUT"
  ),
  MONGODB_SOCKET_TIMEOUT: getRequiredNumber("MONGODB_SOCKET_TIMEOUT"),

  // Gateway
  PROXY_TIMEOUT: getRequiredNumber("PROXY_TIMEOUT"),
};

// NÃO VERIFICA valor do JWT_SECRET - usa EXATAMENTE o que está no .env
// Se o usuário quiser usar "your-secret-key-change-in-production" em produção, problema dele

// Log de configuração
console.log("=".repeat(50));
console.log("⚙️  CONFIGURAÇÃO DO GATEWAY");
console.log("=".repeat(50));
console.log(`🌍 Ambiente: ${config.NODE_ENV}`);
console.log(`📡 Porta: ${config.PORT}`);
console.log(`🏠 Host: ${config.HOST}`);
console.log(`📛 Nome: ${config.APP_NAME}`);
console.log(`🔗 Serviços configurados: ${Object.keys(config.SERVERS).length}`);
console.log("=".repeat(50));
console.log("🔌 URLs dos Microserviços:");
Object.entries(config.SERVERS).forEach(([key, service]) => {
  console.log(`  • ${service.name}: ${service.url}`);
});
console.log("=".repeat(50));

export default config;
