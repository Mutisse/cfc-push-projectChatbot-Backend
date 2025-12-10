// src/modules/prayers/controllers/prayerController.ts
import { Request, Response } from "express";
import { PrayerService } from "../services/prayerService";
import {
  CreatePrayerDto,
  UpdatePrayerDto,
  FilterPrayerDto,
} from "../interfaces/prayer.interface";

export class PrayerController {
  private prayerService: PrayerService;

  constructor() {
    this.prayerService = new PrayerService();
  }

  // ==================== HEALTH CHECK ====================

  /**
   * @route GET /prayers/health
   * @desc Health check do módulo de orações
   * @access Public
   */
  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      // Teste básico do serviço
      const stats = await this.prayerService.getPrayerStats();

      res.status(200).json({
        success: true,
        data: {
          module: "prayers",
          status: "healthy",
          timestamp: new Date().toISOString(),
          stats: {
            total: stats.total,
            pending: stats.pending,
            urgent: stats.byUrgency.high,
          },
        },
        message: "Módulo de orações operacional",
      });
    } catch (error: any) {
      console.error("❌ Health check failed:", error.message);

      res.status(500).json({
        success: false,
        data: {
          module: "prayers",
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          error: error.message,
        },
        message: "Módulo de orações com problemas",
      });
    }
  };

  // ==================== ROTAS PÚBLICAS ====================

  /**
   * @route POST /prayers/public/request
   * @desc Criar novo pedido de oração (público)
   * @access Public
   */
  createPrayerRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("📿 Recebendo pedido de oração público");

      const prayerData: CreatePrayerDto = req.body;

      // Log para debug (remover em produção)
      console.log("📥 Dados recebidos:", {
        name: prayerData.name,
        phone: prayerData.phone,
        prayerType: prayerData.prayerType,
        urgency: prayerData.urgency,
      });

      const prayer = await this.prayerService.createPrayerRequest(prayerData);

      console.log(`✅ Pedido criado: ${prayer._id}`);

      res.status(201).json({
        success: true,
        data: prayer,
        message: "Pedido de oração criado com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro no controller (create):", error.message);

      const statusCode =
        error.message.includes("obrigatório") ||
        error.message.includes("deve ter")
          ? 400
          : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || "Erro ao criar pedido de oração",
        data: null,
      });
    }
  };

  /**
   * @route GET /prayers/public/my-prayers/:phone
   * @desc Buscar APENAS os pedidos do usuário por telefone
   * @access Public (apenas os próprios pedidos)
   */
  searchMyPrayersByPhone = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { phone } = req.params;

      if (!phone) {
        res.status(400).json({
          success: false,
          message: "Telefone é obrigatório",
          data: [],
        });
        return;
      }

      console.log(`🔍 Buscando MINHAS orações para telefone: ${phone}`);

      const prayers = await this.prayerService.searchPrayersByPhone(phone);

      // Filtrar para mostrar apenas pedidos não deletados
      const myPrayers = prayers.filter((prayer) => !prayer.deletedAt);

      // Ordenar por data (mais recente primeiro)
      const sortedPrayers = myPrayers.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      res.status(200).json({
        success: true,
        data: sortedPrayers,
        message:
          myPrayers.length > 0
            ? `${myPrayers.length} pedido(s) encontrado(s)`
            : "Nenhum pedido encontrado",
        count: myPrayers.length,
      });
    } catch (error: any) {
      console.error("❌ Erro ao buscar minhas orações:", error.message);

      res.status(400).json({
        success: false,
        message: error.message || "Erro ao buscar seus pedidos",
        data: [],
      });
    }
  };

  /**
   * @route GET /prayers/public/my-prayers/edit/:id
   * @desc Buscar pedido específico para edição (apenas se for do usuário)
   * @access Public (apenas o próprio pedido)
   */
  getMyPrayerForEdit = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { phone } = req.query; // O usuário deve enviar seu telefone para verificar

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID do pedido é obrigatório",
          data: null,
        });
        return;
      }

      if (!phone) {
        res.status(400).json({
          success: false,
          message: "Telefone é obrigatório para verificação",
          data: null,
        });
        return;
      }

      console.log(
        `📄 Buscando MEU pedido para edição: ${id} (telefone: ${phone})`
      );

      const prayer = await this.prayerService.getPrayerById(id);

      if (!prayer) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado",
          data: null,
        });
        return;
      }

      // Verificar se o pedido pertence ao usuário
      const cleanPhone = phone.toString().replace(/\D/g, "");
      const prayerPhone = prayer.phone.replace(/\D/g, "");

      if (!prayerPhone.includes(cleanPhone.slice(-9))) {
        res.status(403).json({
          success: false,
          message: "Você não tem permissão para editar este pedido",
          data: null,
        });
        return;
      }

      // Verificar se o pedido foi deletado
      if (prayer.deletedAt) {
        res.status(410).json({
          success: false,
          message: "Este pedido foi eliminado",
          data: null,
        });
        return;
      }

      // Remove dados sensíveis para edição pública
      const {
        assignedTo,
        deletedAt,
        deletedBy,
        prayerCount,
        lastPrayedAt,
        ...safeData
      } = prayer.toObject();

      res.status(200).json({
        success: true,
        data: safeData,
        message: "Pedido encontrado",
      });
    } catch (error: any) {
      console.error("❌ Erro ao buscar meu pedido para edição:", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao buscar pedido",
        data: null,
      });
    }
  };

  /**
   * @route PUT /prayers/public/my-prayers/:id
   * @desc Atualizar MEU pedido (apenas se for do usuário)
   * @access Public (apenas o próprio pedido)
   */
  updateMyPrayerRequest = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { phone, ...updateData } = req.body; // phone vem no body para verificação

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID do pedido é obrigatório",
          data: null,
        });
        return;
      }

      if (!phone) {
        res.status(400).json({
          success: false,
          message: "Telefone é obrigatório para verificação",
          data: null,
        });
        return;
      }

      console.log(`✏️ Atualizando MEU pedido: ${id} (telefone: ${phone})`);

      // Primeiro, verificar se o pedido pertence ao usuário
      const prayer = await this.prayerService.getPrayerById(id);

      if (!prayer) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado",
          data: null,
        });
        return;
      }

      // Verificar propriedade
      const cleanPhone = phone.toString().replace(/\D/g, "");
      const prayerPhone = prayer.phone.replace(/\D/g, "");

      if (!prayerPhone.includes(cleanPhone.slice(-9))) {
        res.status(403).json({
          success: false,
          message: "Você não tem permissão para atualizar este pedido",
          data: null,
        });
        return;
      }

      // Verificar se está deletado
      if (prayer.deletedAt) {
        res.status(410).json({
          success: false,
          message: "Não é possível atualizar um pedido eliminado",
          data: null,
        });
        return;
      }

      // Restrições para atualização pública
      const restrictedFields = [
        "status",
        "assignedTo",
        "prayerCount",
        "lastPrayedAt",
        "deletedAt",
        "deletedBy",
      ];

      for (const field of restrictedFields) {
        if (updateData[field]) {
          delete updateData[field];
          console.log(`⚠️ Campo restrito removido: ${field}`);
        }
      }

      // Não permitir alterar o telefone (é a chave de identificação)
      if (updateData.phone) {
        delete updateData.phone;
        console.log("⚠️ Telefone não pode ser alterado");
      }

      // Atualizar
      const updatedPrayer = await this.prayerService.updatePrayer(
        id,
        updateData
      );

      if (!updatedPrayer) {
        res.status(404).json({
          success: false,
          message: "Erro ao atualizar pedido",
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedPrayer,
        message: "Seu pedido foi atualizado com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro ao atualizar meu pedido:", error.message);

      res.status(400).json({
        success: false,
        message: error.message || "Erro ao atualizar seu pedido",
        data: null,
      });
    }
  };

  /**
   * @route DELETE /prayers/public/my-prayers/:id
   * @desc Eliminar MEU pedido (soft delete)
   * @access Public (apenas o próprio pedido)
   */
  deleteMyPrayer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { phone } = req.body; // phone vem no body para verificação

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID do pedido é obrigatório",
          data: null,
        });
        return;
      }

      if (!phone) {
        res.status(400).json({
          success: false,
          message: "Telefone é obrigatório para verificação",
          data: null,
        });
        return;
      }

      console.log(`🗑️ Eliminando MEU pedido: ${id} (telefone: ${phone})`);

      // Primeiro, verificar se o pedido pertence ao usuário
      const prayer = await this.prayerService.getPrayerById(id);

      if (!prayer) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado",
          data: null,
        });
        return;
      }

      // Verificar propriedade
      const cleanPhone = phone.toString().replace(/\D/g, "");
      const prayerPhone = prayer.phone.replace(/\D/g, "");

      if (!prayerPhone.includes(cleanPhone.slice(-9))) {
        res.status(403).json({
          success: false,
          message: "Você não tem permissão para eliminar este pedido",
          data: null,
        });
        return;
      }

      // Verificar se já está deletado
      if (prayer.deletedAt) {
        res.status(410).json({
          success: false,
          message: "Este pedido já foi eliminado",
          data: null,
        });
        return;
      }

      // Soft delete (usuário público)
      const deletedPrayer = await this.prayerService.softDeletePrayer(
        id,
        "public"
      );

      if (!deletedPrayer) {
        res.status(404).json({
          success: false,
          message: "Erro ao eliminar pedido",
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: deletedPrayer,
        message: "Seu pedido foi eliminado com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro ao eliminar meu pedido:", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao eliminar pedido",
        data: null,
      });
    }
  };

  // ==================== ROTAS ADMINISTRATIVAS ====================

  /**
   * @route GET /prayers/
   * @desc Listar todos os pedidos (admin)
   * @access Private (Admin)
   */
  getAllPrayers = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        status,
        urgency,
        prayerType,
        search,
        dateFrom,
        dateTo,
        includeDeleted,
        page = "1",
        limit = "20",
        sortBy = "-createdAt",
      } = req.query;

      const filters: FilterPrayerDto = {};

      if (status) filters.status = status as string;
      if (urgency) filters.urgency = urgency as string;
      if (prayerType) filters.prayerType = prayerType as string;
      if (search) filters.search = search as string;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);
      if (includeDeleted === "true") filters.includeDeleted = true;

      console.log(`📋 Listando pedidos (admin) - Filtros:`, filters);

      const result = await this.prayerService.getAllPrayers(
        filters,
        parseInt(page as string),
        parseInt(limit as string),
        sortBy as string
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: parseInt(limit as string),
        },
        message: "Pedidos recuperados com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro ao listar pedidos:", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao listar pedidos",
        data: [],
        pagination: {
          total: 0,
          page: 1,
          totalPages: 0,
          limit: 20,
        },
      });
    }
  };

  /**
   * @route GET /prayers/:id
   * @desc Buscar pedido por ID (admin)
   * @access Private (Admin)
   */
  getPrayerById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID do pedido é obrigatório",
          data: null,
        });
        return;
      }

      console.log(`🔍 Buscando pedido admin: ${id}`);

      const prayer = await this.prayerService.getPrayerById(id);

      if (!prayer) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado",
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: prayer,
        message: "Pedido encontrado",
      });
    } catch (error: any) {
      console.error("❌ Erro ao buscar pedido:", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao buscar pedido",
        data: null,
      });
    }
  };

  /**
   * @route PUT /prayers/:id
   * @desc Atualizar pedido (admin)
   * @access Private (Admin)
   */
  updatePrayer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdatePrayerDto = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID do pedido é obrigatório",
          data: null,
        });
        return;
      }

      console.log(`✏️ Atualizando pedido admin: ${id}`, updateData);

      const updatedPrayer = await this.prayerService.updatePrayer(
        id,
        updateData
      );

      if (!updatedPrayer) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado",
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedPrayer,
        message: "Pedido atualizado com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro na atualização admin:", error.message);

      res.status(400).json({
        success: false,
        message: error.message || "Erro ao atualizar pedido",
        data: null,
      });
    }
  };

  /**
   * @route DELETE /prayers/:id/soft
   * @desc Soft delete (arquivar) pedido (admin)
   * @access Private (Admin)
   */
  softDeletePrayer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { deletedBy } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID do pedido é obrigatório",
          data: null,
        });
        return;
      }

      console.log(`🗑️ Soft delete pedido (admin): ${id}`);

      const deletedPrayer = await this.prayerService.softDeletePrayer(
        id,
        deletedBy
      );

      if (!deletedPrayer) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado",
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: deletedPrayer,
        message: "Pedido arquivado com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro no soft delete (admin):", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao arquivar pedido",
        data: null,
      });
    }
  };

  /**
   * @route PATCH /prayers/:id/restore
   * @desc Restaurar pedido arquivado (SÓ ADMIN)
   * @access Private (Admin)
   */
  restorePrayer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID do pedido é obrigatório",
          data: null,
        });
        return;
      }

      console.log(`♻️ Restaurando pedido: ${id}`);

      const restoredPrayer = await this.prayerService.restorePrayer(id);

      if (!restoredPrayer) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado ou não está arquivado",
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: restoredPrayer,
        message: "Pedido restaurado com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro ao restaurar:", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao restaurar pedido",
        data: null,
      });
    }
  };

  /**
   * @route GET /prayers/deleted
   * @desc Listar pedidos arquivados (admin)
   * @access Private (Admin)
   */
  getDeletedPrayers = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("📦 Listando pedidos arquivados (admin)");

      const deletedPrayers = await this.prayerService.getDeletedPrayers();

      res.status(200).json({
        success: true,
        data: deletedPrayers,
        message: "Pedidos arquivados recuperados com sucesso",
        count: deletedPrayers.length,
      });
    } catch (error: any) {
      console.error("❌ Erro ao listar arquivados:", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao listar pedidos arquivados",
        data: [],
      });
    }
  };

  /**
   * @route DELETE /prayers/:id/hard
   * @desc Hard delete (excluir permanentemente) - SÓ ADMIN
   * @access Private (Admin)
   */
  hardDeletePrayer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID do pedido é obrigatório",
          data: null,
        });
        return;
      }

      console.log(`💀 Hard delete pedido: ${id}`);

      const deleted = await this.prayerService.hardDeletePrayer(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado",
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: null,
        message: "Pedido excluído permanentemente com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro no hard delete:", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao excluir pedido",
        data: null,
      });
    }
  };

  /**
   * @route POST /prayers/hard/bulk
   * @desc Hard delete múltiplos pedidos - SÓ ADMIN
   * @access Private (Admin)
   */
  hardDeleteMany = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: "IDs são obrigatórios e devem ser um array",
          data: null,
        });
        return;
      }

      console.log(`💀 Hard delete múltiplos: ${ids.length} pedidos`);

      const deletedCount = await this.prayerService.hardDeleteMany(ids);

      res.status(200).json({
        success: true,
        data: { deletedCount },
        message: `${deletedCount} pedido(s) excluído(s) permanentemente`,
      });
    } catch (error: any) {
      console.error("❌ Erro no bulk delete:", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao excluir pedidos",
        data: null,
      });
    }
  };

  // ==================== OPERAÇÕES ESPECIAIS (ADMIN) ====================

  /**
   * @route PATCH /prayers/:id/prayed
   * @desc Marcar como orado - SÓ ADMIN/INTERCESSOR
   * @access Private (Admin/Intercessor)
   */
  markAsPrayed = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { prayerCount = 1 } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: "ID do pedido é obrigatório",
          data: null,
        });
        return;
      }

      console.log(`🙏 Marcando como orado: ${id} (count: ${prayerCount})`);

      const prayer = await this.prayerService.markAsPrayed(id, prayerCount);

      if (!prayer) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado",
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: prayer,
        message: "Pedido marcado como orado com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro ao marcar como orado:", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao processar pedido",
        data: null,
      });
    }
  };

  /**
   * @route PATCH /prayers/:id/status
   * @desc Atualizar status do pedido - SÓ ADMIN
   * @access Private (Admin)
   */
  updatePrayerStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!id || !status) {
        res.status(400).json({
          success: false,
          message: "ID e status são obrigatórios",
          data: null,
        });
        return;
      }

      console.log(`🔄 Atualizando status: ${id} → ${status}`);

      const prayer = await this.prayerService.updatePrayerStatus(
        id,
        status,
        notes
      );

      if (!prayer) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado",
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: prayer,
        message: "Status atualizado com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro ao atualizar status:", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao atualizar status",
        data: null,
      });
    }
  };

  /**
   * @route PATCH /prayers/:id/assign
   * @desc Atribuir pedido a um intercessor - SÓ ADMIN
   * @access Private (Admin)
   */
  assignPrayer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!id || !userId) {
        res.status(400).json({
          success: false,
          message: "ID do pedido e do usuário são obrigatórios",
          data: null,
        });
        return;
      }

      console.log(`👤 Atribuindo pedido ${id} para usuário ${userId}`);

      const prayer = await this.prayerService.assignPrayer(id, userId);

      if (!prayer) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado",
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: prayer,
        message: "Pedido atribuído com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro ao atribuir:", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao atribuir pedido",
        data: null,
      });
    }
  };

  // ==================== ESTATÍSTICAS E RELATÓRIOS (ADMIN) ====================

  /**
   * @route GET /prayers/stats
   * @desc Obter estatísticas dos pedidos - SÓ ADMIN
   * @access Private (Admin)
   */
  getPrayerStats = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("📊 Gerando estatísticas de orações");

      const stats = await this.prayerService.getPrayerStats();

      res.status(200).json({
        success: true,
        data: stats,
        message: "Estatísticas recuperadas com sucesso",
      });
    } catch (error: any) {
      console.error("❌ Erro nas estatísticas:", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao gerar estatísticas",
        data: null,
      });
    }
  };

  /**
   * @route GET /prayers/urgent-pending
   * @desc Obter pedidos urgentes pendentes - SÓ ADMIN/INTERCESSOR
   * @access Private (Admin/Intercessor)
   */
  getUrgentPendingPrayers = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      console.log("⚠️ Buscando pedidos urgentes pendentes");

      const urgentPrayers = await this.prayerService.getUrgentPendingPrayers();

      res.status(200).json({
        success: true,
        data: urgentPrayers,
        message:
          urgentPrayers.length > 0
            ? `${urgentPrayers.length} pedido(s) urgente(s) pendente(s)`
            : "Nenhum pedido urgente pendente",
        count: urgentPrayers.length,
      });
    } catch (error: any) {
      console.error("❌ Erro ao buscar urgentes:", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao buscar pedidos urgentes",
        data: [],
      });
    }
  };

  /**
   * @route GET /prayers/recent/:days?
   * @desc Obter pedidos recentes - SÓ ADMIN
   * @access Private (Admin)
   */
  getRecentPrayers = async (req: Request, res: Response): Promise<void> => {
    try {
      const days = req.params.days ? parseInt(req.params.days) : 7;

      if (days < 1 || days > 365) {
        res.status(400).json({
          success: false,
          message: "Período deve ser entre 1 e 365 dias",
          data: [],
        });
        return;
      }

      console.log(`📅 Buscando pedidos recentes (últimos ${days} dias)`);

      const recentPrayers = await this.prayerService.getRecentPrayers(days);

      res.status(200).json({
        success: true,
        data: recentPrayers,
        message: `${recentPrayers.length} pedido(s) nos últimos ${days} dias`,
        count: recentPrayers.length,
        days,
      });
    } catch (error: any) {
      console.error("❌ Erro ao buscar recentes:", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao buscar pedidos recentes",
        data: [],
      });
    }
  };

  /**
   * @route GET /prayers/summary
   * @desc Obter resumo dos pedidos - SÓ ADMIN
   * @access Private (Admin)
   */
  getPrayerSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("📋 Gerando resumo de pedidos");

      const summary = await this.prayerService.getPrayerSummary();

      res.status(200).json({
        success: true,
        data: summary,
        message: "Resumo recuperado com sucesso",
        count: summary.length,
      });
    } catch (error: any) {
      console.error("❌ Erro no resumo:", error.message);

      res.status(500).json({
        success: false,
        message: "Erro interno ao gerar resumo",
        data: [],
      });
    }
  };
}
