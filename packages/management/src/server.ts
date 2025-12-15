// CORREÇÃO: Importe a instância do app (não uma classe)
import app from "./app";
import { database } from "./database/connection/dbconnection";
import { MenuSeeder } from "./database/seeders/menuSeeder";
import { RootAdminSeeder } from "./database/seeders/seedRootAdmin";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

class Server {
  private port: number;
  private nodeEnv: string;
  private server: any;

  constructor() {
    // Validação das variáveis de ambiente obrigatórias
    this.validateEnvironment();

    this.port = this.getValidatedPort();
    this.nodeEnv = this.getValidatedNodeEnv();
    this.server = null;
  }

  private validateEnvironment(): void {
    // Variáveis obrigatórias
    const requiredVars = ["PORT", "NODE_ENV", "MONGODB_URI"];
    const missingVars = requiredVars.filter(
      (varName) => !process.env[varName] || process.env[varName]!.trim() === ""
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Variáveis de ambiente obrigatórias ausentes: ${missingVars.join(", ")}`
      );
    }
  }

  private getValidatedPort(): number {
    const portString = process.env.PORT!;
    const port = parseInt(portString);

    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error(`PORT inválido: ${portString}`);
    }

    return port;
  }

  private getValidatedNodeEnv(): string {
    return process.env.NODE_ENV!;
  }

  public async start(): Promise<void> {
    try {
      console.log("Iniciando Management API...");

      // Conectar ao banco primeiro
      await database.connect();

      // ✅ EXECUTAR SEED AUTOMATICAMENTE SE NECESSÁRIO
      await this.runSeedsIfNeeded();

      // Depois iniciar servidor HTTP
      // CORREÇÃO: app já é a instância do Express
      this.server = app.listen(this.port, () => {
        console.log(`✅ Management API rodando na porta: ${this.port}`);
        console.log(`🌐 Ambiente: ${this.nodeEnv}`);
        console.log(`📊 Database: ${database.getStatus()}`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      console.error("Falha ao iniciar o servidor:", error);
      process.exit(1);
    }
  }

  private async runSeedsIfNeeded(): Promise<void> {
    try {
      // 1. Seed de Menus
      const menuSeeder = new MenuSeeder();
      const shouldSeedMenus = await menuSeeder.shouldSeed();

      if (shouldSeedMenus) {
        await menuSeeder.seed();
      }

      // 2. Seed do Admin Root
      const adminSeeder = new RootAdminSeeder();
      await adminSeeder.seedRootAdmin();
    } catch (error) {
      console.error("Erro ao executar seeds:", error);
    }
  }

  public async shutdown(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      this.server.close(async (err: any) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          await database.disconnect();
          this.server = null;
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        reject(new Error("Timeout ao encerrar servidor"));
      }, 10000);
    });
  }

  public async restart(): Promise<void> {
    await this.shutdown();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await this.start();
  }

  private setupGracefulShutdown(): void {
    const shutdownHandler = async (signal: string) => {
      await this.shutdown();
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
    process.on("SIGINT", () => shutdownHandler("SIGINT"));
    process.on("SIGUSR2", async () => {
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

  public getNodeEnv(): string {
    return this.nodeEnv;
  }
}

// Validação global das variáveis de ambiente
const validateGlobalEnvironment = (): void => {
  const requiredVars = [
    "PORT",
    "NODE_ENV",
    "MONGODB_URI",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
  ];

  const missingVars = requiredVars.filter(
    (varName) => !process.env[varName] || process.env[varName]!.trim() === ""
  );

  if (missingVars.length > 0) {
    console.error(
      `Variáveis de ambiente obrigatórias ausentes: ${missingVars.join(", ")}`
    );
    process.exit(1);
  }

  // Validações específicas
  const port = parseInt(process.env.PORT!);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(`PORT inválido: ${process.env.PORT}`);
    process.exit(1);
  }

  const validEnvs = ["development", "production", "test"];
  if (!validEnvs.includes(process.env.NODE_ENV!)) {
    console.error(`NODE_ENV inválido: ${process.env.NODE_ENV}`);
    process.exit(1);
  }
};

// Executar validação global antes de iniciar
validateGlobalEnvironment();

// Iniciar servidor se executado diretamente
if (require.main === module) {
  const server = new Server();
  server.start().catch((error) => {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  });
}

export default Server;
