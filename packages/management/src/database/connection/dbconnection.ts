import mongoose from "mongoose";

export class Database {
  private static instance: Database;
  private isConnected = false;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log("🔄 MongoDB já está conectado");
      return;
    }

    try {
      const MONGODB_URI = process.env.MONGODB_URI !;
      
      // MOSTRAR APENAS O NOME DA DATABASE
      const dbName = "cfc-push-chatbot";
      console.log(`🔗 Conectando ao MongoDB: ${dbName}`);
      
      await mongoose.connect(MONGODB_URI);
      this.isConnected = true;

      console.log("✅ Conectado ao MongoDB com sucesso!");
      console.log(`📊 Database: ${dbName}`);
    } catch (error) {
      console.error("❌ Erro ao conectar com MongoDB:", error);
      process.exit(1);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log("🔌 Desconectado do MongoDB");
    } catch (error) {
      console.error("❌ Erro ao desconectar do MongoDB:", error);
    }
  }

  getConnection(): mongoose.Connection {
    return mongoose.connection;
  }

  getStatus(): string {
    return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  }

  // Event listeners para monitorar a conexão
  setupEventListeners(): void {
    mongoose.connection.on("connected", () => {
      console.log("🔗 MongoDB conectado");
      this.isConnected = true;
    });

    mongoose.connection.on("error", (error) => {
      console.error("❌ Erro na conexão MongoDB:", error);
      this.isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("🔌 MongoDB desconectado");
      this.isConnected = false;
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB reconectado");
      this.isConnected = true;
    });
  }
}

export const database = Database.getInstance();