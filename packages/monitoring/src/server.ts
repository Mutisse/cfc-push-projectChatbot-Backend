// packages/monitoring/src/server.ts
import http from 'http';
import { WebSocketServer } from 'ws';
import { MonitoringApp } from './app';  // ✅ CORRETO
import config from './config';
import Database from './database/Database'; // Caminho corrigido

class MonitoringServer {
  private app: MonitoringApp;
  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private database: Database;

  constructor() {
    this.app = new MonitoringApp();
    this.database = Database.getInstance();
    this.setupProcessHandlers();
  }

  private setupProcessHandlers(): void {
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
    
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      this.gracefulShutdown();
    });
  }

  public async start(): Promise<void> {
    try {
      console.log('🚀 Starting CFC Monitoring Server...');
      console.log(`📋 Environment: ${config.NODE_ENV}`);
      console.log(`🔧 Port: ${config.PORT}`);
      
      // 1. Conectar ao MongoDB
      await this.database.connect();
      console.log(`✅ Database connected: ${config.MONGO.DB_NAME}`);
      
      // 2. Iniciar servidor HTTP
      await this.startHttpServer();
      console.log(`✅ HTTP Server: http://localhost:${config.PORT}`);
      
      // 3. Iniciar WebSocket
      this.startWebSocket();
      console.log(`✅ WebSocket ready: ws://localhost:${config.PORT}/api/v1/logs/realtime/ws`);
      
      this.displayServerInfo();
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      await this.gracefulShutdown();
    }
  }

  private async startHttpServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.getExpressApp().listen(config.PORT, () => {
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

  private displayServerInfo(): void {
    console.log('\n🎯 SERVER IS READY');
    console.log('====================================');
    console.log(`📊 Health:    http://localhost:${config.PORT}/health`);
    console.log(`📝 API Docs:  http://localhost:${config.PORT}/monitoring`);
    console.log(`🏠 Home:      http://localhost:${config.PORT}/`);
    console.log('====================================\n');
  }

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
      
      // 3. Fechar conexão com banco
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

  public getStatus(): any {
    return {
      running: !!this.server,
      port: config.PORT,
      environment: config.NODE_ENV,
      database: this.database.isConnectedToDB() ? 'connected' : 'disconnected',
      websocket: this.wss ? 'active' : 'inactive',
      uptime: process.uptime()
    };
  }
}

// Criar instância
const server = new MonitoringServer();

// Exportar métodos
export const start = () => server.start();
export const shutdown = () => server.gracefulShutdown();
export const status = () => server.getStatus();

// Iniciar se executado diretamente
if (require.main === module) {
  server.start();
}

export default server;