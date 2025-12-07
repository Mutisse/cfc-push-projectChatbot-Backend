// src/routes/analyticsRoutes.ts
import express, { Request, Response, NextFunction } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';

const router = express.Router();
const analyticsController = new AnalyticsController();

// Middleware de autenticação básica
const authenticate = (req: Request, res: Response, next: NextFunction): void => {
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
router.get('/today', (req: Request, res: Response) => analyticsController.getTodayStats(req, res));
router.get('/historical', (req: Request, res: Response) => analyticsController.getHistoricalStats(req, res));
router.get('/realtime', (req: Request, res: Response) => analyticsController.getRealTimeStats(req, res));
router.get('/report/:date', (req: Request, res: Response) => analyticsController.getReportByDate(req, res));

export default router;