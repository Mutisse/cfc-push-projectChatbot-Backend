// src/routes/analyticsRoutes.ts
import express from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';

const router = express.Router();
const analyticsController = new AnalyticsController();

// Middleware de autenticação básica
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers['x-api-key'] || req.query.apiKey;
  
  // Token simples - pode usar variável de ambiente depois
  const validToken = process.env.ANALYTICS_API_KEY || 'cfc2024analytics';
  
  if (token === validToken) {
    next();
  } else {
    res.status(401).json({ 
      success: false,
      error: 'Não autorizado. Token de API requerido.' 
    });
  }
};

// 🔒 Todas as rotas requerem autenticação
router.use(authenticate);

// 📊 Rotas de analytics
router.get('/today', (req, res) => analyticsController.getTodayStats(req, res));
router.get('/historical', (req, res) => analyticsController.getHistoricalStats(req, res));
router.get('/realtime', (req, res) => analyticsController.getRealTimeStats(req, res));
router.get('/report/:date', (req, res) => analyticsController.getReportByDate(req, res));

export default router;