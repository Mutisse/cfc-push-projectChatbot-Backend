import { Request, Response } from "express";
import { MemberService } from "../services/memberService";
import {
  CreateMemberRegistrationDto,
  UpdateMemberRegistrationDto,
} from "../interfaces/member-registration.interface";

export class MemberController {
  private memberRegistrationService: MemberService;

  constructor() {
    this.memberRegistrationService = new MemberService();
  }

  // ✅ BUSCAR TODOS OS REGISTROS (ARRAY DIRETO)
  getAllRegistrations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, source } = req.query;

      const filters: { status?: string; source?: string } = {};
      if (status) filters.status = status as string;
      if (source) filters.source = source as string;

      const result = await this.memberRegistrationService.getAllRegistrations(
        filters,
        1, // page 1
        10000 // limite grande
      );

      res.status(200).json({
        success: true,
        data: result.data, // ✅ ARRAY DIRETO
        message: "Registros recuperados com sucesso",
        count: result.total,
      });
    } catch (error) {
      console.error("❌ Erro em getAllRegistrations:", error);
      res.status(500).json({
        success: false,
        data: [],
        message:
          error instanceof Error ? error.message : "Erro interno do servidor",
      });
    }
  };

  // ✅ BUSCAR REGISTROS PENDENTES
  getPendingRegistrations = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const pendingRegistrations =
        await this.memberRegistrationService.getPendingRegistrations();

      res.status(200).json({
        success: true,
        data: pendingRegistrations,
        message: "Registros pendentes recuperados com sucesso",
        count: pendingRegistrations.length,
      });
    } catch (error) {
      console.error("❌ Erro em getPendingRegistrations:", error);
      res.status(500).json({
        success: false,
        data: [],
        message:
          error instanceof Error ? error.message : "Erro interno do servidor",
      });
    }
  };

  // ✅ BUSCAR REGISTROS DELETADOS
  getDeletedRegistrations = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const deletedRegistrations =
        await this.memberRegistrationService.getDeletedRegistrations();

      res.status(200).json({
        success: true,
        data: deletedRegistrations,
        message: "Registros arquivados recuperados com sucesso",
        count: deletedRegistrations.length,
      });
    } catch (error) {
      console.error("❌ Erro em getDeletedRegistrations:", error);
      res.status(500).json({
        success: false,
        data: [],
        message:
          error instanceof Error ? error.message : "Erro interno do servidor",
      });
    }
  };

  // ✅ BUSCAR REGISTRO POR ID
  getRegistrationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const registration =
        await this.memberRegistrationService.getRegistrationById(id);

      if (!registration) {
        res.status(404).json({
          success: false,
          data: null,
          message: "Registro não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: registration,
        message: "Registro recuperado com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro em getRegistrationById:", error);
      res.status(500).json({
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Erro interno do servidor",
      });
    }
  };

  // ✅ BUSCAR REGISTRO POR TELEFONE
  getRegistrationByPhone = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { phoneNumber } = req.params;

      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          message: "Número de telefone é obrigatório",
          data: null,
        });
        return;
      }

      // Limpa o número (remove tudo que não for dígito)
      const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");

      if (cleanPhoneNumber.length < 9) {
        res.status(400).json({
          success: false,
          message: "Número de telefone deve ter pelo menos 9 dígitos",
          data: null,
        });
        return;
      }

      // Busca no service
      const registration =
        await this.memberRegistrationService.getRegistrationByPhone(
          cleanPhoneNumber
        );

      if (!registration) {
        res.status(404).json({
          success: false,
          message: "Membro não encontrado com este número de telefone",
          data: null,
        });
        return;
      }

      // Retorna o objeto Member (NÃO array)
      res.status(200).json({
        success: true,
        data: registration, // ← OBJETO INDIVIDUAL
        message: "Membro encontrado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao buscar membro por telefone:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor ao buscar membro",
        data: null,
      });
    }
  };

  // ✅ BUSCAR ESTATÍSTICAS
  getRegistrationStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.memberRegistrationService.getRegistrationStats();

      res.status(200).json({
        success: true,
        data: stats,
        message: "Estatísticas recuperadas com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro em getRegistrationStats:", error);
      res.status(500).json({
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Erro interno do servidor",
      });
    }
  };

  // ✅ BUSCAR STATUS DO REGISTRO
  getRegistrationStatus = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const status = await this.memberRegistrationService.getRegistrationStatus(
        id
      );

      res.status(200).json({
        success: true,
        data: status,
        message: "Status do registro recuperado com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro em getRegistrationStatus:", error);
      res.status(404).json({
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Registro não encontrado",
      });
    }
  };

  // ==================== ROTAS DE CRIAÇÃO ====================

  // ✅ CRIAR NOVO REGISTRO
  createRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
      const registrationData: CreateMemberRegistrationDto = req.body;
      const newRegistration =
        await this.memberRegistrationService.createRegistration(
          registrationData
        );

      res.status(201).json({
        success: true,
        data: newRegistration,
        message: "Registro criado com sucesso. Aguarde a aprovação.",
      });
    } catch (error) {
      console.error("❌ Erro em createRegistration:", error);
      res.status(400).json({
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Erro ao criar registro",
      });
    }
  };

  // ==================== ROTAS DE ATUALIZAÇÃO ====================

  // ✅ ATUALIZAR REGISTRO
  updateRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateMemberRegistrationDto = req.body;
      const updatedRegistration =
        await this.memberRegistrationService.updateRegistration(id, updateData);

      if (!updatedRegistration) {
        res.status(404).json({
          success: false,
          data: null,
          message: "Registro não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedRegistration,
        message: "Registro atualizado com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro em updateRegistration:", error);
      res.status(400).json({
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Erro ao atualizar registro",
      });
    }
  };

  // ✅ APROVAR REGISTRO (AGORA FLEXÍVEL)
  approveRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { approvedBy } = req.body;

      // ✅ AGORA É FLEXÍVEL: Se não enviar approvedBy, o Service usa "admin"
      const approvedRegistration =
        await this.memberRegistrationService.approveRegistration(
          id,
          approvedBy // Pode ser string, undefined, ou null
        );

      if (!approvedRegistration) {
        res.status(404).json({
          success: false,
          data: null,
          message: "Registro não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: approvedRegistration,
        message: "Registro aprovado com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro em approveRegistration:", error);
      res.status(400).json({
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Erro ao aprovar registro",
      });
    }
  };

  // ✅ REJEITAR REGISTRO
  rejectRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        res.status(400).json({
          success: false,
          data: null,
          message: "Motivo da rejeição é obrigatório",
        });
        return;
      }

      const rejectedRegistration =
        await this.memberRegistrationService.rejectRegistration(
          id,
          rejectionReason
        );

      if (!rejectedRegistration) {
        res.status(404).json({
          success: false,
          data: null,
          message: "Registro não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: rejectedRegistration,
        message: "Registro rejeitado com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro em rejectRegistration:", error);
      res.status(400).json({
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Erro ao rejeitar registro",
      });
    }
  };

  // ✅ CANCELAR REGISTRO
  cancelRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const cancelledRegistration =
        await this.memberRegistrationService.cancelRegistration(id);

      if (!cancelledRegistration) {
        res.status(404).json({
          success: false,
          data: null,
          message: "Registro não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: cancelledRegistration,
        message: "Registro cancelado com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro em cancelRegistration:", error);
      res.status(400).json({
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Erro ao cancelar registro",
      });
    }
  };

  // ✅ RESTAURAR REGISTRO
  restoreRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const restoredRegistration =
        await this.memberRegistrationService.restoreRegistration(id);

      if (!restoredRegistration) {
        res.status(404).json({
          success: false,
          data: null,
          message: "Registro não encontrado ou não está arquivado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: restoredRegistration,
        message: "Registro restaurado com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro em restoreRegistration:", error);
      res.status(400).json({
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Erro ao restaurar registro",
      });
    }
  };

  // ==================== ROTAS DE EXCLUSÃO ====================

  // ✅ SOFT DELETE
  softDeleteRegistration = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const deletedRegistration =
        await this.memberRegistrationService.softDeleteRegistration(id);

      if (!deletedRegistration) {
        res.status(404).json({
          success: false,
          data: null,
          message: "Registro não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: deletedRegistration,
        message: "Registro arquivado com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro em softDeleteRegistration:", error);
      res.status(400).json({
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Erro ao arquivar registro",
      });
    }
  };

  // ✅ HARD DELETE
  hardDeleteRegistration = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted =
        await this.memberRegistrationService.hardDeleteRegistration(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          data: null,
          message: "Registro não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: null,
        message: "Registro excluído permanentemente com sucesso",
      });
    } catch (error) {
      console.error("❌ Erro em hardDeleteRegistration:", error);
      res.status(400).json({
        success: false,
        data: null,
        message:
          error instanceof Error ? error.message : "Erro ao excluir registro",
      });
    }
  };
}
