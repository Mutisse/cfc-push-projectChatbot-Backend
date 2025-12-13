import { PrayerRepository } from "../repositories/prayerRepository";
import { IPrayer } from "../interfaces/prayer.interface";

export class PrayerService {
  private prayerRepository: PrayerRepository;

  constructor() {
    this.prayerRepository = new PrayerRepository();
    console.log("✅ SERVICE: PrayerService inicializado");
  }

  // ==================== CRUD BÁSICO ====================

  async getAllPrayers(): Promise<IPrayer[]> {
    console.log("📋 SERVICE: Buscando todos os pedidos");
    return await this.prayerRepository.findAll();
  }

  async getPrayerById(id: string): Promise<IPrayer | null> {
    console.log(`🔍 SERVICE: Buscando pedido por ID: ${id}`);
    if (!id) throw new Error("ID do pedido é obrigatório");
    return await this.prayerRepository.findById(id);
  }

  async createPrayerRequest(data: any): Promise<IPrayer> {
    console.log("➕ SERVICE: Criando novo pedido");

    // Validações básicas
    if (!data.name?.trim()) throw new Error("Nome é obrigatório");
    if (!data.phone?.trim()) throw new Error("Telefone é obrigatório");
    if (!data.prayerType) throw new Error("Tipo de oração é obrigatório");
    if (!data.description?.trim() || data.description.length < 10) {
      throw new Error("Descrição deve ter pelo menos 10 caracteres");
    }

    // Garantir campos padrão
    const prayerData = {
      ...data,
      status: data.status || "pending",
      urgency: data.urgency || "medium",
      contactPreference: data.contactPreference || "whatsapp",
      createdBy: "public",
    };

    return await this.prayerRepository.create(prayerData);
  }

  async updatePrayer(id: string, data: any): Promise<IPrayer | null> {
    console.log(`✏️ SERVICE: Atualizando pedido: ${id}`);
    if (!id) throw new Error("ID do pedido é obrigatório");
    return await this.prayerRepository.update(id, data);
  }

  // ==================== SOFT DELETE ====================

  async softDeletePrayer(
    id: string,
    deletedBy?: string
  ): Promise<IPrayer | null> {
    console.log(`🗑️ SERVICE: Arquivando pedido: ${id}`);
    if (!id) throw new Error("ID do pedido é obrigatório");
    return await this.prayerRepository.softDelete(id, deletedBy);
  }

  async restorePrayer(id: string): Promise<IPrayer | null> {
    console.log(`♻️ SERVICE: Restaurando pedido: ${id}`);
    if (!id) throw new Error("ID do pedido é obrigatório");
    return await this.prayerRepository.restore(id);
  }
  async getDeletedPrayers(): Promise<IPrayer[]> {
    console.log("📋 SERVICE: Buscando pedidos deletados");
    return await this.prayerRepository.findDeleted();
  }
  // ==================== HARD DELETE ====================

  async hardDeletePrayer(id: string): Promise<boolean> {
    console.log(`💥 SERVICE: Excluindo permanentemente pedido: ${id}`);
    if (!id) throw new Error("ID do pedido é obrigatório");
    return await this.prayerRepository.hardDelete(id);
  }

  async hardDeleteMany(ids: string[]): Promise<number> {
    console.log(`💥 SERVICE: Processando exclusão de ${ids.length} pedido(s)`);

    // Array vazio é permitido - retorna 0
    if (!ids || ids.length === 0) {
      return 0;
    }

    return await this.prayerRepository.hardDeleteMany(ids);
  }
  // ==================== OPERAÇÕES ESPECIAIS ====================

  async updatePrayerStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<IPrayer | null> {
    console.log(
      `🔄 SERVICE: Atualizando status do pedido ${id} para ${status}`
    );

    if (!id) throw new Error("ID do pedido é obrigatório");

    const validStatuses = ["pending", "in_prayer", "completed", "archived"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Status inválido. Use: ${validStatuses.join(", ")}`);
    }

    return await this.prayerRepository.updateStatus(id, status, notes);
  }

  async markAsPrayed(
    id: string,
    prayerCount: number = 1
  ): Promise<IPrayer | null> {
    console.log(`🙏 SERVICE: Marcando pedido ${id} como orado`);
    if (!id) throw new Error("ID do pedido é obrigatório");
    return await this.prayerRepository.markAsPrayed(id, prayerCount);
  }

  async assignPrayer(id: string, userId: string): Promise<IPrayer | null> {
    console.log(`👤 SERVICE: Atribuindo pedido ${id} ao usuário ${userId}`);
    if (!id) throw new Error("ID do pedido é obrigatório");
    if (!userId) throw new Error("ID do usuário é obrigatório");

    return await this.prayerRepository.assignTo(id, userId);
  }

  // ==================== ESTATÍSTICAS ====================

  async getPrayerStats(): Promise<any> {
    console.log("📊 SERVICE: Buscando estatísticas");
    try {
      const stats = await this.prayerRepository.getStats();
      console.log(`✅ SERVICE: Estatísticas obtidas - Total: ${stats.total}`);
      return stats;
    } catch (error: any) {
      console.error("❌ SERVICE: Erro ao buscar estatísticas:", error.message);
      throw error; // Propaga o erro para o controller
    }
  }

  async getUrgentPendingPrayers(): Promise<IPrayer[]> {
    console.log("⚠️ SERVICE: Buscando urgentes pendentes");
    return await this.prayerRepository.getUrgentPending();
  }

  // ==================== PÚBLICO ====================

  async searchMyPrayersByPhone(phone: string): Promise<IPrayer[]> {
    console.log(`📱 SERVICE: Buscando pedidos do telefone: ${phone}`);
    if (!phone?.trim()) throw new Error("Telefone é obrigatório");
    return await this.prayerRepository.findByPhone(phone);
  }

  async getPrayerForEdit(id: string, phone: string): Promise<IPrayer | null> {
    console.log(
      `✏️ SERVICE: Buscando pedido ${id} para edição (telefone: ${phone})`
    );

    if (!id) throw new Error("ID é obrigatório");
    if (!phone) throw new Error("Telefone é obrigatório");

    // 1. Verificar se o telefone é dono do pedido (mesmo se deletado)
    const isOwner = await this.prayerRepository.isPhoneOwner(id, phone);
    console.log(`📱 Resultado isPhoneOwner: ${isOwner}`);

    if (!isOwner) {
      throw new Error("Você não tem permissão para editar este pedido");
    }

    // 2. Buscar o pedido (APENAS se não estiver deletado!)
    const prayer = await this.prayerRepository.findById(id);
    console.log(`📄 Pedido encontrado (não deletado): ${!!prayer}`);

    if (!prayer) {
      // Verificar se foi deletado
      const deletedPrayer = await this.prayerRepository.findDeletedById(id);
      if (deletedPrayer) {
        throw new Error("Este pedido foi arquivado e não pode ser editado");
      }
      throw new Error("Pedido não encontrado");
    }

    return prayer;
  }

  async updateMyPrayerRequest(
    id: string,
    data: any,
    phone: string
  ): Promise<IPrayer | null> {
    console.log(`✏️ SERVICE: Atualizando pedido ${id} (telefone: ${phone})`);

    if (!id) throw new Error("ID é obrigatório");
    if (!phone) throw new Error("Telefone é obrigatório");

    // Verificar se o telefone é dono do pedido
    const isOwner = await this.prayerRepository.isPhoneOwner(id, phone);
    if (!isOwner)
      throw new Error("Você não tem permissão para atualizar este pedido");

    // Remover campos restritos
    const restrictedFields = [
      "status",
      "assignedTo",
      "prayerCount",
      "lastPrayedAt",
      "phone",
    ];
    const safeData = { ...data };
    restrictedFields.forEach((field) => {
      delete safeData[field];
    });

    return await this.prayerRepository.update(id, safeData);
  }

  async deleteMyPrayer(id: string, phone: string): Promise<IPrayer | null> {
    console.log(`🗑️ SERVICE: deleteMyPrayer - ID: ${id}, Phone: ${phone}`);

    if (!id) throw new Error("ID é obrigatório");
    if (!phone) throw new Error("Telefone é obrigatório");

    // Verificar se o telefone é dono do pedido
    const isOwner = await this.prayerRepository.isPhoneOwner(id, phone);
    console.log(`📱 É dono? ${isOwner}`);

    if (!isOwner)
      throw new Error("Você não tem permissão para eliminar este pedido");

    // 🔥 CORREÇÃO: Passar "public" como string, NÃO como undefined
    return await this.prayerRepository.softDelete(id, "public");
  }
}
