// src/modules/prayers/services/prayerService.ts
import { PrayerRepository } from "../repositories/prayerRepository";
import {
  IPrayer,
  CreatePrayerDto,
  UpdatePrayerDto,
  FilterPrayerDto,
  PrayerStats,
} from "../interfaces/prayer.interface";

export class PrayerService {
  private prayerRepository: PrayerRepository;

  constructor() {
    this.prayerRepository = new PrayerRepository();
  }

  // ==================== VALIDAÇÃO ====================

  private validatePhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length < 9) {
      throw new Error("Telefone deve ter pelo menos 9 dígitos");
    }

    // Adiciona prefixo de Moçambique se necessário
    if (!cleanPhone.startsWith("258") && cleanPhone.length >= 9) {
      return `258${cleanPhone.slice(-9)}`;
    }

    return cleanPhone;
  }

  private validatePrayerData(data: CreatePrayerDto): CreatePrayerDto {
    // Validações básicas
    if (!data.name?.trim()) {
      throw new Error("Nome é obrigatório");
    }

    if (!data.phone?.trim()) {
      throw new Error("Telefone é obrigatório");
    }

    if (!data.prayerType) {
      throw new Error("Tipo de oração é obrigatório");
    }

    if (!data.description?.trim() || data.description.length < 10) {
      throw new Error("Descrição deve ter pelo menos 10 caracteres");
    }

    // Formata telefone
    const formattedData = {
      ...data,
      phone: this.validatePhone(data.phone),
      name: data.name.trim(),
      description: data.description.trim(),
      email: data.email?.trim(),
      urgency: data.urgency || "medium",
      contactPreference: data.contactPreference || "whatsapp",
    };

    return formattedData;
  }

  // ==================== CRUD PÚBLICO ====================

  async createPrayerRequest(data: CreatePrayerDto): Promise<IPrayer> {
    try {
      console.log("📿 Criando pedido de oração:", data.name);

      // Valida e formata dados
      const validatedData = this.validatePrayerData(data);

      // Verifica se já existe pedido recente com o mesmo telefone
      const recentPrayers = await this.prayerRepository.findByPhoneActiveOnly(
        validatedData.phone
      );
      if (recentPrayers.length > 0) {
        console.log(
          `⚠️ Encontrado ${recentPrayers.length} pedidos anteriores para este telefone`
        );
      }

      // Cria o pedido
      const prayer = await this.prayerRepository.create(validatedData);

      console.log("✅ Pedido criado com sucesso:", prayer._id);
      return prayer;
    } catch (error: any) {
      console.error("❌ Erro ao criar pedido de oração:", error.message);
      throw error;
    }
  }

  async searchPrayersByPhone(phone: string): Promise<IPrayer[]> {
    if (!phone?.trim()) {
      throw new Error("Telefone é obrigatório para busca");
    }

    const cleanPhone = this.validatePhone(phone);
    return await this.prayerRepository.findByPhone(cleanPhone);
  }

  async searchMyPrayersByPhone(phone: string): Promise<IPrayer[]> {
    if (!phone?.trim()) {
      throw new Error("Telefone é obrigatório para busca");
    }

    const cleanPhone = this.validatePhone(phone);
    return await this.prayerRepository.findByPhoneActiveOnly(cleanPhone);
  }

  async getPrayerForEdit(id: string, phone: string): Promise<IPrayer | null> {
    if (!id) throw new Error("ID é obrigatório");
    if (!phone) throw new Error("Telefone é obrigatório");

    // Verifica se o pedido pertence ao telefone
    const isOwner = await this.prayerRepository.isPhoneOwner(id, phone);
    if (!isOwner) {
      throw new Error("Você não tem permissão para editar este pedido");
    }

    const prayer = await this.prayerRepository.getActivePrayerById(id);
    if (!prayer) {
      throw new Error("Pedido não encontrado ou foi eliminado");
    }

    return prayer;
  }

  async updateMyPrayerRequest(
    id: string,
    data: UpdatePrayerDto,
    phone: string
  ): Promise<IPrayer | null> {
    if (!id) throw new Error("ID é obrigatório");
    if (!phone) throw new Error("Telefone é obrigatório");

    // Verifica se o pedido pertence ao telefone
    const isOwner = await this.prayerRepository.isPhoneOwner(id, phone);
    if (!isOwner) {
      throw new Error("Você não tem permissão para atualizar este pedido");
    }

    // Verifica se o pedido está ativo
    const prayer = await this.prayerRepository.getActivePrayerById(id);
    if (!prayer) {
      throw new Error("Pedido não encontrado ou foi eliminado");
    }

    // Remove campos restritos
    const restrictedFields = [
      "status",
      "assignedTo",
      "prayerCount",
      "lastPrayedAt",
      "deletedAt",
      "deletedBy",
      "phone",
    ];
    restrictedFields.forEach((field) => {
      delete data[field as keyof UpdatePrayerDto];
    });

    return await this.prayerRepository.updateActive(id, data);
  }

  async deleteMyPrayer(id: string, phone: string): Promise<IPrayer | null> {
    if (!id) throw new Error("ID é obrigatório");
    if (!phone) throw new Error("Telefone é obrigatório");

    // Verifica se o pedido pertence ao telefone
    const isOwner = await this.prayerRepository.isPhoneOwner(id, phone);
    if (!isOwner) {
      throw new Error("Você não tem permissão para eliminar este pedido");
    }

    // Verifica se o pedido já está deletado
    const prayer = await this.prayerRepository.getActivePrayerById(id);
    if (!prayer) {
      throw new Error("Pedido não encontrado ou já foi eliminado");
    }

    return await this.prayerRepository.softDelete(id, "public");
  }

  // ==================== CRUD ADMINISTRATIVO ====================

  async getAllPrayers(
    filters: FilterPrayerDto = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = "-createdAt"
  ) {
    return await this.prayerRepository.findAll(filters, page, limit, sortBy);
  }

  async getPrayerById(id: string): Promise<IPrayer | null> {
    if (!id) throw new Error("ID é obrigatório");
    return await this.prayerRepository.findById(id); // Admin pode ver deletados
  }

  async updatePrayer(
    id: string,
    data: UpdatePrayerDto
  ): Promise<IPrayer | null> {
    if (!id) throw new Error("ID é obrigatório");

    // Validações administrativas
    if (data.status === "completed" && !data.lastPrayedAt) {
      data.lastPrayedAt = new Date();
    }

    return await this.prayerRepository.update(id, data); // Admin pode atualizar deletados
  }

  // ==================== SOFT DELETE ====================

  async softDeletePrayer(
    id: string,
    deletedBy?: string
  ): Promise<IPrayer | null> {
    if (!id) throw new Error("ID é obrigatório");
    return await this.prayerRepository.softDelete(id, deletedBy);
  }

  async restorePrayer(id: string): Promise<IPrayer | null> {
    if (!id) throw new Error("ID é obrigatório");
    return await this.prayerRepository.restore(id);
  }

  async getDeletedPrayers(): Promise<IPrayer[]> {
    return await this.prayerRepository
      .findAll({ includeDeleted: true }, 1, 1000)
      .then((r) => r.data);
  }

  // ==================== HARD DELETE ====================

  async hardDeletePrayer(id: string): Promise<boolean> {
    if (!id) throw new Error("ID é obrigatório");
    return await this.prayerRepository.hardDelete(id);
  }

  async hardDeleteMany(ids: string[]): Promise<number> {
    if (!ids || ids.length === 0) {
      throw new Error("IDs são obrigatórios");
    }

    return await this.prayerRepository.hardDeleteMany(ids);
  }

  // ==================== OPERAÇÕES ESPECIAIS ====================

  async markAsPrayed(
    id: string,
    prayerCount: number = 1
  ): Promise<IPrayer | null> {
    if (!id) throw new Error("ID é obrigatório");
    return await this.prayerRepository.markAsPrayed(id, prayerCount);
  }

  async updatePrayerStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<IPrayer | null> {
    if (!id) throw new Error("ID é obrigatório");
    if (!status) throw new Error("Status é obrigatório");

    return await this.prayerRepository.updateStatus(id, status, notes);
  }

  async assignPrayer(id: string, userId: string): Promise<IPrayer | null> {
    if (!id) throw new Error("ID do pedido é obrigatório");
    if (!userId) throw new Error("ID do usuário é obrigatório");

    return await this.prayerRepository.assignTo(id, userId);
  }

  // ==================== ESTATÍSTICAS ====================

  async getPrayerStats(): Promise<PrayerStats> {
    return await this.prayerRepository.getStats();
  }

  async getUrgentPendingPrayers(): Promise<IPrayer[]> {
    return await this.prayerRepository.getUrgentPending();
  }

  async getRecentPrayers(days: number = 7): Promise<IPrayer[]> {
    if (days < 1 || days > 365) {
      throw new Error("Período deve ser entre 1 e 365 dias");
    }

    return await this.prayerRepository.getRecent(days);
  }

  async getPrayerSummary(): Promise<any[]> {
    return await this.prayerRepository.getSummary();
  }

  // ==================== UTILITÁRIOS ====================

  async isPhoneRegistered(phone: string): Promise<boolean> {
    const cleanPhone = this.validatePhone(phone);
    const prayers = await this.prayerRepository.findByPhone(cleanPhone);
    return prayers.length > 0;
  }

  async getPrayerHistory(phone: string): Promise<IPrayer[]> {
    const cleanPhone = this.validatePhone(phone);
    return await this.prayerRepository.findByPhone(cleanPhone);
  }

  // ==================== NOVOS MÉTODOS PARA CONTROLLER ====================

  async verifyPrayerOwnership(id: string, phone: string): Promise<boolean> {
    return await this.prayerRepository.isPhoneOwner(id, phone);
  }

  async getActivePrayer(id: string): Promise<IPrayer | null> {
    return await this.prayerRepository.getActivePrayerById(id);
  }
}
