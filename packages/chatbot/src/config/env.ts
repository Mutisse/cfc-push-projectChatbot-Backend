import dotenv from 'dotenv';

dotenv.config();

// Validação das variáveis críticas
const requiredEnvVars = [
  'MONGODB_URI',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_NUMBER'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.warn(`⚠️ Variável de ambiente ausente: ${varName}`);
  }
});

export const env = {
  // MONGODB
  MONGODB_URI: process.env.MONGODB_URI!,
  
  // TWILIO
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || '',
  
  // APP
  PORT: process.env.PORT!,
  NODE_ENV: process.env.NODE_ENV!,
  
  // CACHE CONFIG
  CACHE_REFRESH_HOUR: process.env.CACHE_REFRESH_HOUR!, // 6:00 AM
  SESSION_TIMEOUT_HOURS: parseInt(process.env.SESSION_TIMEOUT_HOURS!),
};