import { Router } from 'express';
import proxyRoutes from './proxyRoutes';
import eventRoutes from './eventRoutes';

const router = Router();

// ========== ROTAS DO GATEWAY ==========

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cfc-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: 4
  });
});

router.get('/', (req, res) => {
  res.json({
    message: '🏛️ CFC PUSH GATEWAY - 4 SERVIÇOS',
    version: '1.0.0',
    endpoints: {
      gateway: {
        health: 'GET /health',
        status: 'GET /api/status',
        events: 'POST /api/events'
      },
      services: {
        chatbot: {
          proxy: '/api/chatbot/*',
          target: 'localhost:3000',
          examples: ['GET /api/chatbot/health', 'POST /api/chatbot/webhook']
        },
        management: {
          proxy: '/api/management/*',
          target: 'localhost:3003',
          examples: ['GET /api/management/api/management/health']
        },
        monitoring: {
          proxy: '/api/monitoring/*',
          target: 'localhost:3004',
          examples: ['GET /api/monitoring/health']
        },
        notify: {
          proxy: '/api/notify/*',
          target: 'localhost:3002',
          examples: ['GET /api/notify/health', 'POST /api/notify/api/notifications']
        }
      }
    }
  });
});

// ========== MONTAR SUB-ROTAS ==========

router.use(proxyRoutes);      // Proxies para 4 serviços
router.use('/api', eventRoutes); // Rotas de orquestração

// 404 Handler
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    available_routes: {
      gateway: ['/health', '/'],
      services: [
        '/api/chatbot/*',
        '/api/management/*', 
        '/api/monitoring/*',
        '/api/notify/*'
      ],
      orchestration: ['POST /api/events', 'GET /api/status']
    }
  });
});

export default router;