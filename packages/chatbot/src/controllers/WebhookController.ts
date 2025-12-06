import { Request, Response } from "express";
import { chatOrchestrator } from "../services/ChatOrchestrator";
import { twilioService } from "../services/TwilioService";

// Cache para evitar processamento duplicado
const messageProcessing = new Map<string, number>();
const PROCESSING_TIMEOUT = 3000; // 3 segundos

export class WebhookController {
  
  async handleWebhook(req: Request, res: Response): Promise<void> {
    // ⚡ RESPOSTA IMEDIATA para o Twilio (obrigatório)
    res.type("text/xml");
    res.send("<Response></Response>");
    
    // Processa em background
    setTimeout(async () => {
      try {
        const { Body: message, From: from } = req.body;
        
        if (!message || !from) {
          console.log("⚠️ Mensagem ou remetente ausente");
          return;
        }
        
        const phoneNumber = from.replace("whatsapp:", "");
        const cleanMessage = message.trim();
        
        // ⚡ Evita processamento duplicado
        const processingKey = `${phoneNumber}:${cleanMessage}`;
        const now = Date.now();
        const lastProcessed = messageProcessing.get(processingKey);
        
        if (lastProcessed && (now - lastProcessed) < PROCESSING_TIMEOUT) {
          console.log(`⏭️  Pulando mensagem duplicada: ${cleanMessage}`);
          return;
        }
        
        messageProcessing.set(processingKey, now);
        
        // ⚡ Limpa cache após timeout
        setTimeout(() => {
          messageProcessing.delete(processingKey);
        }, PROCESSING_TIMEOUT);
        
        console.log(`📩 Nova mensagem de ${phoneNumber}: "${cleanMessage}"`);
        
        // ⚡ Processa a mensagem
        const result = await chatOrchestrator.processMessage(phoneNumber, cleanMessage);
        
        // ⚡ Envia resposta se necessário
        if (result.success && result.message) {
          await twilioService.sendMessage(phoneNumber, result.message);
        }
        
      } catch (error) {
        console.error('❌ Erro no processamento do webhook:', error);
      }
    }, 10); // Pequeno delay para não bloquear
  }
}

export const webhookController = new WebhookController();