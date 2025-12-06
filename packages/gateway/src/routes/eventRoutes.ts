import { Router } from 'express';
import { EventController } from '../controllers/EventController';

const router = Router();
const eventController = new EventController();

// Receber eventos dos serviços
router.post('/events', eventController.handleEvent);

// Verificar status dos serviços
router.get('/status', eventController.getServicesStatus);

// Notificações pendentes
router.get('/notifications/pending', eventController.getPendingNotifications);

export default router;