import { Router } from "express";
import proxyRoutes from "./proxyRoutes";
import eventRoutes from "./eventRoutes";

const router = Router();

// ========== ROTAS DO GATEWAY ==========

router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "cfc-gateway",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    services: 4,
  });
});

router.get("/", (req, res) => {
  // Obtém URLs do .env ou falha se não existirem
  const getRequiredUrl = (varName: string): string => {
    const url = process.env[varName];
    if (!url || url.trim() === "") {
      throw new Error(`❌ Variável obrigatória não definida: ${varName}`);
    }
    return url;
  };

  try {
    // URLs obrigatórias do .env
    const chatbotUrl = getRequiredUrl("CHATBOT_URL");
    const managementUrl = getRequiredUrl("MANAGEMENT_URL");
    const monitoringUrl = getRequiredUrl("MONITORING_URL");
    const notifyUrl = getRequiredUrl("NOTIFY_URL");

    res.json({
      message: "🏛️ CFC PUSH GATEWAY - 4 SERVIÇOS",
      version: "1.0.0",
      endpoints: {
        gateway: {
          health: "GET /health",
          status: "GET /api/status",
          events: "POST /api/events",
        },
        services: {
          chatbot: {
            proxy: "/api/chatbot/*",
            target: chatbotUrl,
            // ✅ CORRIGIDO: Usar rota correta do Chatbot
            health: "GET /api/chatbot/health",
            examples: ["GET /api/chatbot/health", "POST /api/chatbot/webhook"],
          },
          management: {
            proxy: "/api/management/*",
            target: managementUrl,
            // ⚠️ VERIFICAR: O Management tem qual rota de health?
            // Provavelmente: /api/management/health ou /health
            health: "GET /api/management/health",
            examples: ["GET /api/management/health"],
          },
          monitoring: {
            proxy: "/api/monitoring/*",
            target: monitoringUrl,
            health: "GET /api/monitoring/health",
            examples: ["GET /api/monitoring/health"],
          },
          notify: {
            proxy: "/api/notify/*",
            target: notifyUrl,
            health: "GET /api/notify/health",
            examples: [
              "GET /api/notify/health",
              "POST /api/notify/api/notifications",
            ],
          },
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Configuração incompleta",
      message: error.message,
      required_env_vars: [
        "CHATBOT_URL",
        "MANAGEMENT_URL",
        "MONITORING_URL",
        "NOTIFY_URL",
      ],
    });
  }
});

// ========== MONTAR SUB-ROTAS ==========

router.use(proxyRoutes); // Proxies para 4 serviços
router.use("/api", eventRoutes); // Rotas de orquestração

// 404 Handler
router.use("*", (req, res) => {
  res.status(404).json({
    error: "Rota não encontrada",
    available_routes: {
      gateway: ["/health", "/"],
      services: [
        "/api/chatbot/*",
        "/api/management/*",
        "/api/monitoring/*",
        "/api/notify/*",
      ],
      orchestration: ["POST /api/events", "GET /api/status"],
    },
  });
});

export default router;
