// welcomeMessageRoutes.ts - VERSÃO SIMPLIFICADA
import { Router } from "express";
import { WelcomeMessageController } from "../controllers/welcomeMessageController";

const router = Router();
const welcomeMessageController = new WelcomeMessageController();

// ==================== ROTA DE DOCUMENTAÇÃO ====================
router.get("/docs", (req: any, res: any) => {
  res.json({
    service: "CFC Push Management API - Welcome Messages Module",
    version: "1.0.0",
    status: "operational",
    description:
      "Sistema de gestão de mensagens de boas-vindas para o chatbot CFC Push",
    endpoints: {
      // 📋 CONSULTA E LISTAGEM
      read: {
        active: "GET /api/management/welcome/active",
        all: "GET /api/management/welcome",
        deleted: "GET /api/management/welcome/deleted",
        byId: "GET /api/management/welcome/:id",
      },
      // ➕ CRIAÇÃO
      create: {
        new: "POST /api/management/welcome",
      },
      // ✏️ ATUALIZAÇÃO
      update: {
        basic: "PUT /api/management/welcome/:id",
        status: "PATCH /api/management/welcome/:id/status",
        restore: "PATCH /api/management/welcome/:id/restore",
      },
      // 🗑️ EXCLUSÃO
      delete: {
        soft: "DELETE /api/management/welcome/:id",
      },
    },
  });
});

// ==================== ROTAS DE CONSULTA ====================
router.get("/", welcomeMessageController.getAllMessages);
router.get("/active", welcomeMessageController.getActiveMessage);
router.get("/deleted", welcomeMessageController.getDeletedMessages);
router.get("/:id", welcomeMessageController.getMessageById);

// ==================== ROTAS DE CRIAÇÃO ====================
router.post("/", welcomeMessageController.createMessage);

// ==================== ROTAS DE ATUALIZAÇÃO ====================
router.put("/:id", welcomeMessageController.updateMessage);
router.patch("/:id/restore", welcomeMessageController.restoreMessage);
router.patch("/:id/status", welcomeMessageController.toggleMessageActive);

// ==================== ROTAS DE EXCLUSÃO ====================
router.delete("/:id", welcomeMessageController.deleteMessage);

export default router;
