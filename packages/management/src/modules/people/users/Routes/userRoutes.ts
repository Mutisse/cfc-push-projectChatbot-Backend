// src/modules/people/users/routes/userRoutes.ts
import { Router } from 'express';
import { UserController } from '../../users/controller/userController';
import { AuthMiddleware } from '../../users/Middleware/authMiddleware';

const router = Router();
const userController = new UserController();
const authMiddleware = new AuthMiddleware();

// ==================== MIDDLEWARE DE AUTENTICAÇÃO ====================
router.use(authMiddleware.authenticate);

// ==================== ROTA PARA LISTAR USUÁRIOS (DEVE VIR PRIMEIRO) ====================
router.get('/', authMiddleware.authorize(['super_admin', 'grupo_pastoral', 'leader']), userController.getUsers);

// ==================== ROTA DE DOCUMENTAÇÃO ====================
router.get("/docs", (req, res) => {  // ✅ MUDADO PARA "/docs"
  res.json({
    service: "CFC Push Management API - Users Module",
    version: "1.0.0",
    status: "operational",
    description: "Sistema de gestão de usuários para CFC Push",
    authentication: "🔐 OBRIGATÓRIO para todas as rotas abaixo",
    authorization: {
      super_admin: "Acesso total a todas as funcionalidades",
      grupo_pastoral: "Pode ler e editar usuários",
      leader: "Apenas leitura de usuários"
    },
    endpoints: {
      // 👥 GESTÃO DE USUÁRIOS
      users: {
        create: {
          method: "POST",
          path: "/api/management/users",
          role: "super_admin",
          description: "Criar novo usuário"
        },
        list: {
          method: "GET", 
          path: "/api/management/users",
          role: "super_admin, grupo_pastoral, leader",
          description: "Listar todos os usuários"
        },
        stats: {
          method: "GET",
          path: "/api/management/users/stats", 
          role: "super_admin, grupo_pastoral",
          description: "Estatísticas de usuários"
        },
        deleted: {
          method: "GET",
          path: "/api/management/users/deleted",
          role: "super_admin",
          description: "Listar usuários deletados"
        },
        byId: {
          method: "GET",
          path: "/api/management/users/:id",
          role: "super_admin, grupo_pastoral, leader", 
          description: "Buscar usuário por ID"
        },
        byPhone: {
          method: "GET",
          path: "/api/management/users/phone/:phoneNumber",
          role: "super_admin, grupo_pastoral, leader",
          description: "Buscar usuário por telefone"
        },
        byEmail: {
          method: "GET",
          path: "/api/management/users/email/:email",
          role: "super_admin, grupo_pastoral, leader",
          description: "Buscar usuário por email"
        },
        update: {
          method: "PUT",
          path: "/api/management/users/:id",
          role: "super_admin, grupo_pastoral",
          description: "Atualizar usuário"
        },
        deactivate: {
          method: "PATCH",
          path: "/api/management/users/:id/deactivate",
          role: "super_admin",
          description: "Desativar usuário (soft delete)"
        },
        restore: {
          method: "PATCH", 
          path: "/api/management/users/:id/restore",
          role: "super_admin",
          description: "Restaurar usuário deletado"
        },
        block: {
          method: "PATCH",
          path: "/api/management/users/:id/block",
          role: "super_admin", 
          description: "Bloquear usuário"
        },
        activate: {
          method: "PATCH",
          path: "/api/management/users/:id/activate",
          role: "super_admin",
          description: "Ativar usuário"
        },
        changePassword: {
          method: "PATCH",
          path: "/api/management/users/:id/change-password",
          role: "super_admin, grupo_pastoral",
          description: "Alterar password do usuário"
        },
        softDelete: {
          method: "DELETE",
          path: "/api/management/users/:id/soft",
          role: "super_admin",
          description: "Soft delete (alias para deactivate)"
        },
        hardDelete: {
          method: "DELETE",
          path: "/api/management/users/:id/hard", 
          role: "super_admin",
          description: "Hard delete (remoção permanente)"
        },
        checkCanDelete: {
          method: "GET",
          path: "/api/management/users/:id/can-delete",
          role: "super_admin",
          description: "Verificar se usuário pode ser deletado"
        },
        checkCanBlock: {
          method: "GET",
          path: "/api/management/users/:id/can-block",
          role: "super_admin",
          description: "Verificar se usuário pode ser bloqueado"
        }
      }
    },
    user_roles: {
      super_admin: {
        description: "Acesso total ao sistema",
        permissions: ["all"]
      },
      grupo_pastoral: {
        description: "Acesso pastoral completo", 
        permissions: ["read", "update", "change_password"]
      },
      leader: {
        description: "Líder de departamento",
        permissions: ["read_only"]
      }
    },
    user_status: {
      ativo: "Usuário ativo e pode fazer login",
      desativado: "Usuário desativado (soft delete)", 
      bloqueado: "Usuário bloqueado por segurança"
    },
    security_rules: {
      cannot_delete_last_super_admin: "Impede deletar o último super_admin",
      cannot_block_last_super_admin: "Impede bloquear o último super_admin ativo",
      password_requirements: "Mínimo 6 caracteres, hash bcrypt"
    },
    examples: {
      create_user: {
        method: "POST",
        url: "/api/management/users",
        headers: {
          "Authorization": "Bearer <jwt-token>",
          "Content-Type": "application/json"
        },
        body: {
          phoneNumber: "841234567",
          email: "pastor@cfcpush.org",
          password: "senhaSegura123",
          gender: "male",
          role: "grupo_pastoral"
        }
      },
      update_user: {
        method: "PUT", 
        url: "/api/management/users/507f1f77bcf86cd799439011",
        headers: {
          "Authorization": "Bearer <jwt-token>",
          "Content-Type": "application/json" 
        },
        body: {
          phoneNumber: "849876543",
          email: "novoemail@cfcpush.org",
          role: "leader"
        }
      }
    },
    notes: [
      "📱 Autenticação requer token JWT no header Authorization: Bearer <token>",
      "👑 Apenas super_admin pode criar/deletar usuários",
      "🛡️ Não é possível deletar/bloquear o último super_admin ativo",
      "🔐 Passwords são hasheadas com bcrypt antes de salvar",
      "📧 Email e telefone devem ser únicos no sistema"
    ]
  });
});

// ==================== ROTAS COM AUTORIZAÇÃO POR ROLE ====================

// CRUD BÁSICO (já temos GET / na linha 13)
router.post('/', authMiddleware.authorize(['super_admin']), userController.createUser);
router.get('/stats', authMiddleware.authorize(['super_admin', 'grupo_pastoral']), userController.getUserStats);
router.get('/deleted', authMiddleware.authorize(['super_admin']), userController.getDeletedUsers);

// OPERAÇÕES POR ID
router.get('/:id', authMiddleware.authorize(['super_admin', 'grupo_pastoral', 'leader']), userController.getUserById);
router.put('/:id', authMiddleware.authorize(['super_admin', 'grupo_pastoral']), userController.updateUser);
router.patch('/:id/deactivate', authMiddleware.authorize(['super_admin']), userController.deactivateUser);
router.patch('/:id/restore', authMiddleware.authorize(['super_admin']), userController.restoreUser);
router.patch('/:id/block', authMiddleware.authorize(['super_admin']), userController.blockUser);
router.patch('/:id/activate', authMiddleware.authorize(['super_admin']), userController.activateUser);
router.patch('/:id/change-password', authMiddleware.authorize(['super_admin', 'grupo_pastoral']), userController.changePassword);
router.delete('/:id/soft', authMiddleware.authorize(['super_admin']), userController.deactivateUser);
router.delete('/:id/hard', authMiddleware.authorize(['super_admin']), userController.deleteUserPermanently);

// VERIFICAÇÕES DE PERMISSÃO
router.get('/:id/can-delete', authMiddleware.authorize(['super_admin']), userController.checkCanDelete);
router.get('/:id/can-block', authMiddleware.authorize(['super_admin']), userController.checkCanBlock);

// BUSCA POR IDENTIFICADOR
router.get('/phone/:phoneNumber', authMiddleware.authorize(['super_admin', 'grupo_pastoral', 'leader']), userController.getUserByPhone);
router.get('/email/:email', authMiddleware.authorize(['super_admin', 'grupo_pastoral', 'leader']), userController.getUserByEmail);

export default router;