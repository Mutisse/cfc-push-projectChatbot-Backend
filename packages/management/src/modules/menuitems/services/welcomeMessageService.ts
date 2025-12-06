import { WelcomeMessageRepository } from '../repositories/welcomeMessageRepository';
import { IWelcomeMessage, CreateWelcomeMessageDto, UpdateWelcomeMessageDto } from '../interfaces/welcome-message.interface';

export class WelcomeMessageService {
  private welcomeMessageRepository: WelcomeMessageRepository;

  constructor() {
    this.welcomeMessageRepository = new WelcomeMessageRepository();
  }

  // Buscar mensagem ativa
  async getActiveMessage(): Promise<IWelcomeMessage | null> {
    return await this.welcomeMessageRepository.findActive();
  }

  // Buscar todas as mensagens (não deletadas)
  async getAllMessages(): Promise<IWelcomeMessage[]> {
    return await this.welcomeMessageRepository.findAll();
  }

  // Buscar mensagem por ID
  async getMessageById(id: string): Promise<IWelcomeMessage | null> {
    if (!id) throw new Error('ID é obrigatório');
    return await this.welcomeMessageRepository.findActiveById(id);
  }

  // Criar nova mensagem
  async createMessage(messageData: CreateWelcomeMessageDto): Promise<IWelcomeMessage> {
    if (!messageData.title || !messageData.message) {
      throw new Error('Título e mensagem são obrigatórios');
    }

    return await this.welcomeMessageRepository.create(messageData);
  }

  // Atualizar mensagem
  async updateMessage(id: string, messageData: UpdateWelcomeMessageDto): Promise<IWelcomeMessage | null> {
    if (!id) throw new Error('ID é obrigatório');

    const existingMessage = await this.welcomeMessageRepository.findActiveById(id);
    if (!existingMessage) throw new Error('Mensagem não encontrada');

    return await this.welcomeMessageRepository.update(id, messageData);
  }

  // Soft delete
  async deleteMessage(id: string): Promise<IWelcomeMessage | null> {
    if (!id) throw new Error('ID é obrigatório');

    const existingMessage = await this.welcomeMessageRepository.findActiveById(id);
    if (!existingMessage) throw new Error('Mensagem não encontrada');

    return await this.welcomeMessageRepository.softDelete(id);
  }

  // Restaurar mensagem
  async restoreMessage(id: string): Promise<IWelcomeMessage | null> {
    if (!id) throw new Error('ID é obrigatório');

    const existingMessage = await this.welcomeMessageRepository.findById(id);
    if (!existingMessage) throw new Error('Mensagem não encontrada');
    if (!existingMessage.deletedAt) throw new Error('Mensagem não está deletada');

    return await this.welcomeMessageRepository.restore(id);
  }

  // Ativar/Desativar mensagem
  async toggleMessageActive(id: string, isActive: boolean): Promise<IWelcomeMessage | null> {
    if (!id) throw new Error('ID é obrigatório');

    const existingMessage = await this.welcomeMessageRepository.findActiveById(id);
    if (!existingMessage) throw new Error('Mensagem não encontrada');

    return await this.welcomeMessageRepository.toggleActive(id, isActive);
  }

  // Buscar mensagens deletadas
  async getDeletedMessages(): Promise<IWelcomeMessage[]> {
    return await this.welcomeMessageRepository.findDeleted();
  }
}