// src/modules/people/users/Routes/authRoutes.ts
import { Router } from 'express';

const router = Router();

// Importar com require para evitar problemas
const { AuthController } = require('../controller/authController');
const { authMiddleware } = require('../Middleware/authMiddleware');

const authController = new AuthController();

// Rota pública: Login
router.post('/login', (req, res) => {
  authController.login(req, res);
});

// Rotas protegidas
router.post('/refresh', (req, res, next) => {
  authMiddleware.authenticate(req, res, () => {
    authController.refreshToken(req, res);
  });
});

router.post('/logout', (req, res, next) => {
  authMiddleware.authenticate(req, res, () => {
    authController.logout(req, res);
  });
});

router.get('/me', (req, res, next) => {
  authMiddleware.authenticate(req, res, () => {
    authController.me(req, res);
  });
});

router.patch('/change-password', (req, res, next) => {
  authMiddleware.authenticate(req, res, () => {
    authController.changePassword(req, res);
  });
});

// Documentação
router.get('/', (req, res) => {
  res.json({
    service: "CFC Push Management API - Authentication",
    version: "1.0.0",
    endpoints: {
      login: "POST /api/management/auth/login",
      logout: "POST /api/management/auth/logout",
      me: "GET /api/management/auth/me",
    }
  });
});

export default router;