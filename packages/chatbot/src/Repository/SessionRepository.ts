// src/Repository/SessionRepository.ts - VERSÃO CORRIGIDA (TYPESCRIPT FIX)
import { SessionModel } from "../models/Session";
import mongoose from "mongoose";

export interface UserSession {
  id: string;
  phoneNumber: string;
  sessionId: string;
  startTime: Date;
  lastInteraction: Date;
  context: {
    currentMenuId?: string | null; // 🎯 PERMITE NULL
    currentSubmenuId?: string | null; // 🎯 PERMITE NULL
    navigationHistory: string[];
    userPreferences: Map<string, any>;
  };
  interactions: Array<{
    timestamp: Date;
    userInput: string;
    botResponse: string;
    menuId?: string;
    action?: string;
  }>;
  status: "active" | "completed" | "expired";
}

// Interface para o documento MongoDB
interface ISessionDocument extends mongoose.Document {
  sessionId: string;
  phoneNumber: string;
  serviceType: string;
  startTime: Date;
  lastInteraction: Date;
  status: "active" | "completed" | "expired";
  context: {
    currentMenuId?: string | null; // 🎯 PERMITE NULL
    currentSubmenuId?: string | null; // 🎯 PERMITE NULL
    navigationHistory: string[];
    userPreferences: Map<string, any>;
  };
  interactions: Array<{
    timestamp: Date;
    userInput: string;
    botResponse: string;
    menuId?: string;
    action?: string;
  }>;
  completedAt?: Date;
  completionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SessionRepository {
  // 🎯 ADICIONE ESTE MÉTODO QUE ESTÁ FALTANDO
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await SessionModel.updateMany(
        {
          status: "active",
          lastInteraction: { $lt: twentyFourHoursAgo },
        },
        {
          status: "expired",
          completionReason: "auto_expired_24h",
          completedAt: new Date(),
        }
      );

      console.log(`🧹 Limpadas ${result.modifiedCount || 0} sessões expiradas`);
      return result.modifiedCount || 0;
    } catch (error) {
      console.error("❌ Erro ao limpar sessões expiradas:", error);
      return 0;
    }
  }

  // 🎯 Cria ou recupera sessão existente
  async getOrCreateSession(phoneNumber: string): Promise<UserSession> {
    try {
      // Primeiro, verifica se há sessão ativa recente
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

      const existingSession = (await SessionModel.findOne({
        phoneNumber,
        status: "active",
        lastInteraction: { $gte: fourHoursAgo },
      })) as ISessionDocument | null;

      if (existingSession) {
        // Atualiza timestamp
        existingSession.lastInteraction = new Date();
        await existingSession.save();

        return this.mapToUserSession(existingSession);
      }

      // Cria nova sessão
      const sessionId = `sess_${Date.now()}_${phoneNumber}`;

      const newSession = new SessionModel({
        sessionId,
        phoneNumber,
        startTime: new Date(),
        lastInteraction: new Date(),
        status: "active",
        context: {
          currentMenuId: null,
          currentSubmenuId: null,
          navigationHistory: [],
          userPreferences: new Map(),
        },
        interactions: [],
      });

      await newSession.save();

      return this.mapToUserSession(newSession as ISessionDocument);
    } catch (error) {
      console.error("❌ Erro no SessionRepository.getOrCreateSession:", error);
      throw error;
    }
  }

  // 🎯 Registra uma interação na sessão
  async recordInteraction(
    sessionId: string,
    interaction: {
      userInput: string;
      botResponse: string;
      menuId?: string;
      action?: string;
    }
  ): Promise<UserSession | null> {
    try {
      const session = (await SessionModel.findOne({
        sessionId,
      })) as ISessionDocument | null;

      if (!session) {
        return null;
      }

      // 🛡️ GARANTE que context existe
      if (!session.context) {
        session.context = {
          currentMenuId: null,
          currentSubmenuId: null,
          navigationHistory: [],
          userPreferences: new Map(),
        };
      }

      // Inicializa campos se não existirem
      if (session.context.currentMenuId === undefined) {
        session.context.currentMenuId = null;
      }

      if (session.context.currentSubmenuId === undefined) {
        session.context.currentSubmenuId = null;
      }

      if (!session.context.navigationHistory) {
        session.context.navigationHistory = [];
      }

      if (!session.context.userPreferences) {
        session.context.userPreferences = new Map();
      }

      // 🎯 ATUALIZA CONTEXTO SE RECEBEU menuId
      if (interaction.menuId) {
        session.context.currentMenuId = interaction.menuId;

        // Adiciona ao histórico
        if (!session.context.navigationHistory.includes(interaction.menuId)) {
          session.context.navigationHistory.push(interaction.menuId);

          // Limita histórico a 10 itens
          if (session.context.navigationHistory.length > 10) {
            session.context.navigationHistory =
              session.context.navigationHistory.slice(-10);
          }
        }
      }

      // Inicializa interactions array se não existir
      if (!session.interactions) {
        session.interactions = [];
      }

      // Registra a interação
      session.interactions.push({
        timestamp: new Date(),
        userInput: interaction.userInput,
        botResponse: interaction.botResponse.substring(0, 500),
        menuId: interaction.menuId,
        action: interaction.action,
      });

      session.lastInteraction = new Date();
      await session.save();

      return this.mapToUserSession(session);
    } catch (error) {
      console.error("❌ Erro no SessionRepository.recordInteraction:", error);
      return null;
    }
  }

  // 🎯 Mapeia documento MongoDB para interface UserSession - VERSÃO CORRIGIDA
  private mapToUserSession(doc: ISessionDocument): UserSession {
    console.log("🔍 Mapeando sessão do MongoDB:", {
      sessionId: doc.sessionId,
      context: doc.context,
      hasCurrentMenuId: !!doc.context?.currentMenuId,
      hasCurrentSubmenuId: !!doc.context?.currentSubmenuId,
    });

    // 🛡️ GARANTE valores default
    const context = doc.context || {};

    return {
      id: doc._id.toString(),
      sessionId: doc.sessionId,
      phoneNumber: doc.phoneNumber,
      startTime: doc.startTime,
      lastInteraction: doc.lastInteraction,
      context: {
        currentMenuId: context.currentMenuId || undefined, // Converte null para undefined
        currentSubmenuId: context.currentSubmenuId || undefined, // Converte null para undefined
        navigationHistory: context.navigationHistory || [],
        userPreferences: context.userPreferences || new Map(),
      },
      interactions: doc.interactions || [],
      status: doc.status,
    };
  }

  // 🎯 Completa uma sessão
  async completeSession(
    sessionId: string,
    reason: string = "user_completed"
  ): Promise<UserSession | null> {
    try {
      const session = (await SessionModel.findOne({
        sessionId,
      })) as ISessionDocument | null;

      if (!session) {
        return null;
      }

      session.status = "completed";
      session.completedAt = new Date();
      session.completionReason = reason;

      await session.save();

      return this.mapToUserSession(session);
    } catch (error) {
      console.error("❌ Erro no SessionRepository.completeSession:", error);
      return null;
    }
  }

  // 🎯 Obtém estatísticas de sessões
  async getSessionStats(): Promise<{
    totalSessions: number;
    activeSessions: number;
    avgInteractions: number;
    todaySessions: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalSessions = await SessionModel.countDocuments();
      const activeSessions = await SessionModel.countDocuments({
        status: "active",
      });
      const todaySessions = await SessionModel.countDocuments({
        startTime: { $gte: today },
      });

      // Média de interações por sessão
      const sessionsWithInteractions = (await SessionModel.find({
        "interactions.0": { $exists: true },
      })) as ISessionDocument[];

      let totalInteractions = 0;
      sessionsWithInteractions.forEach((session) => {
        totalInteractions += session.interactions?.length || 0;
      });

      const avgInteractions =
        sessionsWithInteractions.length > 0
          ? Math.round(totalInteractions / sessionsWithInteractions.length)
          : 0;

      return {
        totalSessions,
        activeSessions,
        avgInteractions,
        todaySessions,
      };
    } catch (error) {
      console.error("❌ Erro no SessionRepository.getSessionStats:", error);
      return {
        totalSessions: 0,
        activeSessions: 0,
        avgInteractions: 0,
        todaySessions: 0,
      };
    }
  }
}

export const sessionRepository = new SessionRepository();
