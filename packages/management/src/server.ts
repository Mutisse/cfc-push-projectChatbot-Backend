import App from "./app";
import { database } from "./database/connection/dbconnection";
import { MenuSeeder } from "./database/seeders/menuSeeder";
import { RootAdminSeeder } from "./database/seeders/seedRootAdmin";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

class Server {
  private app: App;
  private port: number;
  private server: any;

  constructor() {
    this.app = new App();
    this.port = parseInt(process.env.PORT!);
    this.server = null;
  }

  public async start(): Promise<void> {
    try {
      console.log("🚀 Iniciando Management API...");

      // Conectar ao banco primeiro
      await database.connect();

      // ✅ EXECUTAR SEED AUTOMATICAMENTE SE NECESSÁRIO
      await this.runSeedsIfNeeded();

      // Depois iniciar servidor HTTP
      this.server = this.app.getApp().listen(this.port, () => {
        console.log("✅ Management API iniciada com sucesso!");
        console.log(`📍 Porta: ${this.port}`);
        console.log(`🌐 Ambiente: ${process.env.NODE_ENV || "development"}`);
        console.log(`📊 Database: ${database.getStatus()}`);
        console.log(`⏰ ${new Date().toLocaleString()}`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      console.error("❌ Falha ao iniciar o servidor:", error);
      process.exit(1);
    }
  }

  // ✅ NOVO MÉTODO: Executar seed automaticamente
  // src/server.ts - APENAS o método que precisa ser atualizado
  private async runSeedsIfNeeded(): Promise<void> {
    try {
      console.log("🌱 Verificando necessidade de seeds...");

      // 1. Seed de Menus
      const menuSeeder = new MenuSeeder();
      const shouldSeedMenus = await menuSeeder.shouldSeed();

      if (shouldSeedMenus) {
        console.log("📋 Executando seed de menus...");
        await menuSeeder.seed();
        console.log("✅ Seed de menus concluído!");
      } else {
        console.log("✅ Menus já estão populados.");
      }

      // 2. Seed do Admin Root (SEMPRE executar a verificação)
      console.log("🔍 Verificando admin root...");
      const adminSeeder = new RootAdminSeeder();
      await adminSeeder.seedRootAdmin();

      console.log("🎉 Todos os seeds verificados!");
    } catch (error) {
      console.error("❌ Erro ao executar seeds automáticos:", error);
    }
  }

  public async shutdown(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        console.log("⚠️ Servidor não está rodando");
        resolve();
        return;
      }

      console.log("🛑 Encerrando servidor...");

      this.server.close(async (err: any) => {
        if (err) {
          console.error("❌ Erro ao fechar servidor:", err);
          reject(err);
          return;
        }

        try {
          await database.disconnect();
          this.server = null;
          console.log("✅ Servidor encerrado com sucesso");
          resolve();
        } catch (error) {
          console.error("❌ Erro ao desconectar do banco:", error);
          reject(error);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error("⚠️ Forçando encerramento do servidor...");
        reject(new Error("Timeout ao encerrar servidor"));
      }, 10000);
    });
  }

  public async restart(): Promise<void> {
    console.log("🔄 Reiniciando servidor...");
    await this.shutdown();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.start();
  }

  private setupGracefulShutdown(): void {
    const shutdownHandler = async (signal: string) => {
      console.log(`\n${signal} recebido. Encerrando servidor graciosamente...`);
      await this.shutdown();
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
    process.on("SIGINT", () => shutdownHandler("SIGINT"));

    // Para desenvolvimento: reiniciar com nodemon
    process.on("SIGUSR2", async () => {
      console.log("\n🔄 Reinício por nodemon detectado...");
      await this.shutdown();
      process.exit(0);
    });
  }

  public getStatus(): string {
    return this.server ? "running" : "stopped";
  }

  public getPort(): number {
    return this.port;
  }
}

// Iniciar servidor se executado diretamente
if (require.main === module) {
  const server = new Server();
  server.start().catch(console.error);
}

export default Server;
