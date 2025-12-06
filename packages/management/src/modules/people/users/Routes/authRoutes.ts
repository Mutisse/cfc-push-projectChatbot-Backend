import { Router } from 'express';
import { AuthController } from '../controller/authController';
import { AuthMiddleware } from '../Middleware/authMiddleware'; // ✅ Importação da classe

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware(); // ✅ Criando instância

// ==================== ROTA DE DOCUMENTAÇÃO ====================
router.get("/", (req, res) => {
  res.json({
    service: "CFC Push Management API - Authentication Module",
    version: "1.0.0",
    status: "operational",
    description: "Sistema de autenticação e gestão de sessões",
    endpoints: {
      auth: {
        login: {
          method: "POST",
          path: "/api/management/auth/login",
          role: "public",
          description: "Login no sistema (email ou telefone)"
        },
        logout: {
          method: "POST", 
          path: "/api/management/auth/logout",
          role: "authenticated",
          description: "Logout do sistema"
        },
        me: {
          method: "GET",
          path: "/api/management/auth/me",
          role: "authenticated",
          description: "Obter perfil do usuário atual"
        },
        refresh: {
          method: "POST",
          path: "/api/management/auth/refresh",
          role: "authenticated",
          description: "Refresh token JWT"
        },
        changePassword: {
          method: "PATCH",
          path: "/api/management/auth/change-password",
          role: "authenticated",
          description: "Alterar password do usuário atual"
        }
      }
    },
    examples: {
      login: {
        method: "POST",
        url: "/api/management/auth/login",
        body: {
          identifier: "admin@cfcpush.org", // ou "847001234"
          password: "AdminRoot123!"
        }
      }
    },
    notes: [
      "📱 Pode usar email ou número de telefone como identificador",
      "🔐 Token JWT válido por 7 dias", 
      "🔄 Refresh token disponível para renovar sessão",
      "🚪 Logout remove o token do cliente apenas",
      "🔒 Password deve ter mínimo 6 caracteres"
    ]
  });
});

// ==================== ROTAS PÚBLICAS ====================

router.post('/login', authController.login); // ✅ SEM MIDDLEWARE

// ==================== ROTAS PROTEGIDAS ====================

router.post('/refresh', authMiddleware.authenticate, authController.refreshToken);
router.post('/logout', authMiddleware.authenticate, authController.logout);
router.get('/me', authMiddleware.authenticate, authController.me);
router.patch('/change-password', authMiddleware.authenticate, authController.changePassword);

export default router;