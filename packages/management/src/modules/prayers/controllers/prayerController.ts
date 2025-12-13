import { Request, Response } from "express";
import { PrayerService } from "../services/prayerService";

export class PrayerController {
  private prayerService: PrayerService;

  constructor() {
    this.prayerService = new PrayerService();
    console.log("🎯 CONTROLLER: PrayerController inicializado!");
  }

  // ==================== HEALTH CHECK ====================

  healthCheck = async (req: Request, res: Response): Promise<void> => {
    console.log("🏥 CONTROLLER: Health check chamado");
    try {
      res.status(200).json({
        success: true,
        module: "prayers",
        status: "healthy",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro interno do servidor",
      });
    }
  };

  // ==================== ROTAS PÚBLICAS ====================

  createPrayerRequest = async (req: Request, res: Response): Promise<void> => {
    console.log("➕ CONTROLLER: Criando pedido público");
    try {
      const prayer = await this.prayerService.createPrayerRequest(req.body);
      res.status(201).json({
        success: true,
        data: prayer,
        message: "Pedido criado com sucesso",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao criar pedido",
      });
    }
  };

  searchMyPrayersByPhone = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    console.log(
      `📱 CONTROLLER: Buscando pedidos do telefone: ${req.params.phone}`
    );
    try {
      const { phone } = req.params;
      const prayers = await this.prayerService.searchMyPrayersByPhone(phone);
      res.status(200).json({
        success: true,
        data: prayers,
        message: `${prayers.length} pedido(s) encontrado(s)`,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao buscar pedidos",
      });
    }
  };

  getMyPrayerForEdit = async (req: Request, res: Response): Promise<void> => {
    console.log(`✏️ CONTROLLER: Buscando pedido para edição: ${req.params.id}`);
    try {
      const { id } = req.params;
      const { phone } = req.query;

      if (!phone) {
        res.status(400).json({
          success: false,
          message: "Telefone é obrigatório (use ?phone=258845123456)",
          data: null,
        });
        return;
      }

      const prayer = await this.prayerService.getPrayerForEdit(
        id,
        phone as string
      );

      res.status(200).json({
        success: true,
        data: prayer,
        message: "Pedido encontrado",
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Pedido não encontrado",
        data: null,
      });
    }
  };

  updateMyPrayerRequest = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    console.log(`✏️ CONTROLLER: Atualizando pedido: ${req.params.id}`);
    try {
      const { id } = req.params;
      const { phone, ...data } = req.body;

      if (!phone) {
        res.status(400).json({
          success: false,
          message: "Telefone é obrigatório no corpo da requisição",
          data: null,
        });
        return;
      }

      const prayer = await this.prayerService.updateMyPrayerRequest(
        id,
        data,
        phone
      );

      res.status(200).json({
        success: true,
        data: prayer,
        message: "Pedido atualizado",
      });
    } catch (error) {
      const status =
        error instanceof Error && error.message.includes("permissão")
          ? 403
          : 404;
      res.status(status).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao atualizar pedido",
        data: null,
      });
    }
  };

  deleteMyPrayer = async (req: Request, res: Response): Promise<void> => {
    console.log(`\n🎯 ========== DELETE PÚBLICO INICIADO ==========`);

    try {
      // ⚠️ AGORA AMBOS VÊM DE PARAMS!
      const { id, phone } = req.params; // ❗ MUDOU: phone vem de params, não query!

      console.log(
        `🗑️ CONTROLLER: Eliminando pedido ID: ${id}, Phone: ${phone}`
      );
      console.log(`📱 URL COMPLETA: ${req.method} ${req.url}`);
      console.log(`🔍 req.params:`, req.params);

      if (!phone) {
        res.status(400).json({
          success: false,
          message:
            "Telefone é obrigatório. Use: /public/my-prayers/ID/TELEFONE",
          data: null,
        });
        return;
      }

      console.log(`🔍 Chamando service.deleteMyPrayer(${id}, ${phone})...`);

      const prayer = await this.prayerService.deleteMyPrayer(id, phone);

      console.log(`✅ Service retornou: ${prayer ? "SUCESSO" : "FALHA"}`);
      res.status(200).json({
        success: true,
        data: prayer,
        message: "Pedido eliminado",
      });
    } catch (error) {
      console.error(`💥 ERRO NO CONTROLLER:`, error);
      const status =
        error instanceof Error && error.message.includes("permissão")
          ? 403
          : 404;
      res.status(status).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao eliminar pedido",
        data: null,
      });
    }

    console.log(`🎯 ========== DELETE PÚBLICO FINALIZADO ==========\n`);
  };

  // ==================== CRUD ADMIN ====================

  getAllPrayers = async (req: Request, res: Response): Promise<void> => {
    console.log("📋 CONTROLLER: Buscando todos os pedidos");
    try {
      const prayers = await this.prayerService.getAllPrayers();
      res.status(200).json({
        success: true,
        data: prayers,
        message: "Pedidos recuperados com sucesso",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro interno do servidor",
      });
    }
  };

  getPrayerById = async (req: Request, res: Response): Promise<void> => {
    console.log(`🔍 CONTROLLER: Buscando pedido por ID: ${req.params.id}`);
    try {
      const { id } = req.params;
      const prayer = await this.prayerService.getPrayerById(id);

      if (!prayer) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: prayer,
        message: "Pedido recuperado com sucesso",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro interno do servidor",
      });
    }
  };

  updatePrayer = async (req: Request, res: Response): Promise<void> => {
    console.log(`✏️ CONTROLLER: Atualizando pedido admin: ${req.params.id}`);
    try {
      const { id } = req.params;
      const prayer = await this.prayerService.updatePrayer(id, req.body);

      if (!prayer) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: prayer,
        message: "Pedido atualizado com sucesso",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao atualizar pedido",
      });
    }
  };

  // ==================== SOFT DELETE ====================

  softDeletePrayer = async (req: Request, res: Response): Promise<void> => {
    console.log(`🗑️ CONTROLLER: Arquivando pedido: ${req.params.id}`);

    try {
      const { id } = req.params;
      const { deletedBy } = req.body;

      console.log(`📋 Dados recebidos - ID: ${id}, deletedBy: ${deletedBy}`); // ✅ LOG

      if (!id || id.length < 12) {
        res.status(400).json({
          success: false,
          message: "ID inválido",
        });
        return;
      }

      const prayer = await this.prayerService.softDeletePrayer(id, deletedBy);

      if (!prayer) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado ou já foi arquivado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: prayer,
        message: "Pedido arquivado com sucesso",
      });
    } catch (error) {
      console.error("❌ CONTROLLER: Erro em softDeletePrayer:", error); // ✅ LOG
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao arquivar pedido",
      });
    }
  };

  restorePrayer = async (req: Request, res: Response): Promise<void> => {
    console.log(`♻️ CONTROLLER: Restaurando pedido: ${req.params.id}`);
    try {
      const { id } = req.params;
      const prayer = await this.prayerService.restorePrayer(id);

      if (!prayer) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: prayer,
        message: "Pedido restaurado com sucesso",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao restaurar pedido",
      });
    }
  };

  getDeletedPrayers = async (req: Request, res: Response): Promise<void> => {
    console.log("📋 CONTROLLER: Buscando pedidos deletados (arquivados)");

    try {
      const prayers = await this.prayerService.getDeletedPrayers();

      console.log(
        `✅ CONTROLLER: Encontrados ${prayers.length} pedidos arquivados`
      );

      res.status(200).json({
        success: true,
        data: prayers,
        message:
          prayers.length > 0
            ? `${prayers.length} pedido(s) arquivado(s) encontrado(s)`
            : "Nenhum pedido arquivado no momento",
      });
    } catch (error: any) {
      console.error("❌ CONTROLLER: Erro em getDeletedPrayers:", error.message);

      res.status(200).json({
        success: true,
        data: [],
        message: "Nenhum pedido arquivado disponível",
      });
    }
  };
  // ==================== HARD DELETE ====================

  hardDeletePrayer = async (req: Request, res: Response): Promise<void> => {
    console.log(
      `💥 CONTROLLER: Excluindo permanentemente pedido: ${req.params.id}`
    );
    try {
      const { id } = req.params;
      const deleted = await this.prayerService.hardDeletePrayer(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Pedido não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Pedido excluído permanentemente",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao excluir pedido",
      });
    }
  };
hardDeleteMany = async (req: Request, res: Response): Promise<void> => {
  console.log("💥 CONTROLLER: Excluindo múltiplos pedidos");
  console.log("📦 IDs recebidos:", req.body.ids);
  
  try {
    const { ids } = req.body;

    // ✅ Validação melhorada com mensagens mais claras
    if (!ids) {
      res.status(400).json({
        success: false,
        message: "O campo 'ids' é obrigatório no corpo da requisição",
        data: null,
      });
      return;
    }

    if (!Array.isArray(ids)) {
      res.status(400).json({
        success: false,
        message: "O campo 'ids' deve ser um array de strings",
        data: null,
      });
      return;
    }

    // ✅ Array vazio não é erro - retorna sucesso com count 0
    if (ids.length === 0) {
      console.log("📭 Array vazio recebido - retornando sucesso");
      res.status(200).json({
        success: true,
        data: { deletedCount: 0 },
        message: "Nenhum ID fornecido para exclusão",
      });
      return;
    }

    console.log(`🔍 Validando ${ids.length} IDs...`);
    
    // Validação adicional: verificar se há IDs não-string
    const invalidTypes = ids.filter(id => typeof id !== 'string');
    if (invalidTypes.length > 0) {
      res.status(400).json({
        success: false,
        message: `IDs devem ser strings. ${invalidTypes.length} item(s) inválido(s)`,
        data: null,
      });
      return;
    }

    const count = await this.prayerService.hardDeleteMany(ids);

    console.log(`✅ ${count} pedido(s) excluído(s)`);
    
    res.status(200).json({
      success: true,
      data: { deletedCount: count },
      message: count > 0 
        ? `${count} pedido(s) excluído(s) permanentemente`
        : "Nenhum pedido excluído (IDs inválidos ou pedidos já removidos)",
    });
    
  } catch (error: any) {
    console.error("❌ CONTROLLER: Erro em hardDeleteMany:", error.message);
    
    res.status(400).json({
      success: false,
      message: `Erro ao excluir pedidos: ${error.message}`,
      data: null,
    });
  }
};

  // ==================== OPERAÇÕES ESPECIAIS ====================

  updatePrayerStatus = async (req: Request, res: Response): Promise<void> => {
    console.log(
      `🔄 CONTROLLER: Atualizando status do pedido: ${req.params.id}`
    );
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          message: "Status é obrigatório",
          data: null,
        });
        return;
      }

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
        message: "Status atualizado",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        data: null,
      });
    }
  };

  markAsPrayed = async (req: Request, res: Response): Promise<void> => {
    console.log(`🙏 CONTROLLER: Marcando pedido como orado: ${req.params.id}`);
    try {
      const { id } = req.params;
      const { prayerCount = 1 } = req.body;

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
        message: "Pedido marcado como orado",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        data: null,
      });
    }
  };

  assignPrayer = async (req: Request, res: Response): Promise<void> => {
    console.log(`👤 CONTROLLER: Atribuindo pedido: ${req.params.id}`);
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: "ID do usuário é obrigatório",
          data: null,
        });
        return;
      }

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
        message: "Pedido atribuído",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        data: null,
      });
    }
  };

  // ==================== ESTATÍSTICAS ====================

  getPrayerStats = async (req: Request, res: Response): Promise<void> => {
    console.log("📊 CONTROLLER: Buscando estatísticas");
    try {
      const stats = await this.prayerService.getPrayerStats();

      res.status(200).json({
        success: true,
        data: stats,
        message: "Estatísticas recuperadas com sucesso",
      });
    } catch (error: any) {
      console.error("❌ CONTROLLER: Erro em getPrayerStats:", error.message);

      res.status(500).json({
        success: false,
        message: `Erro ao buscar estatísticas: ${error.message}`,
        data: null,
      });
    }
  };

  getUrgentPendingPrayers = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    console.log("⚠️ CONTROLLER: Buscando urgentes pendentes");
    try {
      const prayers = await this.prayerService.getUrgentPendingPrayers();
      res.status(200).json({
        success: true,
        data: prayers,
        message: `${prayers.length} pedido(s) urgente(s)`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        data: [],
        message: "Erro ao buscar pedidos urgentes",
      });
    }
  };

  getRecentPrayers = async (req: Request, res: Response): Promise<void> => {
    console.log("📅 CONTROLLER: Buscando pedidos recentes");
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

      // Implemente conforme necessário
      const prayers = await this.prayerService.getAllPrayers();
      const recent = prayers.slice(0, Math.min(prayers.length, 20));

      res.status(200).json({
        success: true,
        data: recent,
        message: `${recent.length} pedido(s) recente(s)`,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        data: [],
        message: "Erro ao buscar pedidos recentes",
      });
    }
  };

  getPrayerSummary = async (req: Request, res: Response): Promise<void> => {
    console.log("📋 CONTROLLER: Buscando resumo");
    try {
      const prayers = await this.prayerService.getAllPrayers();

      const summary = prayers.map((prayer) => ({
        id: prayer._id,
        name: prayer.name,
        phone: prayer.phone,
        prayerType: prayer.prayerType,
        urgency: prayer.urgency,
        status: prayer.status,
        createdAt: prayer.createdAt,
      }));

      res.status(200).json({
        success: true,
        data: summary,
        message: "Resumo recuperado",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        data: [],
        message: "Erro ao buscar resumo",
      });
    }
  };
}
