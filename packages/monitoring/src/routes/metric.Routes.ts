import { Router } from 'express';
import MetricController from '../controllers/MetricController';

const router = Router();

// ========== GET ROUTES ==========
// GET /monitoring/metrics - Listar métricas (com filtros)
router.get('/', MetricController.getMetrics);

// GET /monitoring/metrics/realtime - Métricas em tempo real
router.get('/realtime', MetricController.getRealtimeMetrics);

// GET /monitoring/metrics/requests - Dados de requests
router.get('/requests', MetricController.getRequestsData);

// GET /monitoring/metrics/performance - Métricas de performance
router.get('/performance', MetricController.getPerformanceMetrics);

// GET /monitoring/metrics/distribution/http-methods - Distribuição HTTP
router.get('/distribution/http-methods', MetricController.getHttpMethodDistribution);

// GET /monitoring/metrics/distribution/status-codes - Distribuição status codes
router.get('/distribution/status-codes', MetricController.getStatusCodeDistribution);

// GET /monitoring/metrics/services - Métricas por serviço
router.get('/services', MetricController.getServiceMetrics);

// GET /monitoring/metrics/system - Métricas do sistema (frontend usa system-resources)
router.get('/system', MetricController.getSystemResourceMetrics);

// GET /monitoring/metrics/system-resources - Alias para system
router.get('/system-resources', MetricController.getSystemResourceMetrics);

// GET /monitoring/metrics/trends - Análise de tendências
router.get('/trends', MetricController.getTrendAnalysis);

// GET /monitoring/metrics/export - Exportar métricas
router.get('/export', MetricController.exportMetrics);

// ========== POST ROUTES ==========
// POST /monitoring/metrics - Criar métrica
router.post('/', MetricController.createMetric);

// POST /monitoring/metrics/batch - Criar métricas em lote
router.post('/batch', MetricController.createBatchMetrics);

// POST /monitoring/metrics/compare - Comparar serviços
router.post('/compare', MetricController.compareServices);

// POST /monitoring/metrics/reports/trends - Gerar relatório de tendências
router.post('/reports/trends', async (req, res) => {
  const { timeRange = '24h' } = req.body;
  res.status(200).json({
    success: true,
    message: `Trend report generated for ${timeRange}`,
    data: { timeRange, generatedAt: new Date().toISOString() }
  });
});

export default router;