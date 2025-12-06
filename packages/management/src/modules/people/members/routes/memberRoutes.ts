import { Router } from "express";
import { MemberController } from "../controllers/memberController";

const router = Router();
const memberController = new MemberController();

// ==================== ROTA DE DOCUMENTAÇÃO ====================
router.get("/docs", (req, res) => {
  res.json({
    service: "CFC Push Management API - Member Registrations Module",
    version: "1.0.0",
    status: "operational",
    description:
      "Sistema de gestão de solicitações de registro de membros para CFC Push",
    endpoints: {
      // 📋 CONSULTA E LISTAGEM
      read: {
        all: "GET /api/management/registrations",
        pending: "GET /api/management/registrations/pending",
        deleted: "GET /api/management/registrations/deleted",
        stats: "GET /api/management/registrations/stats",
        byId: "GET /api/management/registrations/:id",
        byPhone: "GET /api/management/registrations/phone/:phoneNumber",
        status: "GET /api/management/registrations/:id/status",
      },
      // ➕ CRIAÇÃO
      create: {
        new: "POST /api/management/registrations",
      },
      // ✏️ ATUALIZAÇÃO
      update: {
        basic: "PUT /api/management/registrations/:id",
        approve: "PATCH /api/management/registrations/:id/approve",
        reject: "PATCH /api/management/registrations/:id/reject",
        cancel: "PATCH /api/management/registrations/:id/cancel",
        restore: "PATCH /api/management/registrations/:id/restore",
      },
      // 🗑️ EXCLUSÃO
      delete: {
        soft: "DELETE /api/management/registrations/:id/soft",
        hard: "DELETE /api/management/registrations/:id/hard",
      },
    },
    notes: [
      "Registros aprovados automaticamente criam membros na base de dados",
      "Busca por telefone usa prefixo 258 (Moçambique)",
      "Soft delete mantém registro para histórico, hard delete remove permanentemente",
      "approvedBy pode ser string ('admin') ou ObjectId de usuário",
    ],
  });
});

// ==================== ROTAS DE CONSULTA ====================

router.get("/", memberController.getAllRegistrations);
router.get("/pending", memberController.getPendingRegistrations);
router.get("/deleted", memberController.getDeletedRegistrations);
router.get("/stats", memberController.getRegistrationStats);
router.get("/:id", memberController.getRegistrationById);
router.get("/:id/status", memberController.getRegistrationStatus);
router.get("/phone/:phoneNumber", memberController.getRegistrationByPhone);

// ==================== ROTAS DE CRIAÇÃO ====================

router.post("/", memberController.createRegistration);

// ==================== ROTAS DE ATUALIZAÇÃO ====================

router.put("/:id", memberController.updateRegistration);
router.patch("/:id/approve", memberController.approveRegistration);
router.patch("/:id/reject", memberController.rejectRegistration);
router.patch("/:id/cancel", memberController.cancelRegistration);
router.patch("/:id/restore", memberController.restoreRegistration);

// ==================== ROTAS DE EXCLUSÃO ====================

router.delete("/:id/soft", memberController.softDeleteRegistration);
router.delete("/:id/hard", memberController.hardDeleteRegistration);

export default router;
