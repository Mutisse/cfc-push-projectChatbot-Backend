// src/services/SessionService.ts - VERSÃO SIMPLIFICADA FUNCIONAL
import {
  sessionRepository,
  UserSession as RepositoryUserSession,
} from "../Repository/SessionRepository";

export interface UserSession {
  id: string;
  phoneNumber: string;
  sessionId: string;
  startTime: Date;
  lastInteraction: Date;
  context: {
    currentMenuId?: string;
    currentSubmenuId?: string;
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

export class SessionService {
  private activeSessions = new Map<string, UserSession>();

  constructor() {
    console.log("👤 SessionService iniciado - Modo cache em memória");
  }

  // 🎯 Obtém ou cria uma sessão para o usuário
  async getOrCreateSession(phoneNumber: string): Promise<UserSession> {
    // Verifica se já tem em cache
    const cachedSession = this.activeSessions.get(phoneNumber);

    if (cachedSession) {
      // Atualiza timestamp
      cachedSession.lastInteraction = new Date();
      this.activeSessions.set(phoneNumber, cachedSession);

      console.log(`🔄 Sessão do cache: ${phoneNumber}`);
      console.log(
        `   Estado: menu=${cachedSession.context.currentMenuId || "raiz"}, submenu=${cachedSession.context.currentSubmenuId || "nenhum"}`
      );

      return cachedSession;
    }

    // Busca/cria no repositório
    console.log(`🆕 Criando sessão: ${phoneNumber}`);
    const session = await sessionRepository.getOrCreateSession(phoneNumber);

    // 🛡️ GARANTE que context tem todos os campos
    const enhancedSession: UserSession = {
      ...session,
      context: {
        currentMenuId: session.context?.currentMenuId || undefined,
        currentSubmenuId: session.context?.currentSubmenuId || undefined,
        navigationHistory: session.context?.navigationHistory || [],
        userPreferences: session.context?.userPreferences || new Map(),
      },
    };

    // Armazena no cache
    this.activeSessions.set(phoneNumber, enhancedSession);

    console.log(`✅ Sessão criada/carregada:`, {
      phoneNumber,
      currentMenuId: enhancedSession.context.currentMenuId || "raiz",
      currentSubmenuId: enhancedSession.context.currentSubmenuId || "nenhum",
    });

    return enhancedSession;
  }

  // 🎯 ATUALIZA NAVEGAÇÃO - VERSÃO SIMPLES
  async updateNavigation(
    phoneNumber: string,
    updates: {
      currentMenuId?: string | null;
      currentSubmenuId?: string | null;
    }
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(phoneNumber);

      if (session) {
        console.log(`🔄 Atualizando navegação para ${phoneNumber}:`, updates);

        // Atualiza campos
        if (updates.currentMenuId !== undefined) {
          session.context.currentMenuId = updates.currentMenuId || undefined;
        }

        if (updates.currentSubmenuId !== undefined) {
          session.context.currentSubmenuId =
            updates.currentSubmenuId || undefined;
        }

        // 🛡️ GARANTE que navigationHistory existe
        if (!session.context.navigationHistory) {
          session.context.navigationHistory = [];
        }

        // Adiciona ao histórico se mudou de menu
        if (updates.currentMenuId && updates.currentMenuId !== "null") {
          if (
            !session.context.navigationHistory.includes(updates.currentMenuId)
          ) {
            session.context.navigationHistory.push(updates.currentMenuId);

            // Limita histórico
            if (session.context.navigationHistory.length > 10) {
              session.context.navigationHistory =
                session.context.navigationHistory.slice(-10);
            }
          }
        }

        // Atualiza timestamp
        session.lastInteraction = new Date();
        this.activeSessions.set(phoneNumber, session);

        // 🎯 SALVA NO BANCO TAMBÉM (em background)
        setTimeout(async () => {
          try {
            await sessionRepository.recordInteraction(session.sessionId, {
              userInput: "navigation_update",
              botResponse: "state_updated",
              menuId: session.context.currentMenuId,
            });
          } catch (error) {
            console.error("❌ Erro ao salvar navegação no banco:", error);
          }
        }, 0);

        console.log(`✅ Navegação atualizada:`, {
          menu: session.context.currentMenuId || "raiz",
          submenu: session.context.currentSubmenuId || "nenhum",
        });
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar navegação:", error);
    }
  }

  // 🎯 LIMPA NAVEGAÇÃO (volta ao início)
  async clearNavigation(phoneNumber: string): Promise<void> {
    await this.updateNavigation(phoneNumber, {
      currentMenuId: null,
      currentSubmenuId: null,
    });
    console.log(`🧹 Navegação resetada: ${phoneNumber}`);
  }

  // 🎯 OBTÉM ESTADO ATUAL
  getNavigationState(phoneNumber: string): {
    currentMenuId?: string;
    currentSubmenuId?: string;
    isAtRoot: boolean;
    isInSubmenu: boolean;
    isViewingContent: boolean;
  } {
    const session = this.activeSessions.get(phoneNumber);

    if (!session) {
      return {
        isAtRoot: true,
        isInSubmenu: false,
        isViewingContent: false,
      };
    }

    const hasMenu = !!session.context.currentMenuId;
    const hasSubmenu = !!session.context.currentSubmenuId;

    return {
      currentMenuId: session.context.currentMenuId,
      currentSubmenuId: session.context.currentSubmenuId,
      isAtRoot: !hasMenu && !hasSubmenu,
      isInSubmenu: hasMenu && !hasSubmenu,
      isViewingContent: hasMenu && hasSubmenu,
    };
  }

  // 🎯 VOLTA UM NÍVEL
  async goBack(phoneNumber: string): Promise<boolean> {
    const state = this.getNavigationState(phoneNumber);

    if (state.isViewingContent) {
      // Se está vendo conteúdo, volta para lista de submenus
      await this.updateNavigation(phoneNumber, {
        currentSubmenuId: null,
      });
      return true;
    }

    if (state.isInSubmenu) {
      // Se está na lista de submenus, volta para menu principal
      await this.clearNavigation(phoneNumber);
      return true;
    }

    // Já está no início
    return true;
  }

  // 🎯 Registra interação
  async recordInteraction(
    sessionId: string,
    interaction: {
      userInput: string;
      botResponse: string;
      menuId?: string;
      action?: string;
    }
  ): Promise<void> {
    // Executa em background
    setTimeout(async () => {
      try {
        await sessionRepository.recordInteraction(sessionId, interaction);
      } catch (error) {
        console.error("❌ Erro ao registrar interação:", error);
      }
    }, 0);
  }

  // 🎯 Completa sessão
  async completeSession(
    phoneNumber: string,
    reason: string = "user_completed"
  ): Promise<boolean> {
    try {
      const session = this.activeSessions.get(phoneNumber);

      if (session) {
        await sessionRepository.completeSession(session.sessionId, reason);
        this.activeSessions.delete(phoneNumber);

        console.log(`✅ Sessão completada: ${phoneNumber} - ${reason}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error("❌ Erro ao completar sessão:", error);
      return false;
    }
  }

  // 🎯 DEBUG: Mostra estado da sessão
  debugSession(phoneNumber: string): void {
    const session = this.activeSessions.get(phoneNumber);

    if (!session) {
      console.log(`❌ Sessão não encontrada: ${phoneNumber}`);
      return;
    }

    const state = this.getNavigationState(phoneNumber);

    console.log(`\n🔍 DEBUG SESSÃO: ${phoneNumber}`);
    console.log(`   Session ID: ${session.sessionId}`);
    console.log(
      `   Última interação: ${session.lastInteraction.toLocaleTimeString()}`
    );
    console.log(`   Navegação:`);
    console.log(`     Menu ID: ${session.context.currentMenuId || "(raiz)"}`);
    console.log(
      `     Submenu ID: ${session.context.currentSubmenuId || "(nenhum)"}`
    );
    console.log(
      `     Estado: ${state.isAtRoot ? "RAIZ" : state.isInSubmenu ? "SUBMENU" : "CONTEÚDO"}`
    );
    console.log(`   Histórico (${session.context.navigationHistory.length}):`);
    session.context.navigationHistory.forEach((id, i) => {
      console.log(`     ${i + 1}. ${id}`);
    });
  }

  // 🎯 Obtém estatísticas
  getStats(): {
    cacheSize: number;
    sessions: {
      atRoot: number;
      inSubmenu: number;
      viewingContent: number;
    };
  } {
    let atRoot = 0;
    let inSubmenu = 0;
    let viewingContent = 0;

    for (const session of this.activeSessions.values()) {
      const state = this.getNavigationState(session.phoneNumber);

      if (state.isAtRoot) atRoot++;
      else if (state.isInSubmenu) inSubmenu++;
      else if (state.isViewingContent) viewingContent++;
    }

    return {
      cacheSize: this.activeSessions.size,
      sessions: {
        atRoot,
        inSubmenu,
        viewingContent,
      },
    };
  }
  clearAllSessions(): void {
    const count = this.activeSessions.size;
    this.activeSessions.clear();
    console.log(`🧹 ${count} sessões removidas do cache`);
  }
  // 🎯 Limpa cache (para desenvolvimento)
  clearCache(): void {
    this.activeSessions.clear();
    console.log("🧹 Cache de sessões limpo");
  }
}

export const sessionService = new SessionService();
