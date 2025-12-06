// src/server.ts
import dotenv from "dotenv";
import app from "./app";
import config from "./config/app.config";
import serverManager from "./services/serverManager";
import mongodb from "./database/mongodb";

dotenv.config();

const PORT = config.PORT;
const HOST = config.HOST;

// Conectar ao MongoDB Atlas
async function startServer() {
  try {
    // Inicializar verificações de saúde
    serverManager.startHealthChecks();

    // Conectar ao MongoDB
    await mongodb.connect();

    app.listen(PORT, () => {
      console.log("\n" + "=".repeat(60));
      console.log(`🚀 ${config.APP_NAME.toUpperCase()}`);
      console.log("=".repeat(60));
      console.log(`📡 Porta: ${PORT}`);
      console.log(`🌍 Host: ${HOST}`);
      console.log(`⚙️  Ambiente: ${config.NODE_ENV}`);
      console.log(
        `🔒 Segurança: ${
          config.NODE_ENV === "production" ? "STRICT" : "DEVELOPMENT"
        }`
      );

      console.log("\n🔗 ENDPOINTS PRINCIPAIS:");
      console.log(`   🏠 Dashboard:      http://${HOST}:${PORT}/`);
      console.log(`   🩺 Health Check:   http://${HOST}:${PORT}/health`);
      console.log(`   📊 Server Status:  http://${HOST}:${PORT}/api/status`);
      console.log(
        `   🛠️  Management:     http://${HOST}:${PORT}/api/manage/servers`
      );

      if (config.NODE_ENV === "development") {
        console.log("\n🔧 ENDPOINTS DE DESENVOLVIMENTO:");
        console.log(
          `   📋 Admin Dashboard: http://${HOST}:${PORT}/admin/dashboard`
        );
        console.log(
          `   🐛 Debug Info:      http://${HOST}:${PORT}/admin/debug`
        );
      }

      console.log("\n🔀 SERVIÇOS MONITORADOS:");
      Object.entries(config.SERVERS).forEach(([key, server]) => {
        console.log(
          `   • ${server.name}: ${server.protocol}://${server.host}:${server.port}`
        );
      });

      console.log("\n🗄️  MONGODB ATLAS:");
      const dbStatus = mongodb.getConnectionStatus();
      console.log(
        `   • Status: ${
          dbStatus.connected ? "✅ CONECTADO" : "❌ DESCONECTADO"
        }`
      );
      if (dbStatus.database) {
        console.log(`   • Database: ${dbStatus.database}`);
      }

      console.log("\n✅ Servidor gerenciador pronto!");
      console.log(
        `📈 Health checks ativos a cada ${config.HEALTH_CHECK_INTERVAL / 1000}s`
      );
    });
  } catch (error) {
    console.error("❌ Falha ao iniciar servidor:", error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("🛑 Received shutdown signal. Cleaning up...");

  // Parar verificações de saúde
  serverManager.stopHealthChecks();

  // Desconectar MongoDB
  await mongodb.disconnect();

  // Dar tempo para conexões terminarem
  setTimeout(() => {
    console.log("👋 Server shutdown complete");
    process.exit(0);
  }, 1000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Iniciar servidor
startServer();
