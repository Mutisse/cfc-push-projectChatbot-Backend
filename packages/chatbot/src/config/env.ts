import dotenv from "dotenv";

dotenv.config();

// Validação completa das variáveis de ambiente
const validateEnvironment = (): void => {
  // Variáveis OBRIGATÓRIAS - sem elas a aplicação não funciona
  const requiredEnvVars = [
    "PORT",
    "NODE_ENV",
    "MONGODB_URI",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_WHATSAPP_NUMBER",
    "CACHE_REFRESH_HOUR",
    "SESSION_TIMEOUT_HOURS",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName] || process.env[varName]!.trim() === ""
  );

  if (missingVars.length > 0) {
    throw new Error(
      `❌ Variáveis de ambiente OBRIGATÓRIAS ausentes no .env: ${missingVars.join(", ")}`
    );
  }

  // Validações específicas
  const port = parseInt(process.env.PORT!);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`❌ PORT inválido no .env: ${process.env.PORT}`);
  }

  const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT_HOURS!);
  if (isNaN(sessionTimeout) || sessionTimeout < 1) {
    throw new Error(
      `❌ SESSION_TIMEOUT_HOURS inválido no .env: ${process.env.SESSION_TIMEOUT_HOURS}`
    );
  }

  const validEnvs = ["development", "production", "test"];
  if (!validEnvs.includes(process.env.NODE_ENV!)) {
    throw new Error(`❌ NODE_ENV inválido no .env: ${process.env.NODE_ENV}`);
  }
};

// Executar validação
validateEnvironment();

export const env = {
  // APP (OBRIGATÓRIAS)
  PORT: parseInt(process.env.PORT!),
  NODE_ENV: process.env.NODE_ENV!,
  HOST: process.env.HOST!,
  CORS_ORIGIN: process.env.CORS_ORIGIN!,

  // MONGODB (OBRIGATÓRIA)
  MONGODB_URI: process.env.MONGODB_URI!,

  // TWILIO (OBRIGATÓRIAS)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID!,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN!,
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER!,

  // MANAGEMENT API
  MANAGEMENT_API_URL: process.env.MANAGEMENT_API_URL!,
  MANAGEMENT_API_TOKEN: process.env.MANAGEMENT_API_TOKEN!,

  // CACHE CONFIG (OBRIGATÓRIAS)
  CACHE_REFRESH_HOUR: process.env.CACHE_REFRESH_HOUR!,
  SESSION_TIMEOUT_HOURS: parseInt(process.env.SESSION_TIMEOUT_HOURS!),
};
