import { Router } from 'express';
import AlertController from '../controllers/AlertController';

const router = Router();

// ========== GET ROUTES ==========
// GET /monitoring/alerts - Obter alertas com filtros
router.get('/', AlertController.getAlerts);

// GET /monitoring/alerts/stats - Estatísticas de alertas
router.get('/stats', AlertController.getAlertStats);

// GET /monitoring/alerts/chart - Dados do gráfico
router.get('/chart', AlertController.getAlertChartData);

// GET /monitoring/alerts/settings - Configurações de alertas
router.get('/settings', AlertController.getAlertSettings);

// GET /monitoring/alerts/recent - Alertas recentes
router.get('/recent', AlertController.getRecentAlerts);

// GET /monitoring/alerts/critical - Alertas críticos
router.get('/critical', AlertController.getCriticalAlerts);

// GET /monitoring/alerts/:id - Obter alerta por ID
router.get('/:id', AlertController.getAlertById);

// ========== POST ROUTES ==========
// POST /monitoring/alerts - Criar alerta
router.post('/', AlertController.createAlert);

// POST /monitoring/alerts/:id/resolve - Resolver alerta
router.post('/:id/resolve', AlertController.resolveAlert);

// POST /monitoring/alerts/:id/acknowledge - Reconhecer alerta
router.post('/:id/acknowledge', AlertController.acknowledgeAlert);

// POST /monitoring/alerts/:id/mute - Silenciar alerta
router.post('/:id/mute', AlertController.muteAlert);

// POST /monitoring/alerts/:id/unmute - Dessilenciar alerta
router.post('/:id/unmute', AlertController.unmuteAlert);

// POST /monitoring/alerts/:id/escalate - Escalar alerta
router.post('/:id/escalate', AlertController.escalateAlert);

// POST /monitoring/alerts/bulk/resolve - Resolver múltiplos alertas
router.post('/bulk/resolve', AlertController.bulkResolveAlerts);

// POST /monitoring/alerts/bulk/acknowledge - Reconhecer múltiplos alertas
router.post('/bulk/acknowledge', AlertController.bulkAcknowledgeAlerts);

// POST /monitoring/alerts/bulk/clear - Limpar alertas
router.post('/bulk/clear', AlertController.clearAlerts);

// POST /monitoring/alerts/settings - Salvar configurações
router.post('/settings', AlertController.saveAlertSettings);

// ========== PUT ROUTES ==========
// PUT /monitoring/alerts/:id - Atualizar alerta
router.put('/:id', AlertController.updateAlert);

// ========== DELETE ROUTES ==========
// DELETE /monitoring/alerts/:id - Excluir alerta
router.delete('/:id', AlertController.deleteAlert);



export default router;