// src/services/TwilioService.ts - VERSÃO CORRIGIDA
import twilio from "twilio";
import { env } from "../config/env";

export interface SendResult {
  success: boolean;
  messageSid?: string;
  error?: string;
  timestamp: string;
}

export class TwilioService {
  private client: twilio.Twilio;
  private whatsappNumber: string;
  
  constructor() {
    // Validação das credenciais
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_WHATSAPP_NUMBER) {
      throw new Error("❌ Twilio não configurado. Verifique as variáveis de ambiente.");
    }
    
    this.client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    this.whatsappNumber = env.TWILIO_WHATSAPP_NUMBER;
    
    console.log("📱 Twilio Service - Configurado com sucesso");
  }
  
  async sendMessage(to: string, message: string): Promise<SendResult> {
    const startTime = Date.now();
    
    try {
      // ⚡ Limita tamanho da mensagem para evitar problemas
      const MAX_LENGTH = 1500;
      const truncatedMessage = message.length > MAX_LENGTH 
        ? message.substring(0, MAX_LENGTH) + "...\n\n(mensagem truncada)"
        : message;
      
      // ⚡ Envio otimizado - SEM statusCallback (não usar null)
      const result = await this.client.messages.create({
        body: truncatedMessage,
        from: this.whatsappNumber,
        to: `whatsapp:${to}`,
        // ⚠️ NÃO usar statusCallback: null - apenas omitir o campo
        // provideFeedback não é uma propriedade válida da API Twilio
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`📤 [${duration}ms] Mensagem enviada para: ${to}`);
      
      return {
        success: true,
        messageSid: result.sid,
        timestamp: new Date().toISOString()
      };
      
    } catch (error: any) {
      console.error(`❌ Erro ao enviar para ${to}:`, error.message);
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // 🎯 Teste de conexão
  async testConnection(): Promise<boolean> {
    try {
      await this.client.api.accounts(this.client.accountSid).fetch();
      console.log("✅ Conexão Twilio testada com sucesso");
      return true;
    } catch (error) {
      console.error("❌ Falha na conexão Twilio:", error);
      return false;
    }
  }
}

// Singleton global
export const twilioService = new TwilioService();