// src/repositories/WelcomeRepository.ts - VERSÃO CORRIGIDA
import { WelcomeMessage, IWelcomeMessage } from "../models/WelcomeMessage";
import type { Document } from "mongoose";

export class WelcomeRepository {
  async getActiveWelcomeMessage(): Promise<IWelcomeMessage | null> {
    try {
      console.log(
        "🔍 Buscando mensagem de boas-vindas na collection welcomemessages..."
      );

      // 🔧 REMOVER .lean() e usar o documento completo
      const message = await WelcomeMessage.findOne({
        isActive: true,
        deletedAt: null,
      })
        .sort({ createdAt: -1 })
        .exec(); // .exec() em vez de .lean()

      if (message) {
        console.log("✅ Mensagem de boas-vindas encontrada:", message.title);
        return message;
      }

      console.log("⚠️ Nenhuma mensagem de boas-vindas ativa encontrada");
      return null;
    } catch (error: any) {
      console.error(
        "❌ Erro ao buscar mensagem de boas-vindas:",
        error.message
      );
      return null;
    }
  }

  async createDefaultWelcomeMessage(): Promise<IWelcomeMessage> {
    try {
      const defaultMessage = {
        title: "🏛️ CFC PUSH - Igreja da Família Cristã",
        message:
          "Shalom! 👋 Agradecemos por entrar em contato connosco. Somos a Igreja da Família Cristã, comprometida em servir e edificar vidas.",
        instructions: "*Para continuar, selecione uma das opções abaixo:*",
        quickTip:
          "💡 *Navegação rápida:* Digite [#] para voltar ao menu principal",
        isActive: true,
        version: "1.0",
      };

      const message = new WelcomeMessage(defaultMessage);
      await message.save();

      console.log("✅ Mensagem de boas-vindas padrão criada");
      return message;
    } catch (error: any) {
      console.error("❌ Erro ao criar mensagem padrão:", error.message);
      throw error;
    }
  }
}

export const welcomeRepository = new WelcomeRepository();
