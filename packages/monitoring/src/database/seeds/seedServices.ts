// packages/monitoring/src/scripts/seedServices.ts
import Database from "../Database";
import dotenv from "dotenv";

// Carrega variáveis de ambiente
dotenv.config();

// APENAS OS 4 MICROSERVIÇOS REAIS + GATEWAY
const MICROSERVICES = [
  // 1. GATEWAY
  {
    name: "API Gateway",
    description: "Gateway central que roteia todas as requisições",
    type: "gateway",
    url: process.env.HOST || "http://localhost:8080",
    status: "healthy",
    environment: process.env.NODE_ENV || "development",
    category: "gateway",
    tags: ["gateway", "router", "proxy"],
    healthCheckEndpoint: "/api/gateway/proxies/health",
    config: { timeout: 10000, retryAttempts: 3, critical: true },
  },

  // 2. MANAGEMENT SERVICE
  {
    name: "Management Service",
    description: "API de gerenciamento de usuários e autenticação",
    type: "microservice",
    url: process.env.MANAGEMENT_URL || "http://localhost:7000",
    status: "healthy",
    environment: process.env.NODE_ENV || "development",
    category: "management",
    tags: ["management", "auth", "users"],
    healthCheckEndpoint: "/api/management/health",
    config: { timeout: 10000, retryAttempts: 3, critical: true },
  },

  // 3. MONITORING SERVICE
  {
    name: "Monitoring Service",
    description: "Sistema de monitoramento e métricas",
    type: "microservice",
    url: process.env.MONITORING_URL || "http://localhost:7001",
    status: "healthy",
    environment: process.env.NODE_ENV || "development",
    category: "monitoring",
    tags: ["monitoring", "metrics", "alerts"],
    healthCheckEndpoint: "/health",
    config: { timeout: 10000, retryAttempts: 3, critical: true },
  },

  // 4. NOTIFICATION SERVICE
  {
    name: "Notification Service",
    description: "Serviço de notificações push e email",
    type: "microservice",
    url: process.env.NOTIFY_URL || "https://notify-cdaq.onrender.com",
    status: "healthy",
    environment: "production",
    category: "notification",
    tags: ["notifications", "email", "push"],
    healthCheckEndpoint: "/health",
    config: { timeout: 15000, retryAttempts: 2, critical: false },
  },

  // 5. CHATBOT SERVICE
  {
    name: "Chatbot Service",
    description: "Serviço de IA para atendimento automático",
    type: "microservice",
    url: process.env.CHATBOT_URL || "https://chatbot-juke.onrender.com",
    status: "healthy",
    environment: "production",
    category: "ai",
    tags: ["chatbot", "ai", "assistant"],
    healthCheckEndpoint: "/api/chatbot/health",
    config: { timeout: 15000, retryAttempts: 3, critical: false },
  },
];

// Função principal
async function seedDatabase(): Promise<void> {
  const db = Database.getInstance();

  try {
    console.log("🔍 Verificando serviços...");

    // Conecta ao MongoDB
    await db.connect();
    if (!db.isConnectedToDB()) {
      throw new Error("❌ Não conectado ao MongoDB");
    }

    const connection = db.getConnection();
    const now = new Date();
    let added = 0;

    // Para CADA microserviço
    for (const service of MICROSERVICES) {
      // Verifica se JÁ EXISTE
      const exists = await connection.collection("services").findOne({
        name: service.name,
      });

      if (!exists) {
        // NÃO EXISTE → CRIA
        await connection.collection("services").insertOne({
          ...service,
          createdAt: now,
          updatedAt: now,
          lastHealthCheck: now,
          isMonitored: true,
        });

        console.log(`✅ Criado: ${service.name}`);
        added++;
      } else {
        console.log(`⚠️  Já existe: ${service.name}`);
      }
    }

    // RESULTADO
    console.log(`\n🎯 Resultado: ${added} novo(s) serviço(s) criado(s)`);
    const total = await connection.collection("services").countDocuments();
    console.log(`📊 Total no banco: ${total} serviço(s)`);
  } catch (error) {
    console.error("❌ Erro:", error);
    throw error;
  }
}

// Função para executar via linha de comando
async function runSeed() {
  try {
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error("❌ Falha no seed:", error);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  runSeed();
}

// Exporta APENAS UMA VEZ
export { seedDatabase, MICROSERVICES as sampleServices };
