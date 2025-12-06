// src/routes/menuRoutes.ts
import { Router } from "express";
import { MenuController } from "../controllers/menuController";

const router = Router();
const menuController = new MenuController();

// ==================== ROTA DE DOCUMENTAÇÃO ====================
router.get("/docs", (req, res) => {  // ✅ MUDADO DE "/" PARA "/docs"
  res.json({
    service: "CFC Push Management API - Menu Management Module",
    version: "1.0.0",
    status: "operational",
    description: "Sistema de gestão de menus hierárquicos para o chatbot CFC Push",
    endpoints: {
      // 📋 CONSULTA E LISTAGEM
      read: {
        all: "GET /api/management/menus",
        main: "GET /api/management/menus/main",
        deleted: "GET /api/management/menus/deleted",
        byId: "GET /api/management/menus/:id",
        submenus: "GET /api/management/menus/parent/:parentId/submenus"
      },
      // ➕ CRIAÇÃO
      create: {
        new: "POST /api/management/menus"
      },
      // ✏️ ATUALIZAÇÃO
      update: {
        basic: "PUT /api/management/menus/:id",
        status: "PATCH /api/management/menus/:id/status",
        restore: "PATCH /api/management/menus/:id/restore"
      },
      // 🗑️ EXCLUSÃO
      delete: {
        soft: "DELETE /api/management/menus/:id"
      }
    },
    menu_structure: {
      main_menu: "Menu principal (parentId = null)",
      submenu: "Submenu vinculado a um menu principal",
      hierarchy: "Main Menu → Submenu → Sub-submenu"
    },
    menu_status: {
      active: "Menu visível e funcional no chatbot",
      inactive: "Menu oculto mas mantido no sistema"
    },
    examples: {
      create_main_menu: {
        method: "POST",
        url: "/api/management/menus",
        body: {
          name: "oracao",
          title: "🙏 Ministério de Oração",
          content: "Escolha uma opção de oração:",
          type: "menu",
          order: 1,
          isActive: true
        }
      },
      create_submenu: {
        method: "POST",
        url: "/api/management/menus",
        body: {
          name: "pedido-oracao",
          title: "📝 Fazer Pedido de Oração",
          content: "Digite seu pedido de oração...",
          type: "text_input", 
          order: 1,
          isActive: true,
          parentId: "507f1f77bcf86cd799439011"
        }
      },
      get_submenus: {
        method: "GET",
        url: "/api/management/menus/parent/507f1f77bcf86cd799439011/submenus"
      }
    },
    features: [
      "Hierarquia ilimitada de menus e submenus",
      "Soft delete com possibilidade de restauração",
      "Ativação/desativação dinâmica",
      "Ordenação personalizada",
      "Tipos de menu: menu, text_input, quick_reply, etc."
    ],
    notes: [
      "Menus principais não possuem parentId",
      "A ordem é definida pelo campo 'order'",
      "Soft delete mantém histórico para auditoria"
    ]
  });
});

// ==================== ROTAS DE CONSULTA ====================

// GET routes
router.get("/", menuController.getAllMenus);  // ✅ Esta fica com "/" (dados reais)
router.get("/main", menuController.getMainMenus);
router.get("/deleted", menuController.getDeletedMenus);
router.get("/:id", menuController.getMenuById);
router.get("/parent/:parentId/submenus", menuController.getSubmenus);

// ==================== ROTAS DE CRIAÇÃO ====================

// POST routes
router.post("/", menuController.createMenu);

// ==================== ROTAS DE ATUALIZAÇÃO ====================

// PUT routes
router.put("/:id", menuController.updateMenu);

// PATCH routes
router.patch("/:id/restore", menuController.restoreMenu);
router.patch("/:id/status", menuController.toggleMenuStatus);

// ==================== ROTAS DE EXCLUSÃO ====================

// DELETE routes (soft delete)
router.delete("/:id", menuController.deleteMenu);

export default router;