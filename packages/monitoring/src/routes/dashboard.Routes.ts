import { Router } from 'express';
import DashboardController from '../controllers/DashboardController';
import ServiceController from '../controllers/ServiceController';
import AlertController from '../controllers/AlertController';
import MetricController from '../controllers/MetricController';

const router = Router();

// ========== DASHBOARD ROUTES ==========
// GET /monitoring/dashboard - Dados completos do dashboard
router.get('/', DashboardController.getDashboardData);

// ========== SERVICES HEALTH ==========
// GET /monitoring/services/health - Saúde de todos serviços (já em service.Routes)
// Adicionamos aqui também para o dashboard
router.get('/services/health', ServiceController.getServicesHealth);

// GET /monitoring/services/:serviceName/health - Saúde de serviço específico
router.get('/services/:serviceName/health', async (req, res) => {
  const { serviceName } = req.params;
  // Aqui você precisa adaptar para buscar por nome, não por ID
  res.status(200).json({
    success: true,
    message: `Health check for ${serviceName}`,
    data: {
      name: serviceName,
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 100
    }
  });
});

// POST /monitoring/services/:serviceName/check - Forçar verificação
router.post('/services/:serviceName/check', async (req, res) => {
  const { serviceName } = req.params;
  res.status(200).json({
    success: true,
    message: `Forced health check for ${serviceName}`,
    data: {
      name: serviceName,
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 50
    }
  });
});

// ========== ALERTS ==========
// GET /monitoring/alerts/recent - Alertas recentes (já em alert.Routes)
router.get('/alerts/recent', AlertController.getRecentAlerts);

// DELETE /monitoring/alerts/clear - Limpar alertas
router.delete('/alerts/clear', AlertController.clearAlerts);

// ========== METRICS ==========
// GET /monitoring/metrics/system - Métricas do sistema (já em metric.Routes)
router.get('/metrics/system', MetricController.getSystemResourceMetrics);

// GET /monitoring/metrics/:serviceName/:metric - Métricas históricas
router.get('/metrics/:serviceName/:metric', async (req, res) => {
  const { serviceName, metric } = req.params;
  const { timeRange = '24h' } = req.query;
  
  res.status(200).json({
    success: true,
    message: `Historical metrics for ${serviceName}.${metric}`,
    data: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000),
      value: Math.random() * 100,
      service: serviceName,
      metric
    }))
  });
});

// ========== STATS ==========
// GET /monitoring/stats/daily - Estatísticas diárias
router.get('/stats/daily', DashboardController.getDailyStats);

// ========== STATUS ==========
// GET /monitoring/status - Status geral do sistema
router.get('/status', DashboardController.getSystemStatus);

export default router;