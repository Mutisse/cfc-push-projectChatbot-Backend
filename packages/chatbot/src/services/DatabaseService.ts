import mongoose from "mongoose";

export const DatabaseService = {
  async connect(): Promise<void> {
    const uri = process.env.MONGODB_URI!;

    if (!uri) {
      throw new Error("MONGODB_URI não definida no .env");
    }

    console.log("🔌 Conectando ao MongoDB...");

    try {
      await mongoose.connect(uri);
      console.log("✅ MongoDB conectado DIRETAMENTE (chatbot autônomo)");
    } catch (error: any) {
      console.error("❌ ERRO CRÍTICO ao conectar MongoDB:", error.message);
      throw error;
    }
  },

  getConnectionStatus() {
    return {
      isConnected: mongoose.connection.readyState === 1,
      readyState: mongoose.connection.readyState,
      database: mongoose.connection.db?.databaseName || "N/A",
      // ✅ ADICIONAR ESTA LINHA:
      models: Object.keys(mongoose.models || {}),
    };
  },
};
