import { Router } from 'express';
import AnalysisController from '../controllers/AnalysisController';

const router = Router();

// ========== GET ROUTES ==========
// GET /monitoring/analysis/data - Dados de análise
router.get('/data', AnalysisController.getAnalysisData);

// GET /monitoring/analysis/chart-data - Dados do gráfico
router.get('/chart-data', AnalysisController.getChartData);

// GET /monitoring/analysis/heatmap - Dados de heatmap
router.get('/heatmap', AnalysisController.getHeatmapData);

// GET /monitoring/analysis/comparison - Dados comparativos
router.get('/comparison', AnalysisController.getComparisonData);

// GET /monitoring/analysis/report - Exportar relatório
router.get('/report', AnalysisController.exportAnalysisReport);

// ========== POST ROUTES ==========
// POST /monitoring/analysis/insights - Gerar insights
router.post('/insights', AnalysisController.generateInsights);

// POST /monitoring/analysis/insights/:id/execute - Executar ação do insight
router.post('/insights/:id/execute', AnalysisController.executeInsightAction);

// ========== PUT ROUTES ==========
// PUT /monitoring/analysis/settings - Atualizar configurações
router.put('/settings', AnalysisController.updateAnalysisSettings);

export default router;