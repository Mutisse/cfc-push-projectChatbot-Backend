import { Request, Response } from "express";
import whatsappService from "../services/whatsappService";

// Helper para lidar com erros
const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error occurred";
};

export class WhatsAppController {
  // POST /whatsapp/send-welcome
  async sendWelcomeMessage(req: Request, res: Response) {
    try {
      const { phone, userName } = req.body;

      if (!phone || !userName) {
        return res.status(400).json({
          success: false,
          message: "Phone e userName são obrigatórios",
        });
      }

      const result = await whatsappService.sendWelcomeMessage(phone, userName);

      res.json({
        success: result,
        message: result
          ? "Mensagem de boas-vindas enviada"
          : "Erro ao enviar mensagem",
        data: { phone, userName },
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: "Erro ao enviar mensagem WhatsApp",
        error: handleError(error),
      });
    }
  }

  // POST /whatsapp/send-prayer-confirmation
  async sendPrayerConfirmation(req: Request, res: Response) {
    try {
      const { phone, prayerSubject } = req.body;

      if (!phone || !prayerSubject) {
        return res.status(400).json({
          success: false,
          message: "Phone e prayerSubject são obrigatórios",
        });
      }

      const result = await whatsappService.sendPrayerConfirmation(
        phone,
        prayerSubject
      );

      res.json({
        success: result,
        message: result
          ? "Confirmação de oração enviada"
          : "Erro ao enviar confirmação",
        data: { phone, prayerSubject },
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: "Erro ao enviar confirmação de oração",
        error: handleError(error),
      });
    }
  }

  // POST /whatsapp/validate-number
  async validateNumber(req: Request, res: Response) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: "Phone é obrigatório",
        });
      }

      const validation = await whatsappService.validateWhatsAppNumber(phone);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: "Erro ao validar número",
        error: handleError(error),
      });
    }
  }

  // GET /whatsapp/provider-status
  async getProviderStatus(req: Request, res: Response) {
    try {
      const status = {
        configured: false,
        service: "WhatsApp",
        status: "Em desenvolvimento - modo simulação",
      };

      res.json({
        success: true,
        data: status,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: "Erro ao verificar status",
        error: handleError(error),
      });
    }
  }
}

export default new WhatsAppController();
