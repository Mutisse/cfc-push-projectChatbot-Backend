import { Router } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { proxyLogger } from "../middlewares/proxyLogger";

const router = Router();

// ========== CONFIGURAÇÕES DOS 4 SERVIÇOS (DO .env) ==========

// Helper para validar URLs
const getServiceUrl = (
  envVar: string | undefined,
  defaultPort: number,
  defaultPath: string = ""
): string => {
  if (envVar) return envVar;

  const host =
    process.env.NODE_ENV === "production"
      ? process.env.HOST || "localhost"
      : "localhost";

  return `http://${host}:${defaultPort}${defaultPath}`;
};

// Configurações dos serviços com valores padrão
const proxyConfigs: Record<string, Options> = {
  chatbot: {
    target: getServiceUrl(process.env.CHATBOT_URL, 3000),
    changeOrigin: true,
    logLevel: process.env.NODE_ENV === "development" ? "debug" : "info",
    timeout: parseInt(process.env.PROXY_TIMEOUT || "30000"),
    proxyTimeout: parseInt(process.env.PROXY_TIMEOUT || "30000"),
    pathRewrite: {
      "^/api/chatbot": "",
    },
    // Corrigir o onProxyReq removendo a verificação bodyRead
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader("X-Gateway-Service", "chatbot");
      proxyReq.setHeader("X-Gateway-Timestamp", Date.now().toString());
      proxyReq.setHeader(
        "X-Forwarded-For",
        req.ip || req.socket.remoteAddress || ""
      );
      proxyReq.setHeader("X-Forwarded-Host", req.headers.host || "");

      // Adicionar API Key para serviços internos
      if (process.env.CHATBOT_API_KEY) {
        proxyReq.setHeader("X-API-Key", process.env.CHATBOT_API_KEY);
      }

      // Se for POST/PUT/PATCH e tiver body, enviar body corretamente
      if (
        req.method === "POST" ||
        req.method === "PUT" ||
        req.method === "PATCH"
      ) {
        if (req.body) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      proxyRes.headers["X-Gateway-Processed"] = "true";
      proxyRes.headers["X-Gateway-Service"] = "chatbot";
      proxyRes.headers["X-Gateway-Response-Time"] = Date.now().toString();
    },
    onError: (err, req, res) => {
      console.error("[PROXY ERROR] Chatbot:", err.message);

      // Log para audit
      if ((req as any).auditLogId) {
        // Atualizar log de auditoria se existir
      }

      res.status(502).json({
        error: "Bad Gateway",
        message: "Chatbot service is not responding",
        service: "chatbot",
        target: getServiceUrl(process.env.CHATBOT_URL, 3000),
        timestamp: new Date().toISOString(),
      });
    },
  },
  management: {
    target: getServiceUrl(process.env.MANAGEMENT_URL, 3003),
    changeOrigin: true,
    logLevel: process.env.NODE_ENV === "development" ? "debug" : "info",
    timeout: parseInt(process.env.PROXY_TIMEOUT || "30000"),
    proxyTimeout: parseInt(process.env.PROXY_TIMEOUT || "30000"),
    pathRewrite: {
      "^/api/management": "",
    },
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader("X-Gateway-Service", "management");
      proxyReq.setHeader("X-Gateway-Timestamp", Date.now().toString());
      proxyReq.setHeader(
        "X-Forwarded-For",
        req.ip || req.socket.remoteAddress || ""
      );
      proxyReq.setHeader("X-Forwarded-Host", req.headers.host || "");

      if (process.env.MANAGEMENT_API_KEY) {
        proxyReq.setHeader("X-API-Key", process.env.MANAGEMENT_API_KEY);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      proxyRes.headers["X-Gateway-Processed"] = "true";
      proxyRes.headers["X-Gateway-Service"] = "management";
      proxyRes.headers["X-Gateway-Response-Time"] = Date.now().toString();
    },
    onError: (err, req, res) => {
      console.error("[PROXY ERROR] Management:", err.message);
      res.status(502).json({
        error: "Bad Gateway",
        message: "Management service is not responding",
        service: "management",
        target: getServiceUrl(process.env.MANAGEMENT_URL, 3003),
        timestamp: new Date().toISOString(),
      });
    },
  },
  monitoring: {
    target: getServiceUrl(process.env.MONITORING_URL, 3004),
    changeOrigin: true,
    logLevel: process.env.NODE_ENV === "development" ? "debug" : "info",
    timeout: parseInt(process.env.PROXY_TIMEOUT || "30000"),
    proxyTimeout: parseInt(process.env.PROXY_TIMEOUT || "30000"),
    pathRewrite: {
      "^/api/monitoring": "",
    },
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader("X-Gateway-Service", "monitoring");
      proxyReq.setHeader("X-Gateway-Timestamp", Date.now().toString());
      proxyReq.setHeader(
        "X-Forwarded-For",
        req.ip || req.socket.remoteAddress || ""
      );
      proxyReq.setHeader("X-Forwarded-Host", req.headers.host || "");

      if (process.env.MONITORING_API_KEY) {
        proxyReq.setHeader("X-API-Key", process.env.MONITORING_API_KEY);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      proxyRes.headers["X-Gateway-Processed"] = "true";
      proxyRes.headers["X-Gateway-Service"] = "monitoring";
      proxyRes.headers["X-Gateway-Response-Time"] = Date.now().toString();
    },
    onError: (err, req, res) => {
      console.error("[PROXY ERROR] Monitoring:", err.message);
      res.status(502).json({
        error: "Bad Gateway",
        message: "Monitoring service is not responding",
        service: "monitoring",
        target: getServiceUrl(process.env.MONITORING_URL, 3004),
        timestamp: new Date().toISOString(),
      });
    },
  },
  notify: {
    target: getServiceUrl(process.env.NOTIFY_URL, 3002),
    changeOrigin: true,
    logLevel: process.env.NODE_ENV === "development" ? "debug" : "info",
    timeout: parseInt(process.env.PROXY_TIMEOUT || "30000"),
    proxyTimeout: parseInt(process.env.PROXY_TIMEOUT || "30000"),
    pathRewrite: {
      "^/api/notify": "",
    },
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader("X-Gateway-Service", "notify");
      proxyReq.setHeader("X-Gateway-Timestamp", Date.now().toString());
      proxyReq.setHeader(
        "X-Forwarded-For",
        req.ip || req.socket.remoteAddress || ""
      );
      proxyReq.setHeader("X-Forwarded-Host", req.headers.host || "");

      if (process.env.NOTIFY_API_KEY) {
        proxyReq.setHeader("X-API-Key", process.env.NOTIFY_API_KEY);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      proxyRes.headers["X-Gateway-Processed"] = "true";
      proxyRes.headers["X-Gateway-Service"] = "notify";
      proxyRes.headers["X-Gateway-Response-Time"] = Date.now().toString();
    },
    onError: (err, req, res) => {
      console.error("[PROXY ERROR] Notify:", err.message);
      res.status(502).json({
        error: "Bad Gateway",
        message: "Notify service is not responding",
        service: "notify",
        target: getServiceUrl(process.env.NOTIFY_URL, 3002),
        timestamp: new Date().toISOString(),
      });
    },
  },
};

// ========== VALIDAÇÃO DAS CONFIGURAÇÕES ==========

// Verificar se todos os targets estão definidos
Object.entries(proxyConfigs).forEach(([service, config]) => {
  if (!config.target) {
    console.error(
      `❌ ERRO CRÍTICO: Target não definido para o serviço ${service}`
    );
    throw new Error(`Target não definido para ${service}`);
  }
  console.log(`✅ Proxy configurado para ${service}: ${config.target}`);
});

// ========== CRIAR PROXIES COM LOGGING ==========

// Middleware para configurar os proxies dinamicamente
const setupProxy = (service: string, config: Options) => {
  return createProxyMiddleware({
    ...config,
    onProxyReq: (proxyReq, req, res) => {
      // Log inicial
      console.log(
        `[${service}] ${req.method} ${req.originalUrl} → ${config.target}`
      );

      // Executar callback original se existir
      if (typeof config.onProxyReq === "function") {
        (config.onProxyReq as any)(proxyReq, req, res);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Executar callback original se existir
      if (typeof config.onProxyRes === "function") {
        (config.onProxyRes as any)(proxyRes, req, res);
      }
    },
  });
};

// Configurar rotas de proxy
router.use(
  "/api/chatbot",
  proxyLogger("chatbot"),
  setupProxy("chatbot", proxyConfigs.chatbot)
);
router.use(
  "/api/management",
  proxyLogger("management"),
  setupProxy("management", proxyConfigs.management)
);
router.use(
  "/api/monitoring",
  proxyLogger("monitoring"),
  setupProxy("monitoring", proxyConfigs.monitoring)
);
router.use(
  "/api/notify",
  proxyLogger("notify"),
  setupProxy("notify", proxyConfigs.notify)
);

// ========== ROTA DE HEALTH ==========

router.get("/api/gateway/proxies/health", async (req, res) => {
  const services = [
    {
      name: "chatbot",
      url: `${getServiceUrl(process.env.CHATBOT_URL, 3000)}/health`,
      apiKey: process.env.CHATBOT_API_KEY,
    },
    {
      name: "management",
      url: `${getServiceUrl(process.env.MANAGEMENT_URL, 3003)}/health`,
      apiKey: process.env.MANAGEMENT_API_KEY,
    },
    {
      name: "monitoring",
      url: `${getServiceUrl(process.env.MONITORING_URL, 3004)}/health`,
      apiKey: process.env.MONITORING_API_KEY,
    },
    {
      name: "notify",
      url: `${getServiceUrl(process.env.NOTIFY_URL, 3002)}/health`,
      apiKey: process.env.NOTIFY_API_KEY,
    },
  ];

  const results = await Promise.allSettled(
    services.map(async (service) => {
      const startTime = Date.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(service.url, {
          method: "GET",
          headers: {
            ...(service.apiKey ? { "X-API-Key": service.apiKey } : {}),
            "User-Agent": "CFC-Gateway-Health-Check",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        const responseText = await response.text();

        return {
          name: service.name,
          status: response.ok ? "healthy" : "unhealthy",
          responseTime: duration,
          statusCode: response.status,
          url: service.url,
          ...(response.ok && responseText
            ? { details: JSON.parse(responseText) }
            : {}),
        };
      } catch (error: any) {
        return {
          name: service.name,
          status: "down",
          error: error.name === "AbortError" ? "Timeout (5s)" : error.message,
          responseTime: Date.now() - startTime,
          url: service.url,
        };
      }
    })
  );

  const servicesStatus = results.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : {
          name: "unknown",
          status: "error",
          error: "Check failed unexpectedly",
        }
  );

  // Verificar se todos os serviços estão saudáveis
  const allHealthy = servicesStatus.every(
    (service) => service.status === "healthy"
  );
  const gatewayStatus = allHealthy ? "healthy" : "degraded";

  res.status(allHealthy ? 200 : 207).json({
    timestamp: new Date().toISOString(),
    gateway: {
      status: gatewayStatus,
      port: process.env.PORT || 3001,
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
    },
    services: servicesStatus,
    summary: {
      total: servicesStatus.length,
      healthy: servicesStatus.filter((s) => s.status === "healthy").length,
      unhealthy: servicesStatus.filter((s) => s.status === "unhealthy").length,
      down: servicesStatus.filter((s) => s.status === "down").length,
      error: servicesStatus.filter((s) => s.status === "error").length,
    },
  });
});

// ========== ROTA DE CONFIGURAÇÃO ==========

router.get("/api/gateway/config", (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  // Configuração segura para exibição
  const config = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    gateway: {
      port: process.env.PORT || 3001,
      node_env: process.env.NODE_ENV,
      host: process.env.HOST || "localhost",
      request_timeout: process.env.REQUEST_TIMEOUT || "30000",
    },
    services: {
      chatbot: {
        url: getServiceUrl(process.env.CHATBOT_URL, 3000),
        hasApiKey: !!process.env.CHATBOT_API_KEY && !isProduction,
        status: "configured",
      },
      management: {
        url: getServiceUrl(process.env.MANAGEMENT_URL, 3003),
        hasApiKey: !!process.env.MANAGEMENT_API_KEY && !isProduction,
        status: "configured",
      },
      monitoring: {
        url: getServiceUrl(process.env.MONITORING_URL, 3004),
        hasApiKey: !!process.env.MONITORING_API_KEY && !isProduction,
        status: "configured",
      },
      notify: {
        url: getServiceUrl(process.env.NOTIFY_URL, 3002),
        hasApiKey: !!process.env.NOTIFY_API_KEY && !isProduction,
        status: "configured",
      },
    },
    mongodb: {
      connected: !!process.env.MONGODB_URI,
      database: process.env.MONGODB_URI
        ? process.env.MONGODB_URI.split("/").pop()?.split("?")[0]
        : null,
    },
    features: {
      audit_log: process.env.ENABLE_AUDIT_LOG === "true",
      rate_limiting: process.env.NODE_ENV === "production",
      cors_enabled: true,
    },
  };

  res.json(config);
});

// ========== ROTA DE STATUS DOS PROXIES ==========

router.get("/api/gateway/proxies/status", (req, res) => {
  const proxyStatuses = Object.entries(proxyConfigs).map(
    ([service, config]) => ({
      service,
      target: config.target,
      configured: !!config.target,
      timeout: config.timeout,
      pathRewrite: config.pathRewrite || "none",
    })
  );

  res.json({
    timestamp: new Date().toISOString(),
    proxies: proxyStatuses,
    total: proxyStatuses.length,
    configured: proxyStatuses.filter((p) => p.configured).length,
  });
});

export default router;
