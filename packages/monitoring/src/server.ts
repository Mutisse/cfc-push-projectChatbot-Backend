// packages/monitoring/src/server.ts
import http from "http";
import { WebSocketServer } from "ws";
import { MonitoringApp } from "./app";
import config from "./config";
import Database from "./database/Database";

// Variável para armazenar a função seedDatabase
let seedDatabase: any = null;

// Função para carregar o módulo de seed dinamicamente
/*async function loadSeedModule() {
  try {
    const module = await import("./database/seeds/seedServices");
    seedDatabase = module.seedDatabase;
  } catch (error) {
    console.warn(
      "⚠️  Módulo seedServices não encontrado:",
      (error as Error).message
    );
    seedDatabase = async () => {
      console.log("ℹ️  Seed não disponível");
    };
  }
}*/

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
    process.on("SIGTERM", () => this.gracefulShutdown());
    process.on("SIGINT", () => this.gracefulShutdown());

    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
      this.gracefulShutdown();
    });
  }

  private async initializeDatabase(): Promise<void> {
    try {
      console.log("🗄️  Inicializando banco de dados...");

      // 1. Verificar coleções básicas
      await this.checkDatabaseStructure();

      // 2. Verificar e popular serviços se necessário
      await this.checkAndSeedServices();
    } catch (error) {
      console.error("⚠️  Erro durante inicialização do banco:", error);
      console.log("ℹ️  Continuando inicialização...");
    }
  }

  private async checkDatabaseStructure(): Promise<void> {
    try {
      const connection = this.database.getConnection();

      console.log("📂 Verificando coleções essenciais...");

      // Coleções mínimas necessárias
      const essentialCollections = ["users", "services", "alerts", "metrics"];

      for (const collectionName of essentialCollections) {
        const collections = await connection.db
          .listCollections({
            name: collectionName,
          })
          .toArray();

        if (collections.length === 0) {
          console.log(`   ⚠️  Coleção não encontrada: ${collectionName}`);
          console.log(`   ℹ️  Execute: mongosh --file scripts/init-mongo.js`);
        } else {
          const count = await connection
            .collection(collectionName)
            .countDocuments();
          console.log(`   ✅ ${collectionName}: ${count} documentos`);
        }
      }
    } catch (error) {
      console.error("❌ Erro ao verificar estrutura:", error);
    }
  }

  private async checkAndSeedServices(): Promise<void> {
    try {
      // Só executa seed em desenvolvimento ou se explicitamente configurado
      const shouldSeed =
        config.NODE_ENV === "development" ||
        process.env.RUN_SEED_ON_START === "true";

      if (!shouldSeed) {
        console.log("🌱 Seed automático desabilitado para este ambiente");
        return;
      }

      console.log("🌱 Verificando necessidade de seed de serviços...");

      const connection = this.database.getConnection();

      // Verifica se a coleção services existe
      const collections = await connection.db
        .listCollections({
          name: "services",
        })
        .toArray();

      if (collections.length === 0) {
        console.log('❌ Coleção "services" não encontrada!');
        console.log("ℹ️  Execute primeiro: npm run db:setup");
        return;
      }

      // Verifica se já existem serviços
      const servicesCount = await connection
        .collection("services")
        .countDocuments();

      if (servicesCount > 0) {
        console.log(
          `✅ Banco já possui ${servicesCount} serviços. Seed não necessário.`
        );
        return;
      }

      console.log("📦 Banco vazio de serviços. Executando seed...");

      // Executar o seed de serviços
      if (seedDatabase) {
        await seedDatabase();
        console.log("✅ Seed de serviços executado com sucesso!");
      } else {
        console.log("❌ Função seedDatabase não disponível");
      }
    } catch (error) {
      console.error("❌ Erro durante seed de serviços:", error);
      console.log("ℹ️  Para configurar banco manualmente:");
      console.log("   1. npm run db:init   (executa init-mongo.js)");
      console.log("   2. npm run db:seed   (popula serviços)");
    }
  }

  public async start(): Promise<void> {
    try {
      console.log("🚀 Starting CFC Monitoring Server...");
      console.log(`📋 Environment: ${config.NODE_ENV}`);
      console.log(`🔧 Port: ${config.PORT}`);

      // Carregar módulo de seed antes de tudo
      //await loadSeedModule();

      // 1. Conectar ao MongoDB
      await this.database.connect();
      console.log(`✅ Database connected: ${config.MONGO.DB_NAME}`);

      // 2. Verificar estrutura e seed se necessário
      await this.initializeDatabase();

      // 3. Iniciar servidor HTTP
      await this.startHttpServer();
      console.log(`✅ HTTP Server: http://localhost:${config.PORT}`);

      // 4. Iniciar WebSocket
      this.startWebSocket();
      console.log(
        `✅ WebSocket ready: ws://localhost:${config.PORT}/api/v1/logs/realtime/ws`
      );

      this.displayServerInfo();
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      await this.gracefulShutdown();
    }
  }

  private async startHttpServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.getExpressApp().listen(config.PORT, () => {
          resolve();
        });

        this.server.on("error", reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  private startWebSocket(): void {
    if (!this.server) return;

    this.wss = new WebSocketServer({
      server: this.server,
      path: "/api/v1/logs/realtime/ws",
    });

    this.wss.on("connection", (ws) => {
      console.log("🔌 WebSocket: New connection");

      ws.send(
        JSON.stringify({
          type: "welcome",
          message: "Connected to Monitoring WebSocket",
          timestamp: new Date().toISOString(),
        })
      );

      ws.on("message", async (data) => {
        try {
          const message = data.toString();

          if (message === "status") {
            const dbStatus = this.database.isConnectedToDB()
              ? "connected"
              : "disconnected";
            ws.send(
              JSON.stringify({
                type: "database_status",
                status: dbStatus,
                timestamp: new Date().toISOString(),
              })
            );
          }
        } catch (error) {
          console.error("WebSocket error:", error);
        }
      });
    });
  }

  private displayServerInfo(): void {
    console.log("\n🎯 SERVER IS READY");
    console.log("====================================");
    console.log(`📊 Health:    http://localhost:${config.PORT}/health`);
    console.log(`📝 API Docs:  http://localhost:${config.PORT}/monitoring`);
    console.log(`🏠 Home:      http://localhost:${config.PORT}/`);
    console.log("====================================\n");
  }

  public async gracefulShutdown(): Promise<void> {
    console.log("\n🛑 Graceful shutdown initiated...");

    try {
      // 1. Fechar WebSocket
      if (this.wss) {
        this.wss.close();
        console.log("✅ WebSocket closed");
      }

      // 2. Fechar servidor HTTP
      if (this.server) {
        this.server.close(() => {
          console.log("✅ HTTP server closed");
        });
      }

      // 3. Fechar conexão com banco
      if (this.database.isConnectedToDB()) {
        await this.database.disconnect();
        console.log("✅ Database disconnected");
      }

      console.log("✅ Shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
      process.exit(1);
    }
  }

  public getStatus(): any {
    return {
      running: !!this.server,
      port: config.PORT,
      environment: config.NODE_ENV,
      database: this.database.isConnectedToDB() ? "connected" : "disconnected",
      websocket: this.wss ? "active" : "inactive",
      uptime: process.uptime(),
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
  server.start().catch((error) => {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  });
}

export default server;
