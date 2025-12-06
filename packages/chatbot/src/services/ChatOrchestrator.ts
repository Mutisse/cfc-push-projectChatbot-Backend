// src/services/ChatOrchestrator.ts - VERSÃO ATUALIZADA COM ANALYTICS
import { cacheService } from "./CacheService";
import { analyticsService } from "./AnalyticsService"; // ADICIONADO

// Sistema de estado SIMPLES
let currentState: {
  phone: string;
  level: "main" | "in_menu" | "in_content";
  menuId?: string;
} | null = null;

export class ChatOrchestrator {
  async processMessage(phoneNumber: string, userMessage: string) {
    const msg = userMessage.trim().toLowerCase();

    console.log(
      `📱 [${phoneNumber}]: "${userMessage}" (Nível: ${currentState?.level || "main"})`
    );

    try {
      // 🎯 REGISTRA NO ANALYTICS (ADICIONADO)
      analyticsService.trackInteraction(phoneNumber);

      // Se for primeira mensagem do dia para este usuário, registra sessão
      if (!currentState || currentState.phone !== phoneNumber) {
        analyticsService.trackNewSession(phoneNumber);
      }

      // 🎯 1. PRIMEIRO: Verifica se é uma mensagem de saudação ou reinício
      if (this.isGreetingMessage(msg)) {
        currentState = { phone: phoneNumber, level: "main" };
        return this.showGreetingMessage();
      }

      // 🎯 2. VERIFICA SE É UM COMANDO ESPECIAL
      if (this.isSpecialCommand(msg)) {
        return this.handleSpecialCommand(msg, phoneNumber);
      }

      // 🎯 3. VERIFICA SE É UM NÚMERO (opção de menu)
      if (/^\d+$/.test(msg)) {
        return this.handleNumberSelection(parseInt(msg), phoneNumber);
      }

      // 🎯 4. SE NENHUM DOS ACIMA: Usuário digitou algo não reconhecido
      return this.handleUnknownMessage(phoneNumber, userMessage);
    } catch (error) {
      console.error("❌ Erro no ChatOrchestrator:", error);
      return this.getErrorMessage();
    }
  }

  // 🎯 Verifica se é uma mensagem de saudação
  private isGreetingMessage(message: string): boolean {
    const greetings = [
      "shalom",
      "oi",
      "olá",
      "ola",
      "bom dia",
      "boa tarde",
      "boa noite",
      "hello",
      "hi",
      "hey",
      "alô",
      "alo",
      "eae",
      "opa",
      "salve",
      "começar",
      "iniciar",
      "start",
      "help",
      "ajuda",
    ];

    return (
      greetings.includes(message) ||
      message.startsWith("shalom") ||
      message.includes("oi") ||
      message.includes("olá")
    );
  }

  // 🎯 Verifica se é um comando especial
  private isSpecialCommand(message: string): boolean {
    const commands = [
      "menu",
      "voltar",
      "back",
      "<",
      "#",
      "0",
      "sair",
      "encerrar",
      "15",
    ];
    return commands.includes(message);
  }

  // 🎯 Mostra mensagem de saudação amigável
  private showGreetingMessage() {
    const welcome = cacheService.getWelcomeMessage();

    let response = `Shalom! 🕊️\n\n`;
    response += `Shalom! 👋 ${welcome.message}\n\n`;
    response += `Digite *"menu"* para ver as opções.\n\n`;

    response += `💡 *Dicas de navegação:*\n`;
    response += `   - Digite o *número* da opção desejada\n`;
    response += `   - Use *voltar* para voltar um nível\n`;
    response += `   - Use *menu* para voltar ao menu principal\n`;
    response += `   - Digite *shalom* para reiniciar`;

    return {
      success: true,
      message: response,
    };
  }

  // 🎯 Trata comandos especiais
  private handleSpecialCommand(command: string, phoneNumber: string) {
    // Garante que tem um estado
    if (!currentState || currentState.phone !== phoneNumber) {
      currentState = { phone: phoneNumber, level: "main" };
    }

    switch (command) {
      case "menu":
      case "#":
      case "0":
        currentState.level = "main";
        currentState.menuId = undefined;
        console.log(`🏠 ${phoneNumber}: Comando 'menu' → Menu principal`);
        return this.showMainMenu();

      case "voltar":
      case "back":
      case "<":
        return this.handleGoBack(phoneNumber);

      case "sair":
      case "encerrar":
      case "15":
        currentState = null;
        return {
          success: true,
          message:
            "Atendimento encerrado. Shalom! Que Deus te abençoe! 🙏\n\nPara reiniciar, digite *shalom*.",
        };

      default:
        return this.showGreetingMessage();
    }
  }

  // 🎯 Trata a ação de voltar
  private handleGoBack(phoneNumber: string) {
    if (!currentState) {
      return this.showGreetingMessage();
    }

    if (currentState.level === "in_content") {
      // Se está vendo conteúdo
      if (currentState.menuId) {
        const submenus = cacheService.getSubmenus(currentState.menuId);

        if (submenus.length === 0) {
          // Menu SEM submenus → vai direto para menu principal
          currentState.level = "main";
          currentState.menuId = undefined;
          console.log(`↩️  ${phoneNumber}: Conteúdo direto → Menu principal`);
          return this.showMainMenu();
        } else {
          // Menu COM submenus → volta para lista
          currentState.level = "in_menu";
          const menu = cacheService.getMenuById(currentState.menuId);
          if (menu) {
            console.log(`↩️  ${phoneNumber}: Conteúdo → Lista de submenus`);
            return this.showSubmenuList(menu);
          }
        }
      }
    } else if (currentState.level === "in_menu") {
      // Se está na lista, volta para menu principal
      currentState.level = "main";
      currentState.menuId = undefined;
      console.log(`↩️  ${phoneNumber}: Lista submenus → Menu principal`);
      return this.showMainMenu();
    }

    // Já está no menu principal ou outro caso
    return this.showMainMenu();
  }

  // 🎯 Trata seleção de números
  private handleNumberSelection(number: number, phoneNumber: string) {
    // Garante que tem um estado
    if (!currentState || currentState.phone !== phoneNumber) {
      currentState = { phone: phoneNumber, level: "main" };
    }

    // Se está no menu principal
    if (currentState.level === "main") {
      const menus = cacheService.getRootMenus();
      const menu = menus.find((m) => (m.order || 0) === number);

      if (!menu) {
        return {
          success: false,
          message: `❌ Opção ${number} não disponível.\n\nDigite *menu* para ver as opções.`,
        };
      }

      const submenus = cacheService.getSubmenus(menu._id.toString());

      if (submenus.length > 0) {
        // Tem submenus → mostra lista
        currentState.level = "in_menu";
        currentState.menuId = menu._id.toString();
        console.log(
          `📋 ${phoneNumber}: Menu ${number} → Lista submenus "${menu.title}"`
        );

        // REGISTRA ACESSO AO MENU NO ANALYTICS (ADICIONADO)
        analyticsService.trackInteraction(phoneNumber, menu._id.toString());

        return this.showSubmenuList(menu);
      } else {
        // Não tem submenus → mostra conteúdo direto
        currentState.level = "in_content";
        currentState.menuId = menu._id.toString();
        console.log(
          `📄 ${phoneNumber}: Menu ${number} → Conteúdo direto "${menu.title}"`
        );

        // REGISTRA ACESSO AO MENU NO ANALYTICS (ADICIONADO)
        analyticsService.trackInteraction(phoneNumber, menu._id.toString());

        return this.showMenuContent(menu);
      }
    }

    // Se está na lista de submenus
    if (currentState.level === "in_menu" && currentState.menuId) {
      const submenus = cacheService.getSubmenus(currentState.menuId);
      const submenu = submenus.find((s) => (s.order || 0) === number);

      if (!submenu) {
        return {
          success: false,
          message: `❌ Opção ${number} não disponível aqui.\n\nDigite *voltar* para ver as opções novamente.`,
        };
      }

      // Ação especial: Voltar ao menu principal
      if (submenu.type === "action" && submenu.payload === "BACK_TO_MAIN") {
        currentState.level = "main";
        currentState.menuId = undefined;
        console.log(`🏠 ${phoneNumber}: Ação especial → Menu principal`);
        return this.showMainMenu();
      }

      // Mostra conteúdo do submenu
      currentState.level = "in_content";
      console.log(
        `📄 ${phoneNumber}: Submenu ${number} → Conteúdo "${submenu.title}"`
      );

      // REGISTRA ACESSO AO SUBMENU NO ANALYTICS (ADICIONADO)
      analyticsService.trackInteraction(phoneNumber, submenu._id.toString());

      return this.showMenuContent(submenu);
    }

    // Se está vendo conteúdo e digita número, volta para lista
    if (currentState.level === "in_content") {
      currentState.level = "in_menu";
      if (currentState.menuId) {
        const menu = cacheService.getMenuById(currentState.menuId);
        if (menu) {
          console.log(
            `↩️  ${phoneNumber}: Conteúdo → Lista (número ${number} digitado)`
          );
          return this.showSubmenuList(menu);
        }
      }
    }

    // Padrão
    return this.showGreetingMessage();
  }

  // 🎯 Trata mensagem desconhecida (usuário digitou algo não reconhecido)
  private handleUnknownMessage(phoneNumber: string, userMessage: string) {
    console.log(`🤔 ${phoneNumber}: Mensagem desconhecida: "${userMessage}"`);

    // Se não tem estado, mostra saudação
    if (!currentState || currentState.phone !== phoneNumber) {
      return this.showGreetingMessage();
    }

    // Dependendo do estado atual, dá instruções específicas
    let response = `🤖 Não entendi sua mensagem: "${userMessage}"\n\n`;

    if (currentState.level === "main") {
      response += `Você está no *menu principal*.\n`;
      response += `Digite o *número* da opção desejada ou *"menu"* para ver as opções novamente.`;
    } else if (currentState.level === "in_menu") {
      response += `Você está escolhendo uma opção.\n`;
      response += `Digite o *número* da opção ou *"voltar"* para voltar.`;
    } else if (currentState.level === "in_content") {
      response += `Você está vendo um conteúdo.\n`;
      response += `Digite *"voltar"* para voltar às opções ou *"menu"* para ir ao menu principal.`;
    }

    response += `\n\n💡 *Dica:* Digite *"shalom"* para reiniciar a conversa.`;

    return {
      success: true,
      message: response,
    };
  }

  // 🎯 Mostra lista de submenus
  private showSubmenuList(menu: any) {
    const submenus = cacheService.getSubmenus(menu._id.toString());

    let response = `**${menu.title}**\n`;
    if (menu.description) {
      response += `${menu.description}\n\n`;
    } else {
      response += "\n";
    }

    // Ordena submenus
    const sortedSubmenus = [...submenus].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    sortedSubmenus.forEach((sub) => {
      response += `${sub.order || 0}. ${sub.title}\n`;
    });

    response += `\n💡 Digite o *número* da opção\n`;
    response += `   Ou *voltar* para voltar ao menu principal`;

    return {
      success: true,
      message: response,
      menuId: menu._id.toString(),
    };
  }

  // 🎯 Mostra conteúdo do menu
  private showMenuContent(menu: any) {
    let response = "";

    // Título
    const cleanTitle = menu.title
      .replace(/[📍📝🙏👨‍💼⏰💝🏠🤝🔔🎵🎯🛍️💰❌]/g, "")
      .trim();
    response += `**${cleanTitle}**\n\n`;

    // Descrição
    if (menu.description?.trim()) {
      response += `${menu.description}\n\n`;
    }

    // Conteúdo principal
    if (menu.content?.trim()) {
      response += `${menu.content}\n\n`;
    }

    // URL
    if (menu.url?.trim()) {
      response += `🔗 ${menu.url}\n\n`;
    }

    // Se não tem conteúdo, mostra mensagem padrão
    if (
      !menu.content?.trim() &&
      !menu.url?.trim() &&
      !menu.description?.trim()
    ) {
      response += `Informações disponíveis em breve...\n\n`;
    }

    // Instruções de navegação
    if (menu.type === "action" && menu.payload === "END_CHAT") {
      response += `Shalom! Que Deus te abençoe! 🙏\n\nPara reiniciar, digite *shalom*.`;
    } else {
      const submenus = cacheService.getSubmenus(menu._id?.toString() || "");
      if (submenus.length === 0) {
        // Menu SEM submenus
        response += `💡 Digite *voltar* para voltar ao menu principal\n`;
        response += `   Ou *menu* para reiniciar`;
      } else {
        // Menu COM submenus
        response += `💡 Digite *voltar* para voltar às opções\n`;
        response += `   Ou *menu* para voltar ao menu principal`;
      }
    }

    return {
      success: true,
      message: response,
      menuId: menu._id?.toString(),
    };
  }

  // 🎯 Menu principal
  private showMainMenu() {
    const welcome = cacheService.getWelcomeMessage();
    const menus = cacheService.getRootMenus();

    let response = `${welcome.title}\n\n`;
    response += `${welcome.message}\n\n`;

    // Ordena menus por ordem
    const sortedMenus = [...menus].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    sortedMenus.forEach((menu) => {
      response += `${menu.order || 0}. ${menu.title}\n`;
    });

    response += `\n💡 *Dicas de navegação:*\n`;
    response += `   - Digite o *número* da opção desejada\n`;
    response += `   - Use *voltar* para voltar um nível\n`;
    response += `   - Use *menu* para voltar ao menu principal\n`;
    response += `   - Digite *shalom* para reiniciar\n\n`;
    response += `${welcome.quickTip}`;

    return {
      success: true,
      message: response,
    };
  }

  // 🎯 Mensagem de erro
  private getErrorMessage() {
    return {
      success: false,
      message:
        "❌ Desculpe, ocorreu um erro.\n\nDigite *shalom* para reiniciar a conversa.",
    };
  }
}

export const chatOrchestrator = new ChatOrchestrator();
