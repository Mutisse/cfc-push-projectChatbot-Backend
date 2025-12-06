// src/routes/index.ts - VERSÃO LIMPA E PRODUÇÃO
import { Router, Request, Response } from "express";
import { healthController } from "../controllers/HealthController";
import { webhookController } from "../controllers/WebhookController";
import { sessionController } from "../controllers/SessionController";
import { cacheService } from "../services/CacheService";
import { analyticsService } from "../services/AnalyticsService";
import { menuRepository } from "../Repository/MenuRepository";
import { sessionRepository } from "../Repository/SessionRepository";
import mongoose from "mongoose";

const router = Router();

// ======================
// 🎯 ROTAS PRINCIPAIS DE PRODUÇÃO
// ======================

// ✅ 1. Saúde do sistema (ESSENCIAL)
router.get("/health", (req: Request, res: Response) =>
  healthController.healthCheck(req, res)
);

// ✅ 2. Webhook WhatsApp (CRÍTICO)
router.post("/webhook", (req: Request, res: Response) =>
  webhookController.handleWebhook(req, res)
);

// ✅ 3. Status do sistema
router.get("/status", handleSystemStatus);

// ✅ 4. Estatísticas de sessões
router.get("/sessions/stats", (req: Request, res: Response) =>
  sessionController.getStats(req, res)
);

// ✅ 5. Cache management
router.get("/cache/stats", handleCacheStats);
router.post("/cache/refresh", handleCacheRefresh);

// ✅ 6. Analytics
router.get("/analytics/today", handleAnalyticsToday);

// ✅ 7. Rota raiz informativa
router.get("/", handleRoot);

// ======================
// 🛠️ HANDLERS ESSENCIAIS
// ======================

async function handleCacheStats(req: Request, res: Response): Promise<void> {
  try {
    const cacheStats = cacheService.getCacheStats();
    const menuStats = await menuRepository.getStats();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      cache: cacheStats,
      database: menuStats,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleCacheRefresh(req: Request, res: Response): Promise<void> {
  try {
    const result = await cacheService.forceRefresh();

    res.json({
      success: result,
      message: result
        ? "Cache recarregado com sucesso"
        : "Falha ao recarregar cache",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

function handleAnalyticsToday(req: Request, res: Response): void {
  try {
    const stats = analyticsService.getCurrentStats();

    res.json({
      success: true,
      analytics: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// ======================
// 📊 ROTA DE STATUS COMPLETA
// ======================

async function handleSystemStatus(req: Request, res: Response): Promise<void> {
  try {
    // Coleta dados em paralelo para performance
    const [cacheStats, sessionStats, menuStats] = await Promise.all([
      Promise.resolve(cacheService.getCacheStats()),
      sessionRepository.getSessionStats(),
      menuRepository.getStats(),
    ]);

    const analytics = analyticsService.getCurrentStats();
    const dbState = [
      "disconnected",
      "connected",
      "connecting",
      "disconnecting",
    ][mongoose.connection.readyState];

    res.json({
      success: true,
      timestamp: new Date().toISOString(),

      system: {
        service: "CFC Push Chatbot",
        uptime: Math.floor(process.uptime()),
        memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      },

      services: {
        database: dbState === "connected" ? "✅" : "❌",
        cache: cacheStats.isLoaded ? "✅" : "❌",
        sessions: "✅",
        analytics: "✅",
        webhook: "✅",
      },

      metrics: {
        menus: {
          total: cacheStats.totalMenus,
          loaded: cacheStats.isLoaded,
        },
        sessions: {
          active: sessionStats.activeSessions,
          today: sessionStats.todaySessions,
        },
        messages: {
          today: analytics.totalMessages || 0,
          uniqueUsers: analytics.userRetention?.size || 0,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

function handleRoot(req: Request, res: Response): void {
  res.json({
    message: "🤖 CFC PUSH Chatbot API",
    version: "2.0.0",
    description: "Sistema de atendimento automático via WhatsApp",
    endpoints: {
      health: "GET /health",
      webhook: "POST /webhook",
      status: "GET /status",
      analytics: "GET /analytics/today",
      cache: "GET /cache/stats",
    },
    timestamp: new Date().toISOString(),
  });
}

export default router;
