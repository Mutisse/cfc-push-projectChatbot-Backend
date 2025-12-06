import { Router, Request, Response } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { proxyLogger } from "../middlewares/proxyLogger";

const router = Router();

// ========== VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE ==========

const validateEnvironment = (): void => {
  const requiredEnvVars = [
    'PORT',
    'NODE_ENV',
    'HOST',
    'CHATBOT_URL',
    'MANAGEMENT_URL',
    'MONITORING_URL',
    'NOTIFY_URL',
    'PROXY_TIMEOUT'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`❌ Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
  }

  // Validar URLs
  const urlVars = ['CHATBOT_URL', 'MANAGEMENT_URL', 'MONITORING_URL', 'NOTIFY_URL'];
  urlVars.forEach(varName => {
    const url = process.env[varName]!;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error(`❌ ${varName} deve ser uma URL válida: ${url}`);
    }
  });

  // Validar números
  const numberVars = ['PORT', 'PROXY_TIMEOUT'];
  numberVars.forEach(varName => {
    const value = parseInt(process.env[varName]!);
    if (isNaN(value)) {
      throw new Error(`❌ ${varName} deve ser um número: ${process.env[varName]}`);
    }
  });
};

// Executar validação
try {
  validateEnvironment();
} catch (error: any) {
  console.error('❌ ERRO DE CONFIGURAÇÃO:', error.message);
  process.exit(1);
}

// ========== FUNÇÕES AUXILIARES ==========

const getRequiredString = (varName: string): string => {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    throw new Error(`❌ Variável obrigatória não definida: ${varName}`);
  }
  return value.trim();
};

const getRequiredNumber = (varName: string): number => {
  const value = getRequiredString(varName);
  const num = parseInt(value);
  if (isNaN(num)) {
    throw new Error(`❌ Variável ${varName} deve ser um número: ${value}`);
  }
  return num;
};

const getOptionalString = (varName: string): string => {
  return process.env[varName]?.trim() || '';
};

// ========== CONFIGURAÇÕES DOS 4 SERVIÇOS (DO .env) ==========

const proxyConfigs: Record<string, Options> = {
  chatbot: {
    target: getRequiredString('CHATBOT_URL'),
    changeOrigin: true,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    timeout: getRequiredNumber('PROXY_TIMEOUT'),
    proxyTimeout: getRequiredNumber('PROXY_TIMEOUT'),
    pathRewrite: {
      "^/api/chatbot": "",
    },
    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader("X-Gateway-Service", "chatbot");
      proxyReq.setHeader("X-Gateway-Timestamp", Date.now().toString());
      proxyReq.setHeader(
        "X-Forwarded-For",
        req.ip || req.socket.remoteAddress || ""
      );
      proxyReq.setHeader("X-Forwarded-Host", req.headers.host || "");

      const apiKey = getOptionalString('CHATBOT_API_KEY');
      if (apiKey) {
        proxyReq.setHeader("X-API-Key", apiKey);
      }

      if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
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
      res.status(502).json({
        error: "Bad Gateway",
        message: "Chatbot service is not responding",
        service: "chatbot",
        target: getRequiredString('CHATBOT_URL'),
        timestamp: new Date().toISOString(),
      });
    },
  },
  management: {
    target: getRequiredString('MANAGEMENT_URL'),
    changeOrigin: true,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    timeout: getRequiredNumber('PROXY_TIMEOUT'),
    proxyTimeout: getRequiredNumber('PROXY_TIMEOUT'),
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

      const apiKey = getOptionalString('MANAGEMENT_API_KEY');
      if (apiKey) {
        proxyReq.setHeader("X-API-Key", apiKey);
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
        target: getRequiredString('MANAGEMENT_URL'),
        timestamp: new Date().toISOString(),
      });
    },
  },
  monitoring: {
    target: getRequiredString('MONITORING_URL'),
    changeOrigin: true,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    timeout: getRequiredNumber('PROXY_TIMEOUT'),
    proxyTimeout: getRequiredNumber('PROXY_TIMEOUT'),
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

      const apiKey = getOptionalString('MONITORING_API_KEY');
      if (apiKey) {
        proxyReq.setHeader("X-API-Key", apiKey);
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
        target: getRequiredString('MONITORING_URL'),
        timestamp: new Date().toISOString(),
      });
    },
  },
  notify: {
    target: getRequiredString('NOTIFY_URL'),
    changeOrigin: true,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    timeout: getRequiredNumber('PROXY_TIMEOUT'),
    proxyTimeout: getRequiredNumber('PROXY_TIMEOUT'),
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

      const apiKey = getOptionalString('NOTIFY_API_KEY');
      if (apiKey) {
        proxyReq.setHeader("X-API-Key", apiKey);
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
        target: getRequiredString('NOTIFY_URL'),
        timestamp: new Date().toISOString(),
      });
    },
  },
};

// ========== CRIAR PROXIES ==========

const setupProxy = (service: string, config: Options) => {
  return createProxyMiddleware({
    ...config,
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[${service}] ${req.method} ${req.originalUrl} → ${config.target}`);

      if (typeof config.onProxyReq === "function") {
        (config.onProxyReq as any)(proxyReq, req, res);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
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

router.get("/api/gateway/proxies/health", async (req: Request, res: Response) => {
  // ✅ CORRIGIDO: URLs de health corretas para cada serviço
  const services = [
    {
      name: "chatbot",
      // ✅ Chatbot usa /api/chatbot/health
      url: `${getRequiredString('CHATBOT_URL')}/api/chatbot/health`,
      apiKey: getOptionalString('CHATBOT_API_KEY'),
    },
    {
      name: "management",
      // ⚠️ Management: Verificar se é /health ou /api/management/health
      url: `${getRequiredString('MANAGEMENT_URL')}/health`,
      apiKey: getOptionalString('MANAGEMENT_API_KEY'),
    },
    {
      name: "monitoring",
      // ⚠️ Monitoring: Verificar se é /health ou /api/monitoring/health
      url: `${getRequiredString('MONITORING_URL')}/health`,
      apiKey: getOptionalString('MONITORING_API_KEY'),
    },
    {
      name: "notify",
      // ⚠️ Notify: Verificar se é /health ou /api/notify/health
      url: `${getRequiredString('NOTIFY_URL')}/health`,
      apiKey: getOptionalString('NOTIFY_API_KEY'),
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
          ...(response.ok && responseText ? { details: JSON.parse(responseText) } : {}),
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

  const allHealthy = servicesStatus.every((service) => service.status === "healthy");
  const gatewayStatus = allHealthy ? "healthy" : "degraded";

  res.status(allHealthy ? 200 : 207).json({
    timestamp: new Date().toISOString(),
    gateway: {
      status: gatewayStatus,
      port: getRequiredString('PORT'),
      environment: getRequiredString('NODE_ENV'),
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

router.get("/api/gateway/config", (req: Request, res: Response) => {
  try {
    const config = {
      timestamp: new Date().toISOString(),
      environment: getRequiredString('NODE_ENV'),
      gateway: {
        port: getRequiredString('PORT'),
        node_env: getRequiredString('NODE_ENV'),
        host: getRequiredString('HOST'),
        request_timeout: getRequiredString('PROXY_TIMEOUT'),
      },
      services: {
        chatbot: {
          url: getRequiredString('CHATBOT_URL'),
          hasApiKey: !!getOptionalString('CHATBOT_API_KEY'),
          healthEndpoint: '/api/chatbot/health',
        },
        management: {
          url: getRequiredString('MANAGEMENT_URL'),
          hasApiKey: !!getOptionalString('MANAGEMENT_API_KEY'),
          healthEndpoint: '/health', // ⚠️ Verificar correto
        },
        monitoring: {
          url: getRequiredString('MONITORING_URL'),
          hasApiKey: !!getOptionalString('MONITORING_API_KEY'),
          healthEndpoint: '/health', // ⚠️ Verificar correto
        },
        notify: {
          url: getRequiredString('NOTIFY_URL'),
          hasApiKey: !!getOptionalString('NOTIFY_API_KEY'),
          healthEndpoint: '/health', // ⚠️ Verificar correto
        },
      },
    };

    res.json(config);
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao obter configuração',
      message: error.message
    });
  }
});

// ========== ROTA DE STATUS DOS PROXIES ==========

router.get("/api/gateway/proxies/status", (req: Request, res: Response) => {
  try {
    const proxyStatuses = Object.entries(proxyConfigs).map(([service, config]) => ({
      service,
      target: config.target,
      configured: !!config.target,
      timeout: config.timeout,
      pathRewrite: config.pathRewrite || "none",
    }));

    res.json({
      timestamp: new Date().toISOString(),
      proxies: proxyStatuses,
      total: proxyStatuses.length,
      configured: proxyStatuses.filter((p) => p.configured).length,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Erro ao obter status',
      message: error.message
    });
  }
});

export default router;