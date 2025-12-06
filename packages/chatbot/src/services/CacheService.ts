import { menuRepository } from "../Repository/MenuRepository";
import { env } from "../config/env";

export class CacheService {
  private menus: any[] = [];
  private welcomeMessage: any = null;
  private lastRefresh: Date | null = null;
  private refreshHour: number;
  private nextRefreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.refreshHour = parseInt(env.CACHE_REFRESH_HOUR);
    console.log(`🔄 CacheService iniciado - Recarga às ${this.refreshHour}:00`);

    // Agenda a primeira recarga
    this.scheduleNextRefresh();
  }

  // 🎯 Agenda a próxima recarga automática
  private scheduleNextRefresh(): void {
    const now = new Date();
    const nextRefresh = new Date();

    // Configura para a hora especificada (padrão 6:00 AM)
    nextRefresh.setHours(this.refreshHour, 0, 0, 0);

    // Se já passou da hora hoje, agenda para amanhã
    if (now.getTime() > nextRefresh.getTime()) {
      nextRefresh.setDate(nextRefresh.getDate() + 1);
    }

    const timeUntilRefresh = nextRefresh.getTime() - now.getTime();

    console.log(
      `⏰ Próxima recarga agendada para: ${nextRefresh.toLocaleString()}`
    );

    // Agenda a recarga
    this.nextRefreshTimer = setTimeout(() => {
      this.performMorningRefresh();
      // Após a primeira, agenda a cada 24 horas
      setInterval(() => this.performMorningRefresh(), 24 * 60 * 60 * 1000);
    }, timeUntilRefresh);
  }

  // 🎯 Executa a recarga matinal completa
  private async performMorningRefresh(): Promise<void> {
    console.log(
      `\n🌅 ${new Date().toLocaleString()} - INICIANDO RECARGA MATINAL`
    );

    try {
      // 1. Carrega menus
      console.log("📥 Carregando menus do MongoDB...");
      const menus = await menuRepository.findAllActive();

      if (!menus || menus.length === 0) {
        console.warn("⚠️ Nenhum menu encontrado - mantendo cache anterior");
      } else {
        this.menus = menus;
        console.log(`✅ ${menus.length} menus carregados no cache`);

        // Log de estatísticas
        const stats = await menuRepository.getStats();
        console.log(
          `📊 Estatísticas: ${stats.total} total, ${stats.rootMenus} raiz, ${stats.submenus} submenus`
        );
      }

      // 2. Carrega welcome message (simplificado)
      this.welcomeMessage = {
        title: "🏛️ CFC PUSH",
        message: "Shalom! Bem-vindo à Igreja da Família Cristã.",
        instructions: "Para continuar, selecione uma das opções abaixo:",
        quickTip: "💡 Digite 'menu' para voltar ao menu principal",
      };

      // 3. Atualiza timestamp
      this.lastRefresh = new Date();

      console.log(
        `🎉 RECARGA MATINAL CONCLUÍDA às ${new Date().toLocaleTimeString()}`
      );
      console.log(
        `📅 Próxima recarga: ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString()}`
      );
    } catch (error: any) {
      console.error("❌ ERRO NA RECARGA MATINAL:", error.message);
      // Em caso de erro, mantém o cache anterior (fail-safe)
    }
  }

  // 🎯 Força uma recarga manual (para testes/debug)
  async forceRefresh(): Promise<boolean> {
    console.log("🔃 Forçando recarga manual do cache...");

    try {
      await this.performMorningRefresh();
      return true;
    } catch (error) {
      console.error("❌ Erro na recarga manual:", error);
      return false;
    }
  }

  // 🎯 Obtém todos os menus do cache
  getAllMenus(): any[] {
    return this.menus;
  }

  // 🎯 Obtém menus raiz
  getRootMenus(): any[] {
    return this.menus
      .filter((menu) => !menu.parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // 🎯 Obtém submenus de um menu pai
  getSubmenus(parentId: string): any[] {
    if (!parentId) return [];

    return this.menus
      .filter((menu) => menu.parentId && menu.parentId.toString() === parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  // 🎯 Obtém um menu por ID
  getMenuById(menuId: string): any | undefined {
    return this.menus.find((menu) => menu._id?.toString() === menuId);
  }

  // 🎯 Obtém mensagem de boas-vindas
  getWelcomeMessage(): any {
    return this.welcomeMessage;
  }

  // 🎯 Obtém estatísticas do cache
  getCacheStats(): {
    totalMenus: number;
    rootMenus: number;
    submenus: number;
    lastRefresh: string | null;
    nextRefresh: string;
    isLoaded: boolean;
  } {
    const rootMenus = this.menus.filter((m) => !m.parentId).length;
    const submenus = this.menus.length - rootMenus;

    // Calcula próxima recarga
    const nextRefresh = new Date();
    nextRefresh.setHours(this.refreshHour, 0, 0, 0);
    if (nextRefresh.getTime() < Date.now()) {
      nextRefresh.setDate(nextRefresh.getDate() + 1);
    }

    return {
      totalMenus: this.menus.length,
      rootMenus,
      submenus,
      lastRefresh: this.lastRefresh?.toLocaleString() || null,
      nextRefresh: nextRefresh.toLocaleString(),
      isLoaded: this.menus.length > 0,
    };
  }

  // 🎯 Verifica se o cache está carregado
  isLoaded(): boolean {
    return this.menus.length > 0;
  }

  // 🎯 Limpa o timer ao destruir
  cleanup(): void {
    if (this.nextRefreshTimer) {
      clearTimeout(this.nextRefreshTimer);
    }
  }
}

// Singleton global
export const cacheService = new CacheService();
