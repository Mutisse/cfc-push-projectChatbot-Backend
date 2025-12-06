import { Router } from 'express';
import LogController from '../controllers/LogController';

const router = Router();

// ========== GET ROUTES ==========
// GET /monitoring/logs - Listar logs
router.get('/', LogController.getSystemLogs);

// GET /monitoring/logs/stats - Estatísticas de logs
router.get('/stats', LogController.getLogsStats);

// GET /monitoring/logs/recent - Logs recentes
router.get('/recent', LogController.getRecentLogs);

// GET /monitoring/logs/errors - Logs de erro
router.get('/errors', LogController.getErrorLogs);

// GET /monitoring/logs/search - Buscar logs
router.get('/search', LogController.searchLogs);

// GET /monitoring/logs/export - Exportar logs
router.get('/export', LogController.exportLogs);

// GET /monitoring/logs/error-trend - Tendência de erros
router.get('/error-trend', LogController.getErrorTrend);

// GET /monitoring/logs/:id - Obter log por ID
router.get('/:id', LogController.getLogById);

// GET /monitoring/logs/service/:serviceId - Logs por serviço
router.get('/service/:serviceId', LogController.getLogsByService);

// ========== POST ROUTES ==========
// POST /monitoring/logs - Criar log
router.post('/', LogController.createLog);

// POST /monitoring/logs/batch - Criar logs em lote
router.post('/batch', LogController.createBatchLogs);

// POST /monitoring/logs/rotate - Rotacionar logs
router.post('/rotate', LogController.rotateLogs);

// ========== DELETE ROUTES ==========
// DELETE /monitoring/logs/cleanup - Limpar logs antigos
router.delete('/cleanup', async (req, res) => {
  const { daysToKeep = 30 } = req.query;
  const result = await LogController.rotateLogs(req, res);
  return result;
});

export default router;