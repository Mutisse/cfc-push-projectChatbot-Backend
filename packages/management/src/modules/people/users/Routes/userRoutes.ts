// src/modules/people/users/routes/userRoutes.ts
import { Router } from "express";

// Importar com require
const UserController = require("../controller/userController").UserController;
const AuthMiddleware = require("../Middleware/authMiddleware").AuthMiddleware;

const router = Router();
const userController = new UserController();
const authMiddleware = new AuthMiddleware();

// ==================== MIDDLEWARE GLOBAL ====================
// CORREÇÃO: adicionar path vazio ''
router.use("", (req, res, next) => authMiddleware.authenticate(req, res, next));

// ==================== DOCUMENTAÇÃO ====================
router.get("/docs", (req, res) => {
  res.json({
    service: "CFC Push Management API - Users Module",
    version: "1.0.0",
    status: "operational",
    description: "Sistema de gestão de usuários para CFC Push",
    authentication: "🔐 OBRIGATÓRIO para todas as rotas abaixo",
    authorization: {
      super_admin: "Acesso total a todas as funcionalidades",
      grupo_pastoral: "Pode ler e editar usuários",
      leader: "Apenas leitura de usuários",
    },
    endpoints: {
      users: {
        create: {
          method: "POST",
          path: "/api/management/users",
          role: "super_admin",
        },
        list: {
          method: "GET",
          path: "/api/management/users",
          role: "super_admin, grupo_pastoral, leader",
        },
        stats: {
          method: "GET",
          path: "/api/management/users/stats",
          role: "super_admin, grupo_pastoral",
        },
        deleted: {
          method: "GET",
          path: "/api/management/users/deleted",
          role: "super_admin",
        },
        byId: {
          method: "GET",
          path: "/api/management/users/:id",
          role: "super_admin, grupo_pastoral, leader",
        },
        byPhone: {
          method: "GET",
          path: "/api/management/users/phone/:phoneNumber",
          role: "super_admin, grupo_pastoral, leader",
        },
        byEmail: {
          method: "GET",
          path: "/api/management/users/email/:email",
          role: "super_admin, grupo_pastoral, leader",
        },
        update: {
          method: "PUT",
          path: "/api/management/users/:id",
          role: "super_admin, grupo_pastoral",
        },
        deactivate: {
          method: "PATCH",
          path: "/api/management/users/:id/deactivate",
          role: "super_admin",
        },
        restore: {
          method: "PATCH",
          path: "/api/management/users/:id/restore",
          role: "super_admin",
        },
        block: {
          method: "PATCH",
          path: "/api/management/users/:id/block",
          role: "super_admin",
        },
        activate: {
          method: "PATCH",
          path: "/api/management/users/:id/activate",
          role: "super_admin",
        },
        changePassword: {
          method: "PATCH",
          path: "/api/management/users/:id/change-password",
          role: "super_admin, grupo_pastoral",
        },
        softDelete: {
          method: "DELETE",
          path: "/api/management/users/:id/soft",
          role: "super_admin",
        },
        hardDelete: {
          method: "DELETE",
          path: "/api/management/users/:id/hard",
          role: "super_admin",
        },
        checkCanDelete: {
          method: "GET",
          path: "/api/management/users/:id/can-delete",
          role: "super_admin",
        },
        checkCanBlock: {
          method: "GET",
          path: "/api/management/users/:id/can-block",
          role: "super_admin",
        },
      },
    },
  });
});

// ==================== TODAS AS SUAS ROTAS ====================

// GET / - Listar usuários
router.get("/", (req, res, next) => {
  authMiddleware.authorize(["super_admin", "grupo_pastoral", "leader"])(
    req,
    res,
    () => {
      userController.getUsers(req, res);
    }
  );
});

// POST / - Criar usuário
router.post("/", (req, res, next) => {
  authMiddleware.authorize(["super_admin"])(req, res, () => {
    userController.createUser(req, res);
  });
});

// GET /stats - Estatísticas
router.get("/stats", (req, res, next) => {
  authMiddleware.authorize(["super_admin", "grupo_pastoral"])(req, res, () => {
    userController.getUserStats(req, res);
  });
});

// GET /deleted - Usuários deletados
router.get("/deleted", (req, res, next) => {
  authMiddleware.authorize(["super_admin"])(req, res, () => {
    userController.getDeletedUsers(req, res);
  });
});

// GET /:id - Buscar por ID
router.get("/:id", (req, res, next) => {
  authMiddleware.authorize(["super_admin", "grupo_pastoral", "leader"])(
    req,
    res,
    () => {
      userController.getUserById(req, res);
    }
  );
});

// PUT /:id - Atualizar
router.put("/:id", (req, res, next) => {
  authMiddleware.authorize(["super_admin", "grupo_pastoral"])(req, res, () => {
    userController.updateUser(req, res);
  });
});

// PATCH /:id/deactivate - Desativar
router.patch("/:id/deactivate", (req, res, next) => {
  authMiddleware.authorize(["super_admin"])(req, res, () => {
    userController.deactivateUser(req, res);
  });
});

// PATCH /:id/restore - Restaurar
router.patch("/:id/restore", (req, res, next) => {
  authMiddleware.authorize(["super_admin"])(req, res, () => {
    userController.restoreUser(req, res);
  });
});

// PATCH /:id/block - Bloquear
router.patch("/:id/block", (req, res, next) => {
  authMiddleware.authorize(["super_admin"])(req, res, () => {
    userController.blockUser(req, res);
  });
});

// PATCH /:id/activate - Ativar
router.patch("/:id/activate", (req, res, next) => {
  authMiddleware.authorize(["super_admin"])(req, res, () => {
    userController.activateUser(req, res);
  });
});

// PATCH /:id/change-password - Alterar senha
router.patch("/:id/change-password", (req, res, next) => {
  authMiddleware.authorize(["super_admin", "grupo_pastoral"])(req, res, () => {
    userController.changePassword(req, res);
  });
});

// DELETE /:id/soft - Soft delete
router.delete("/:id/soft", (req, res, next) => {
  authMiddleware.authorize(["super_admin"])(req, res, () => {
    userController.deactivateUser(req, res);
  });
});

// DELETE /:id/hard - Hard delete
router.delete("/:id/hard", (req, res, next) => {
  authMiddleware.authorize(["super_admin"])(req, res, () => {
    userController.deleteUserPermanently(req, res);
  });
});

// GET /:id/can-delete - Verificar se pode deletar
router.get("/:id/can-delete", (req, res, next) => {
  authMiddleware.authorize(["super_admin"])(req, res, () => {
    userController.checkCanDelete(req, res);
  });
});

// GET /:id/can-block - Verificar se pode bloquear
router.get("/:id/can-block", (req, res, next) => {
  authMiddleware.authorize(["super_admin"])(req, res, () => {
    userController.checkCanBlock(req, res);
  });
});

// GET /phone/:phoneNumber - Buscar por telefone
router.get("/phone/:phoneNumber", (req, res, next) => {
  authMiddleware.authorize(["super_admin", "grupo_pastoral", "leader"])(
    req,
    res,
    () => {
      userController.getUserByPhone(req, res);
    }
  );
});

// GET /email/:email - Buscar por email
router.get("/email/:email", (req, res, next) => {
  authMiddleware.authorize(["super_admin", "grupo_pastoral", "leader"])(
    req,
    res,
    () => {
      userController.getUserByEmail(req, res);
    }
  );
});

export default router;
