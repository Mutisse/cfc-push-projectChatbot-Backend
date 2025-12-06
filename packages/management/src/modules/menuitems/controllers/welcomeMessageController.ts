import { Request, Response } from "express";
import { WelcomeMessageService } from "../services/welcomeMessageService";
import {
  CreateWelcomeMessageDto,
  UpdateWelcomeMessageDto,
} from "../interfaces/welcome-message.interface";
import { WelcomeMessageMapper } from "../utils/welcomeMessageMapper";

export class WelcomeMessageController {
  private welcomeMessageService: WelcomeMessageService;

  constructor() {
    this.welcomeMessageService = new WelcomeMessageService();
  }

  // Buscar mensagem ativa
  getActiveMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const message = await this.welcomeMessageService.getActiveMessage();

      if (!message) {
        res.status(404).json({
          success: false,
          message: "Nenhuma mensagem de boas-vindas ativa encontrada",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: WelcomeMessageMapper.toResponse(message),
        message: "Mensagem ativa recuperada com sucesso",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro interno do servidor",
      });
    }
  };

  // Buscar todas as mensagens
  getAllMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const messages = await this.welcomeMessageService.getAllMessages();

      res.status(200).json({
        success: true,
        data: WelcomeMessageMapper.toResponseArray(messages),
        message: "Mensagens recuperadas com sucesso",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro interno do servidor",
      });
    }
  };

  // Buscar mensagem por ID
  getMessageById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const message = await this.welcomeMessageService.getMessageById(id);

      if (!message) {
        res.status(404).json({
          success: false,
          message: "Mensagem não encontrada",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: WelcomeMessageMapper.toResponse(message),
        message: "Mensagem recuperada com sucesso",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro interno do servidor",
      });
    }
  };

  // Criar nova mensagem
  createMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const messageData: CreateWelcomeMessageDto = req.body;
      const newMessage = await this.welcomeMessageService.createMessage(
        messageData
      );

      res.status(201).json({
        success: true,
        data: WelcomeMessageMapper.toResponse(newMessage),
        message: "Mensagem criada com sucesso",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao criar mensagem",
      });
    }
  };

  // Atualizar mensagem
  updateMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const messageData: UpdateWelcomeMessageDto = req.body;
      const updatedMessage = await this.welcomeMessageService.updateMessage(
        id,
        messageData
      );

      if (!updatedMessage) {
        res.status(404).json({
          success: false,
          message: "Mensagem não encontrada",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: WelcomeMessageMapper.toResponse(updatedMessage),
        message: "Mensagem atualizada com sucesso",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao atualizar mensagem",
      });
    }
  };

  // Soft delete
  deleteMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deletedMessage = await this.welcomeMessageService.deleteMessage(id);

      if (!deletedMessage) {
        res.status(404).json({
          success: false,
          message: "Mensagem não encontrada",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: WelcomeMessageMapper.toResponse(deletedMessage),
        message: "Mensagem excluída com sucesso",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao excluir mensagem",
      });
    }
  };

  // Restaurar mensagem
  restoreMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const restoredMessage = await this.welcomeMessageService.restoreMessage(
        id
      );

      if (!restoredMessage) {
        res.status(404).json({
          success: false,
          message: "Mensagem não encontrada ou não está deletada",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: WelcomeMessageMapper.toResponse(restoredMessage),
        message: "Mensagem restaurada com sucesso",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao restaurar mensagem",
      });
    }
  };

  // Ativar/Desativar mensagem
  toggleMessageActive = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const updatedMessage =
        await this.welcomeMessageService.toggleMessageActive(id, isActive);

      if (!updatedMessage) {
        res.status(404).json({
          success: false,
          message: "Mensagem não encontrada",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: WelcomeMessageMapper.toResponse(updatedMessage),
        message: `Mensagem ${isActive ? "ativada" : "desativada"} com sucesso`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro ao alterar status da mensagem",
      });
    }
  };

  // Buscar mensagens deletadas
  getDeletedMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const deletedMessages =
        await this.welcomeMessageService.getDeletedMessages();

      res.status(200).json({
        success: true,
        data: WelcomeMessageMapper.toResponseArray(deletedMessages),
        message: "Mensagens deletadas recuperadas com sucesso",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro interno do servidor",
      });
    }
  };
}
