// packages/monitoring/src/routes/metric.Routes.ts
import { Router } from "express";
import MetricController from "../controllers/MetricController";

const router = Router();

// ========== GET ROUTES ==========
// GET /monitoring/metrics - Listar métricas (com filtros)
router.get("/", (req, res) => MetricController.getMetrics(req, res));

// GET /monitoring/metrics/realtime - Métricas em tempo real
router.get("/realtime", (req, res) =>
  MetricController.getRealtimeMetrics(req, res)
);

// GET /monitoring/metrics/requests - Dados de requests
router.get("/requests", (req, res) =>
  MetricController.getRequestsData(req, res)
);

// GET /monitoring/metrics/performance - Métricas de performance
router.get("/performance", (req, res) =>
  MetricController.getPerformanceMetrics(req, res)
);

// GET /monitoring/metrics/distribution/http-methods - Distribuição HTTP
router.get("/distribution/http-methods", (req, res) =>
  MetricController.getHttpMethodDistribution(req, res)
);

// GET /monitoring/metrics/distribution/status-codes - Distribuição status codes
router.get("/distribution/status-codes", (req, res) =>
  MetricController.getStatusCodeDistribution(req, res)
);

// GET /monitoring/metrics/services - Métricas por serviço
router.get("/services", (req, res) =>
  MetricController.getServiceMetrics(req, res)
);

// GET /monitoring/metrics/system - Métricas do sistema
router.get("/system", (req, res) =>
  MetricController.getSystemResourceMetrics(req, res)
);

// GET /monitoring/metrics/system-resources - Alias para system
router.get("/system-resources", (req, res) =>
  MetricController.getSystemResourceMetrics(req, res)
);

// GET /monitoring/metrics/trends - Análise de tendências
router.get("/trends", (req, res) =>
  MetricController.getTrendAnalysis(req, res)
);

// GET /monitoring/metrics/export - Exportar métricas
router.get("/export", (req, res) => MetricController.exportMetrics(req, res));

// ========== POST ROUTES ==========
// POST /monitoring/metrics - Criar métrica
router.post("/", (req, res) => MetricController.createMetric(req, res));

// POST /monitoring/metrics/batch - Criar métricas em lote
router.post("/batch", (req, res) =>
  MetricController.createBatchMetrics(req, res)
);

// POST /monitoring/metrics/compare - Comparar serviços
router.post("/compare", (req, res) =>
  MetricController.compareServices(req, res)
);

// POST /monitoring/metrics/reports/trends - Gerar relatório de tendências
router.post("/reports/trends", async (req, res) => {
  const { timeRange = "24h" } = req.body;
  res.status(200).json({
    success: true,
    message: `Trend report generated for ${timeRange}`,
    data: { timeRange, generatedAt: new Date().toISOString() },
  });
});

export default router;
