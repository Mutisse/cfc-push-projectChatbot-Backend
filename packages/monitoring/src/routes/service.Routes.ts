import { Router } from 'express';
import ServiceController from '../controllers/ServiceController';

const router = Router();

// ========== GET ROUTES ==========
// GET /monitoring/services - Listar serviços
router.get('/', ServiceController.getServices);

// GET /monitoring/services/health - Saúde de todos serviços
router.get('/health', ServiceController.getServicesHealth);

// GET /monitoring/services/summary - Resumo de serviços
router.get('/summary', ServiceController.getServicesSummary);

// GET /monitoring/services/:id - Obter serviço por ID
router.get('/:id', ServiceController.getServiceById);

// GET /monitoring/services/:id/health - Testar saúde do serviço
router.get('/:id/health', ServiceController.testServiceHealth);

// GET /monitoring/services/:id/health/force - Forçar verificação de saúde
router.get('/:id/health/force', ServiceController.forceHealthCheck);

// GET /monitoring/services/:id/metrics - Métricas do serviço
router.get('/:id/metrics', ServiceController.getServiceMetricsPeriod);

// GET /monitoring/services/:id/logs - Logs do serviço
router.get('/:id/logs', ServiceController.getServiceLogs);

// GET /monitoring/services/:id/config - Configuração do serviço
router.get('/:id/config', ServiceController.getServiceConfiguration);

// GET /monitoring/services/:id/dependencies - Dependências do serviço
router.get('/:id/dependencies', ServiceController.getServiceDependencies);

// GET /monitoring/services/:id/report - Exportar relatório do serviço
router.get('/:id/report', ServiceController.exportServiceReport);

// GET /monitoring/services/export - Exportar todos serviços
router.get('/export', ServiceController.exportAllServices);

// ========== POST ROUTES ==========
// POST /monitoring/services - Criar serviço
router.post('/', ServiceController.createService);

// POST /monitoring/services/:id/test - Testar saúde
router.post('/:id/test', ServiceController.testServiceHealth);

// POST /monitoring/services/:id/check - Forçar verificação
router.post('/:id/check', ServiceController.forceHealthCheck);

// POST /monitoring/services/:id/restart - Reiniciar serviço
router.post('/:id/restart', ServiceController.restartService);

// POST /monitoring/services/:id/stop - Parar serviço
router.post('/:id/stop', ServiceController.stopService);

// POST /monitoring/services/:id/start - Iniciar serviço
router.post('/:id/start', ServiceController.startService);

// POST /monitoring/services/bulk/status - Atualizar status em massa
router.post('/bulk/status', ServiceController.bulkUpdateServicesStatus);

// ========== PUT ROUTES ==========
// PUT /monitoring/services/:id - Atualizar serviço
router.put('/:id', ServiceController.updateService);

// PUT /monitoring/services/:id/config - Atualizar configuração
router.put('/:id/config', ServiceController.updateServiceConfiguration);

// ========== DELETE ROUTES ==========
// DELETE /monitoring/services/:id - Excluir serviço
router.delete('/:id', ServiceController.deleteService);

// DELETE /monitoring/services/cleanup - Limpar serviços antigos
// Comente ou remova esta rota se não for usar
// router.delete('/cleanup', async (_req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Cleanup completed'
//   });
// });

export default router;