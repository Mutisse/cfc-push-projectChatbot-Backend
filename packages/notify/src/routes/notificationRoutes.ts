import { Router } from 'express';
import notificationController from '../controllers/notificationController';
import { authMiddleware } from '../middleware/auth'; // Descomente quando tiver auth

const router = Router();

// Todas as rotas exigem autenticação
router.use(authMiddleware);

// Rotas para usuários
router.get('/', notificationController.getUserNotifications);
router.get('/unread/count', notificationController.getUnreadCount);
router.get('/stats', notificationController.getStats);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);

// Rotas para administradores (podem criar notificações manualmente)
router.post('/', notificationController.createNotification);
router.post('/send-pending', notificationController.sendPendingNotifications);

export default router;