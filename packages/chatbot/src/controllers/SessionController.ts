// src/controllers/SessionController.ts
import { Request, Response } from "express";
import { sessionService } from "../services/SessionService";

export class SessionController {
  async startSession(req: Request, res: Response): Promise<Response> {
    try {
      const { phoneNumber, userId, serviceType = "chatbot" } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "phoneNumber é obrigatório",
        });
      }

      const result = await sessionService.startChatbotSession(
        phoneNumber,
        userId
      );

      return res.status(result.success ? 201 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro interno ao iniciar sessão",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getActiveSession(req: Request, res: Response): Promise<Response> {
    try {
      const { phoneNumber, serviceType } = req.query;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "phoneNumber é obrigatório",
        });
      }

      const result = await sessionService.getActiveSession(
        phoneNumber as string,
        serviceType as string
      );

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro interno ao buscar sessão",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      });
    }
  }

  // No método completeSession do SessionController:
  async completeSession(req: Request, res: Response): Promise<Response> {
    try {
      const { sessionId } = req.params;
      const { reason } = req.body;

      // ✅ VALIDE ANTES DE USAR
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: "sessionId é obrigatório nos parâmetros da URL",
        });
      }

      const result = await sessionService.completeSession(sessionId, reason);

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro interno ao finalizar sessão",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      });
    }
  }

  // No método recordInteraction:
  async recordInteraction(req: Request, res: Response): Promise<Response> {
    try {
      const { sessionId, menuId, userInput, botResponse, action } = req.body;

      // ✅ VALIDE ANTES DE USAR
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: "sessionId é obrigatório",
        });
      }

      const result = await sessionService.recordInteraction(sessionId, {
        menuId,
        userInput,
        botResponse,
        action,
      });

      return res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro interno ao registrar interação",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const result = await sessionService.getSessionStats();
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro interno ao obter estatísticas",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getAllSessions(req: Request, res: Response): Promise<Response> {
    try {
      const result = await sessionService.getAllSessions();
      return res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro interno ao listar sessões",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        timestamp: new Date().toISOString(),
      });
    }
  }
}

// Exportar instância
export const sessionController = new SessionController();
