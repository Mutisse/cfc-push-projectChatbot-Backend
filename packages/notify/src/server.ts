import mongoose from "mongoose";
import dotenv from "dotenv";
import { app } from "./app";

dotenv.config();

class Server {
  private port: number;

  constructor() {
    this.port = parseInt(process.env.PORT || "3002");
  }

  async start(): Promise<void> {
    try {
      console.log("\n" + "=".repeat(50));
      console.log("🚀 INICIANDO NOTIFICATIONS SERVICE");
      console.log("=".repeat(50));

      await this.connectDatabase();

      this.startServer();

      this.setupGracefulShutdown();
    } catch (error) {
      console.error("❌ ERRO FATAL:", error);
      process.exit(1);
    }
  }

  private async connectDatabase(): Promise<void> {
    console.log("🔌 Conectando ao MongoDB...");

    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/cfc_notify";

    try {
      await mongoose.connect(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log("✅ MongoDB CONECTADO!");

      mongoose.connection.on("error", (error) => {
        console.error("❌ Erro MongoDB:", error);
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ MongoDB desconectado");
      });
    } catch (error) {
      console.error("❌ Não foi possível conectar ao MongoDB:", error);
      throw error;
    }
  }

  private startServer(): void {
    app.listen(this.port, () => {
      console.log("\n" + "=".repeat(50));
      console.log(`✅ NOTIFICATIONS SERVICE RODANDO NA PORTA: ${this.port}`);
      console.log(`📅 Data: ${new Date().toLocaleDateString()}`);
      console.log(`⏰ Hora: ${new Date().toLocaleTimeString()}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || "development"}`);
      console.log("=".repeat(50));
      console.log("\n🎯 ENDPOINTS:");
      console.log(`   🩺 GET   http://localhost:${this.port}/health`);
      console.log(`   🏠 GET   http://localhost:${this.port}/`);
      console.log("\n🔔 Aguardando notificações...");
    });
  }

  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      console.log("\n🔴 Recebido sinal de desligamento...");

      try {
        await mongoose.connection.close();
        console.log("✅ MongoDB desconectado");
        console.log("✅ Servidor encerrado.");
        process.exit(0);
      } catch (error) {
        console.error("❌ Erro durante shutdown:", error);
        process.exit(1);
      }
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }
}

const server = new Server();
server.start().catch((error) => {
  console.error("❌ Falha ao iniciar servidor:", error);
  process.exit(1);
});
