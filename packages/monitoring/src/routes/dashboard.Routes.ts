// packages/monitoring/src/routes/dashboard.Routes.ts
import { Router } from "express";
import DashboardController from "../controllers/DashboardController";

const router = Router();

// ========== DASHBOARD ROUTES ==========
// GET /monitoring/dashboard - Dados completos do dashboard
router.get("/", DashboardController.getDashboardData);

// ========== SERVICES HEALTH ==========
// GET /monitoring/dashboard/services/health - Saúde de todos serviços
router.get("/services/health", DashboardController.getServicesHealth);

// GET /monitoring/dashboard/services/:serviceName/health - Saúde de serviço específico
router.get("/services/:serviceName/health", async (req, res) => {
  const { serviceName } = req.params;

  // Simulação - em produção, usar ServiceProxy
  res.status(200).json({
    success: true,
    message: `Health check for ${serviceName}`,
    data: {
      service: serviceName,
      status: "healthy",
      lastCheck: new Date().toISOString(),
      responseTime: Math.floor(Math.random() * 100) + 50,
      uptime: "99.9%",
    },
    timestamp: new Date().toISOString(),
  });
});

// POST /monitoring/dashboard/services/:serviceName/check - Forçar verificação
router.post(
  "/services/:serviceName/check",
  DashboardController.testServiceConnection
);

// GET /monitoring/dashboard/services/:serviceName/details - Detalhes do serviço
router.get(
  "/services/:serviceName/details",
  DashboardController.getServiceDetails
);

// ========== ALERTS ==========
// GET /monitoring/dashboard/alerts/recent - Alertas recentes
router.get("/alerts/recent", DashboardController.getRecentAlerts);

// ========== METRICS ==========
// GET /monitoring/dashboard/metrics/system - Métricas do sistema
router.get("/metrics/system", DashboardController.getSystemStatus);

// GET /monitoring/dashboard/metrics/performance - Métricas de performance
router.get("/metrics/performance", DashboardController.getPerformanceMetrics);

// GET /monitoring/dashboard/metrics/historical - Métricas históricas
router.get("/metrics/historical", DashboardController.getHistoricalMetrics);

// ========== STATS ==========
// GET /monitoring/dashboard/stats/daily - Estatísticas diárias
router.get("/stats/daily", DashboardController.getDailyStats);

// ========== STATUS ==========
// GET /monitoring/dashboard/status - Status geral do sistema
router.get("/status", DashboardController.getSystemStatus);

// ========== TEST ROUTES ==========
// GET /monitoring/dashboard/test - Testar todas as rotas
router.get("/test", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Dashboard API is working",
    endpoints: [
      "GET /",
      "GET /services/health",
      "GET /services/:serviceName/health",
      "POST /services/:serviceName/check",
      "GET /services/:serviceName/details",
      "GET /alerts/recent",
      "GET /metrics/system",
      "GET /metrics/performance",
      "GET /metrics/historical",
      "GET /stats/daily",
      "GET /status",
      "GET /test",
    ],
    timestamp: new Date().toISOString(),
  });
});

export default router;
