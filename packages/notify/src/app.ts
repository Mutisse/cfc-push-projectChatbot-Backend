import express from 'express';
import cors from 'cors';

export class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    this.app.use(cors());
    
    this.app.use(express.urlencoded({ 
      extended: true,
      limit: '10mb'
    }));
    
    this.app.use(express.json({ 
      limit: '10mb'
    }));

    this.app.use((req, res, next) => {
      console.log(`🌐 ${req.method} ${req.path} - ${new Date().toLocaleTimeString()}`);
      next();
    });
  }

  private configureRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: '✅ Notifications Service is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    this.app.get('/', (req, res) => {
      res.json({
        message: '🔔 CFC Push Notifications Service',
        version: '1.0.0',
        status: 'operational',
        timestamp: new Date().toISOString()
      });
    });
  }

  private configureErrorHandling(): void {
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Rota não encontrada',
        path: req.originalUrl,
        method: req.method
      });
    });

    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('🚨 Erro:', error.message);
      
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      });
    });
  }

  public getExpressApp(): express.Application {
    return this.app;
  }
}

export const appInstance = new App();
export const app = appInstance.getExpressApp();