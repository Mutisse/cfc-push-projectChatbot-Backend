import { WelcomeMessage } from '../models/WelcomeMessage';
import { IWelcomeMessage, CreateWelcomeMessageDto, UpdateWelcomeMessageDto } from '../interfaces/welcome-message.interface';
import { Types } from 'mongoose';

export class WelcomeMessageRepository {
  
  // Buscar mensagem ativa (não deletada)
  async findActive(): Promise<IWelcomeMessage | null> {
    return await WelcomeMessage.findOne({ 
      isActive: true, 
      deletedAt: null 
    }).exec();
  }

  // Buscar todas (não deletadas)
  async findAll(): Promise<IWelcomeMessage[]> {
    return await WelcomeMessage.find({ 
      deletedAt: null 
    }).sort({ createdAt: -1 }).exec();
  }

  // Buscar por ID (incluindo deletadas)
  async findById(id: string): Promise<IWelcomeMessage | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return await WelcomeMessage.findById(id).exec();
  }

  // Buscar por ID (apenas não deletadas)
  async findActiveById(id: string): Promise<IWelcomeMessage | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return await WelcomeMessage.findOne({ 
      _id: id, 
      deletedAt: null 
    }).exec();
  }

  // Criar nova mensagem
  async create(messageData: CreateWelcomeMessageDto): Promise<IWelcomeMessage> {
    // Se está ativando, desativa todas as outras
    if (messageData.isActive) {
      await WelcomeMessage.updateMany(
        { isActive: true },
        { isActive: false }
      );
    }

    const message = new WelcomeMessage(messageData);
    return await message.save();
  }

  // Atualizar mensagem
  async update(id: string, messageData: UpdateWelcomeMessageDto): Promise<IWelcomeMessage | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    // Se está ativando, desativa todas as outras
    if (messageData.isActive) {
      await WelcomeMessage.updateMany(
        { _id: { $ne: id }, isActive: true },
        { isActive: false }
      );
    }

    return await WelcomeMessage.findByIdAndUpdate(
      id, 
      { ...messageData, updatedAt: new Date() },
      { new: true }
    ).exec();
  }

  // Soft delete
  async softDelete(id: string): Promise<IWelcomeMessage | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    
    return await WelcomeMessage.findByIdAndUpdate(
      id,
      { 
        deletedAt: new Date(),
        isActive: false // Desativa ao deletar
      },
      { new: true }
    ).exec();
  }

  // Restaurar mensagem deletada
  async restore(id: string): Promise<IWelcomeMessage | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    
    return await WelcomeMessage.findByIdAndUpdate(
      id,
      { deletedAt: null },
      { new: true }
    ).exec();
  }

  // Ativar/Desativar
  async toggleActive(id: string, isActive: boolean): Promise<IWelcomeMessage | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    // Se está ativando, desativa todas as outras
    if (isActive) {
      await WelcomeMessage.updateMany(
        { _id: { $ne: id }, isActive: true },
        { isActive: false }
      );
    }

    return await WelcomeMessage.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).exec();
  }

  // Buscar mensagens deletadas (para admin)
  async findDeleted(): Promise<IWelcomeMessage[]> {
    return await WelcomeMessage.find({ 
      deletedAt: { $ne: null } 
    }).sort({ deletedAt: -1 }).exec();
  }
}