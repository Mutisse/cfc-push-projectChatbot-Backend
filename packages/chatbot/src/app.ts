// src/app.ts - COM TODAS AS ROTAS REGISTRADAS
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import chatbotRoutes from './routes/index'; // Suas rotas principais
import analyticsRoutes from './routes/analyticsRoutes'; // Rotas de analytics

export class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    // 🛡️ Segurança
    this.app.use(helmet({
      contentSecurityPolicy: false, // Desabilitado para compatibilidade com Twilio
    }));
    
    // 🌐 CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    }));

    // 📝 Logging
    this.app.use(morgan('combined'));

    // 📦 Body parsing (CRÍTICO para Twilio webhook)
    this.app.use(express.urlencoded({ 
      extended: true,
      limit: '10mb',
      verify: (req: any, res, buf) => {
        req.rawBody = buf; // Preservar body original para validações
      }
    }));
    
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      }
    }));
  }

  private configureRoutes(): void {
    console.log('📁 Registrando rotas...');
    
    // 🚀 Rotas principais do chatbot
    this.app.use('/api/chatbot', chatbotRoutes);
    console.log('✅ Rotas do chatbot registradas: /api/chatbot');
    
    // 📊 Rotas de Analytics (protegidas por API Key)
    this.app.use('/api/analytics', analyticsRoutes);
    console.log('✅ Rotas de analytics registradas: /api/analytics');
    
    // 🎯 Rota raiz com documentação completa
    this.app.get('/', (req, res) => {
      res.json({
        message: '🏛️ CFC PUSH Chatbot API',
        version: '2.0.0',
        status: 'operational',
        timestamp: new Date().toISOString(),
        documentation: {
          chatbot: {
            webhook: 'POST /api/chatbot/webhook',
            health: 'GET /api/chatbot/health',
            diagnostics: 'GET /api/chatbot/diagnostics',
            status: 'GET /api/chatbot/status',
            cache: {
              stats: 'GET /api/chatbot/cache/stats',
              refresh: 'POST /api/chatbot/cache/refresh'
            },
            sessions: {
              list: 'GET /api/chatbot/sessions',
              stats: 'GET /api/chatbot/sessions/stats'
            },
            analytics: {
              current: 'GET /api/chatbot/analytics/current',
              database: 'GET /api/chatbot/analytics/database'
            },
            test: {
              message: 'POST /api/chatbot/test/message',
              menu: 'POST /api/chatbot/test/menu'
            },
            debug: {
              menus: 'GET /api/chatbot/debug/menus',
              rootMenus: 'GET /api/chatbot/debug/root-menus',
              menu: 'GET /api/chatbot/debug/menu/:id'
            },
            database: {
              info: 'GET /api/chatbot/database/info',
              cleanup: 'POST /api/chatbot/database/cleanup-sessions'
            }
          },
          analytics_api: {
            today: 'GET /api/analytics/today?apiKey=SEU_TOKEN',
            historical: 'GET /api/analytics/historical?days=7&apiKey=SEU_TOKEN',
            realtime: 'GET /api/analytics/realtime?apiKey=SEU_TOKEN',
            report: 'GET /api/analytics/report/YYYY-MM-DD?apiKey=SEU_TOKEN'
          }
        },
        authentication: {
          public: 'Todas as rotas /api/chatbot são públicas',
          protected: 'Rotas /api/analytics requerem API Key',
          api_key: 'Use header X-API-Key ou query parameter ?apiKey='
        }
      });
    });

    // 🔍 Rota de debug (apenas desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      this.app.get('/debug', (req, res) => {
        res.json({
          headers: req.headers,
          body: req.body,
          query: req.query,
          timestamp: new Date().toISOString()
        });
      });
      console.log('✅ Rota de debug registrada: /debug');
    }
    
    console.log('✅ Todas as rotas registradas com sucesso!');
  }

  private configureErrorHandling(): void {
    // 🚨 404 - Rota não encontrada
    this.app.use('*', (req, res) => {
      console.log(`❌ Rota não encontrada: ${req.method} ${req.originalUrl}`);
      res.status(404).json({
        success: false,
        error: 'Rota não encontrada',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        available_routes: {
          chatbot: '/api/chatbot/*',
          analytics: '/api/analytics/*',
          root: 'GET /'
        }
      });
    });

    // 🚨 Error handler global
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('🚨 Erro global:', {
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
      });
      
      res.status(error.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' 
          ? 'Erro interno do servidor' 
          : error.message,
        path: req.path,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          details: error.details || error.errors || error 
        })
      });
    });
  }

  public listen(port: number | string, callback?: () => void): void {
    this.app.listen(port, callback);
  }
}

// Exportar instância do app
export const appInstance = new App();
export const app = appInstance.app;