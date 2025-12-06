import http from 'http';
import { WebSocketServer } from 'ws';
import MonitoringApp from './app';
import config from './config';
import Database from '../src/database/Database'; // Importar a classe Database

class MonitoringServer {
  private app: typeof MonitoringApp;
  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private port: number;
  private nodeEnv: string;
  private database: Database;

  constructor() {
    // Valida e obtém APENAS do .env (via config)
    this.validateEnvironment();
    
    this.app = MonitoringApp;
    this.port = this.getPort();
    this.nodeEnv = this.getNodeEnv();
    this.database = Database.getInstance(); // Usar singleton
    this.setupProcessHandlers();
  }

  private validateEnvironment(): void {
    // Valida variáveis obrigatórias
    const requiredVars = ['PORT', 'NODE_ENV'];
    const missingVars = requiredVars.filter(
      varName => !process.env[varName] || process.env[varName]!.trim() === ''
    );

    if (missingVars.length > 0) {
      throw new Error(`❌ Variáveis de ambiente ausentes no .env: ${missingVars.join(', ')}`);
    }

    // Validações específicas
    const port = parseInt(process.env.PORT!);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error(`❌ PORT inválido no .env: ${process.env.PORT}`);
    }
  }

  private getPort(): number {
    return parseInt(process.env.PORT!);
  }

  private getNodeEnv(): string {
    return process.env.NODE_ENV!;
  }

  private setupProcessHandlers(): void {
    // Graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
    
    // Error handlers
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      this.gracefulShutdown();
    });
  }

  public async start(): Promise<void> {
    try {
      console.log('🚀 Starting CFC Monitoring Server...');
      console.log(`📋 Environment: ${this.nodeEnv}`);
      console.log(`🔧 Port: ${this.port}`);
      
      // 1. Conectar ao MongoDB usando a classe Database
      await this.database.connect();
      console.log(`✅ Database connected: ${process.env.MONGO_DB_NAME}`);
      
      // 2. Iniciar servidor HTTP
      await this.startHttpServer();
      console.log(`✅ HTTP Server: http://localhost:${this.port}`);
      
      // 3. Iniciar WebSocket (opcional)
      if (process.env.ENABLE_WEBSOCKET !== 'false') {
        this.startWebSocket();
        console.log('✅ WebSocket ready: ws://localhost:3000/api/v1/logs/realtime/ws');
      }
      
      this.displayServerInfo();
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      await this.gracefulShutdown();
    }
  }

  private displayServerInfo(): void {
    console.log('\n🎯 SERVER IS READY');
    console.log('====================================');
    console.log(`📊 Health:    http://localhost:${this.port}/health`);
    console.log(`📝 API Docs:  http://localhost:${this.port}/api/v1`);
    console.log(`🏠 Home:      http://localhost:${this.port}/`);
    console.log('====================================\n');
  }

  private async startHttpServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.getExpressApp().listen(this.port, () => {
          resolve();
        });
        
        this.server.on('error', reject);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  private startWebSocket(): void {
    if (!this.server) return;
    
    this.wss = new WebSocketServer({ 
      server: this.server,
      path: '/api/v1/logs/realtime/ws'
    });
    
    this.wss.on('connection', (ws) => {
      console.log('🔌 WebSocket: New connection');
      
      ws.send(JSON.stringify({ 
        type: 'welcome',
        message: 'Connected to Monitoring WebSocket',
        timestamp: new Date().toISOString()
      }));
      
      // Verificar status do banco via WebSocket
      ws.on('message', async (data) => {
        try {
          const message = data.toString();
          
          if (message === 'status') {
            const dbStatus = this.database.isConnectedToDB() ? 'connected' : 'disconnected';
            ws.send(JSON.stringify({
              type: 'database_status',
              status: dbStatus,
              timestamp: new Date().toISOString()
            }));
          }
        } catch (error) {
          console.error('WebSocket error:', error);
        }
      });
    });
  }

  // Mude de private para public para poder ser exportado
  public async gracefulShutdown(): Promise<void> {
    console.log('\n🛑 Graceful shutdown initiated...');
    
    try {
      // 1. Fechar WebSocket
      if (this.wss) {
        this.wss.close();
        console.log('✅ WebSocket closed');
      }
      
      // 2. Fechar servidor HTTP
      if (this.server) {
        this.server.close(() => {
          console.log('✅ HTTP server closed');
        });
      }
      
      // 3. Fechar conexão com banco usando a classe Database
      if (this.database.isConnectedToDB()) {
        await this.database.disconnect();
        console.log('✅ Database disconnected');
      }
      
      console.log('✅ Shutdown complete');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  // Método para verificar status
  public getStatus(): any {
    return {
      running: !!this.server,
      port: this.port,
      environment: this.nodeEnv,
      database: this.database.isConnectedToDB() ? 'connected' : 'disconnected',
      websocket: this.wss ? 'active' : 'inactive',
      uptime: process.uptime()
    };
  }
}

// Criar instância
const server = new MonitoringServer();

// Exportar métodos - AGORA FUNCIONA porque gracefulShutdown é public
export const start = () => server.start();
export const shutdown = () => server.gracefulShutdown();
export const status = () => server.getStatus();

// Iniciar se executado diretamente
if (require.main === module) {
  server.start();
}

export default server;