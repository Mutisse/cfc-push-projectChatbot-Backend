// src/routes/index.ts - VERSÃO LIMPA E OTIMIZADA
import { Router } from 'express';
import { healthController } from '../controllers/HealthController';
import { webhookController } from '../controllers/WebhookController';
import { sessionController } from '../controllers/SessionController';
import { cacheService } from '../services/CacheService';
import { analyticsService } from '../services/AnalyticsService';
import { menuRepository } from '../Repository/MenuRepository';
import { sessionRepository } from '../Repository/SessionRepository';
import { chatOrchestrator } from '../services/ChatOrchestrator';
import mongoose from 'mongoose';

const router = Router();

// ======================
// ROTAS PRINCIPAIS
// ======================

// Saúde do sistema
router.get('/health', healthController.healthCheck);
router.get('/diagnostics', healthController.diagnostics);

// Webhook WhatsApp (CRÍTICO)
router.post('/webhook', webhookController.handleWebhook);

// Sessões
router.get('/sessions', sessionController.getAllSessions);
router.get('/sessions/stats', sessionController.getStats);

// Cache
router.get('/cache/stats', handleCacheStats);
router.post('/cache/refresh', handleCacheRefresh);

// Analytics
router.get('/analytics/current', handleAnalyticsCurrent);
router.get('/analytics/database', handleAnalyticsDatabase);

// Testes
router.post('/test/message', handleTestMessage);
router.post('/test/menu', handleTestMenu);

// Debug
router.get('/debug/menus', handleDebugMenus);
router.get('/debug/root-menus', handleDebugRootMenus);
router.get('/debug/menu/:id', handleDebugMenu);

// Banco de dados
router.get('/database/info', handleDatabaseInfo);
router.post('/database/cleanup-sessions', handleDatabaseCleanup);

// Status completo (nova rota limpa)
router.get('/status', handleSystemStatus);

// Raiz
router.get('/', handleRoot);

// ======================
// HANDLERS ESPECÍFICOS
// ======================

async function handleCacheStats(req: any, res: any) {
  try {
    const cacheStats = cacheService.getCacheStats();
    const menuStats = await menuRepository.getStats();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      cache: cacheStats,
      database: menuStats
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleCacheRefresh(req: any, res: any) {
  try {
    const result = await cacheService.forceRefresh();
    
    res.json({
      success: result,
      message: result ? 'Cache recarregado' : 'Erro no cache',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

function handleAnalyticsCurrent(req: any, res: any) {
  try {
    const stats = analyticsService.getCurrentStats();
    
    res.json({
      success: true,
      analytics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleAnalyticsDatabase(req: any, res: any) {
  try {
    const sessionStats = await sessionRepository.getSessionStats();
    const menuStats = await menuRepository.getStats();
    
    res.json({
      success: true,
      sessions: sessionStats,
      menus: menuStats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleTestMessage(req: any, res: any) {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'phoneNumber e message obrigatórios' 
      });
    }
    
    const result = await chatOrchestrator.processMessage(phoneNumber, message);
    
    res.json({
      success: true,
      input: { phoneNumber, message },
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleTestMenu(req: any, res: any) {
  try {
    const { phoneNumber, menuNumber } = req.body;
    
    if (!phoneNumber || menuNumber === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'phoneNumber e menuNumber obrigatórios' 
      });
    }
    
    const result = await chatOrchestrator.processMessage(phoneNumber, menuNumber.toString());
    
    res.json({
      success: true,
      input: { phoneNumber, menuNumber },
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleDebugMenus(req: any, res: any) {
  try {
    await menuRepository.debugCollection();
    const cacheStats = cacheService.getCacheStats();
    const menuStats = await menuRepository.getStats();
    
    res.json({
      success: true,
      cache: cacheStats,
      database: menuStats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

function handleDebugRootMenus(req: any, res: any) {
  try {
    const rootMenus = cacheService.getRootMenus();
    
    res.json({
      success: true,
      count: rootMenus.length,
      menus: rootMenus.map(menu => ({
        id: menu._id,
        order: menu.order,
        title: menu.title,
        type: menu.type
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

function handleDebugMenu(req: any, res: any) {
  try {
    const menuId = req.params.id;
    const menu = cacheService.getMenuById(menuId);
    
    if (!menu) {
      return res.status(404).json({ 
        success: false, 
        message: `Menu ${menuId} não encontrado` 
      });
    }
    
    const submenus = cacheService.getSubmenus(menuId);
    
    res.json({
      success: true,
      menu: {
        id: menu._id,
        title: menu.title,
        type: menu.type,
        order: menu.order
      },
      submenus: submenus.map(sm => ({
        id: sm._id,
        title: sm.title,
        order: sm.order
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleDatabaseInfo(req: any, res: any) {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    res.json({
      success: true,
      database: {
        name: mongoose.connection.name,
        state: dbStates[dbState],
        host: mongoose.connection.host
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleDatabaseCleanup(req: any, res: any) {
  try {
    const cleaned = await sessionRepository.cleanupExpiredSessions();
    
    res.json({
      success: true,
      message: `${cleaned} sessões limpas`,
      cleanedCount: cleaned,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// ======================
// ROTA DE STATUS COMPLETA
// ======================

async function handleSystemStatus(req: any, res: any) {
  try {
    // Coleta dados em paralelo para performance
    const [
      cacheStats,
      sessionStats,
      menuStats
    ] = await Promise.all([
      Promise.resolve(cacheService.getCacheStats()),
      sessionRepository.getSessionStats(),
      menuRepository.getStats()
    ]);
    
    const analytics = analyticsService.getCurrentStats();
    const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState];
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      
      system: {
        uptime: Math.floor(process.uptime()),
        memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      },
      
      services: {
        database: dbState === 'connected' ? '✅' : '❌',
        cache: cacheStats.isLoaded ? '✅' : '❌',
        sessions: '✅',
        analytics: '✅'
      },
      
      metrics: {
        menus: {
          total: cacheStats.totalMenus,
          loaded: cacheStats.isLoaded
        },
        sessions: {
          active: sessionStats.activeSessions,
          today: sessionStats.todaySessions
        },
        messages: {
          today: analytics.totalMessages || 0,
          uniqueUsers: analytics.userRetention?.size || 0
        }
      }
    });
    
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

function handleRoot(req: any, res: any) {
  res.json({
    message: 'CFC PUSH Chatbot API',
    version: '2.0.0',
    endpoints: {
      health: 'GET /health',
      webhook: 'POST /webhook',
      status: 'GET /status',
      cache: 'GET /cache/stats',
      test: 'POST /test/message'
    },
    timestamp: new Date().toISOString()
  });
}

export default router;