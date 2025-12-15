// src/routes/proxy-routes.ts
import { Router, Request, Response } from "express";
import {
  createProxyMiddleware,
  Options,
  RequestHandler,
} from "http-proxy-middleware";
import { proxyLogger } from "../middlewares/proxyLogger";
import type Server from "http-proxy-middleware/dist/types";

const router = Router();

// ========== MIDDLEWARE DE DEBUG ==========
router.use((req: Request, res: Response, next: any) => {
  const url = req.originalUrl;

  // Log todas as requisições para debugging
  if (url.includes("/prayers") || url.includes("/debug")) {
    console.log(`🔍 [GATEWAY-DEBUG-INCOMING] ${req.method} ${url}`);
    console.log(`🔍 [GATEWAY-DEBUG-HEADERS] Host: ${req.headers.host}`);
    console.log(
      `🔍 [GATEWAY-DEBUG-HEADERS] User-Agent: ${req.headers["user-agent"]}`
    );
  }

  next();
});

// ========== VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE ==========

const validateEnvironment = (): void => {
  const requiredEnvVars = [
    "PORT",
    "NODE_ENV",
    "HOST",
    "CHATBOT_URL",
    "MANAGEMENT_URL",
    "MONITORING_URL",
    "NOTIFY_URL",
    "PROXY_TIMEOUT",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `❌ Variáveis de ambiente ausentes: ${missingVars.join(", ")}`
    );
  }

  // Validar URLs
  const urlVars = [
    "CHATBOT_URL",
    "MANAGEMENT_URL",
    "MONITORING_URL",
    "NOTIFY_URL",
  ];
  urlVars.forEach((varName) => {
    const url = process.env[varName]!;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      throw new Error(`❌ ${varName} deve ser uma URL válida: ${url}`);
    }
  });

  // Validar números
  const numberVars = ["PORT", "PROXY_TIMEOUT"];
  numberVars.forEach((varName) => {
    const value = parseInt(process.env[varName]!);
    if (isNaN(value)) {
      throw new Error(
        `❌ ${varName} deve ser um número: ${process.env[varName]}`
      );
    }
  });
};

// Executar validação
try {
  validateEnvironment();
} catch (error: any) {
  console.error("❌ ERRO DE CONFIGURAÇÃO:", error.message);
  process.exit(1);
}

// ========== FUNÇÕES AUXILIARES ==========

const getRequiredString = (varName: string): string => {
  const value = process.env[varName];
  if (!value || value.trim() === "") {
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
  return process.env[varName]?.trim() || "";
};

// ========== INTERFACE PARA ERRO COM CÓDIGO ==========

interface ErrorWithCode extends Error {
  code?: string;
}

// ========== TIPAGEM PARA ONPROXYREQ ==========

type OnProxyReqFn = (
  proxyReq: any,
  req: Request,
  res: Response,
  options: Server.Options
) => void;

type OnProxyResFn = (proxyRes: any, req: Request, res: Response) => void;

// ========== CONFIGURAÇÕES DOS SERVIÇOS ==========

const proxyConfigs: Record<string, Options> = {
  // ========== CONFIGURAÇÃO PRAYERS (PRINCIPAL) ==========
  prayers: {
    target: getRequiredString("MANAGEMENT_URL"),
    changeOrigin: true,
    logLevel: process.env.NODE_ENV === "development" ? "debug" : "info",
    timeout: getRequiredNumber("PROXY_TIMEOUT"),
    proxyTimeout: getRequiredNumber("PROXY_TIMEOUT"),
    pathRewrite: {
      "^/prayers": "/api/management/prayers",
    },
    onProxyReq: (proxyReq, req, res, options) => {
      const originalUrl = req.originalUrl;
      const transformedUrl = originalUrl.replace(
        "/prayers",
        "/api/management/prayers"
      );

      console.log(`📿 [GATEWAY-PRAYER-PROXY] ${req.method} ${originalUrl}`);
      console.log(
        `📿 [GATEWAY-PRAYER-TRANSFORM] ${originalUrl} → ${transformedUrl}`
      );
      console.log(
        `📿 [GATEWAY-PRAYER-TARGET] ${getRequiredString("MANAGEMENT_URL")}`
      );

      proxyReq.setHeader("X-Gateway-Service", "prayers");
      proxyReq.setHeader("X-Gateway-Timestamp", Date.now().toString());
      proxyReq.setHeader(
        "X-Forwarded-For",
        req.ip || req.socket.remoteAddress || ""
      );
      proxyReq.setHeader("X-Forwarded-Host", req.headers.host || "");

      if (req.headers.authorization) {
        proxyReq.setHeader("Authorization", req.headers.authorization);
      }

      if (req.headers["content-type"]) {
        proxyReq.setHeader("Content-Type", req.headers["content-type"]);
      }

      if (
        req.method === "POST" ||
        req.method === "PUT" ||
        req.method === "PATCH" ||
        req.method === "DELETE"
      ) {
        if (req.body) {
          const bodyData = JSON.stringify(req.body);
          if (!proxyReq.getHeader("Content-Type")) {
            proxyReq.setHeader("Content-Type", "application/json");
          }
          proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
          console.log(`📦 [GATEWAY-PRAYER-BODY] ${bodyData.length} bytes`);
        }
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      const statusCode = proxyRes.statusCode || 0;
      const originalUrl = req.originalUrl;

      console.log(`✅ [GATEWAY-PRAYER-RESPONSE] ${statusCode} ${originalUrl}`);

      proxyRes.headers["X-Gateway-Processed"] = "true";
      proxyRes.headers["X-Gateway-Service"] = "prayers";
      proxyRes.headers["X-Gateway-Response-Time"] = Date.now().toString();

      if (statusCode === 200 || statusCode === 201) {
        console.log(`🟢 [GATEWAY-PRAYER-SUCCESS] ${originalUrl}`);
      } else if (statusCode >= 400) {
        console.log(`🔴 [GATEWAY-PRAYER-ERROR] ${statusCode} ${originalUrl}`);
      }
    },
    onError: (err, req, res) => {
      const errorWithCode = err as ErrorWithCode;
      const originalUrl = req.originalUrl;
      const target = getRequiredString("MANAGEMENT_URL");

      console.error("❌ [GATEWAY-PRAYER-FATAL]:", {
        message: errorWithCode.message,
        code: errorWithCode.code,
        url: originalUrl,
        target: target,
        method: req.method,
        timestamp: new Date().toISOString(),
      });

      res.status(502).json({
        success: false,
        error: "Bad Gateway",
        message: "Prayers service is not responding",
        service: "prayers",
        target: target,
        requestUrl: originalUrl,
        requestMethod: req.method,
        timestamp: new Date().toISOString(),
        gatewayError: errorWithCode.message,
        debug: {
          managementUrl: getRequiredString("MANAGEMENT_URL"),
          route: "/prayers",
          expectedPath: "/api/management/prayers",
        },
      });
    },
  },

  // ========== CONFIGURAÇÃO MANAGEMENT ==========
  management: {
    target: getRequiredString("MANAGEMENT_URL"),
    changeOrigin: true,
    logLevel: process.env.NODE_ENV === "development" ? "debug" : "info",
    timeout: getRequiredNumber("PROXY_TIMEOUT"),
    proxyTimeout: getRequiredNumber("PROXY_TIMEOUT"),
    pathRewrite: {
      "^/api/management": "/api/management",
    },
    onProxyReq: (proxyReq, req, res, options) => {
      // Excluir /prayers do proxy management para evitar conflito
      if (req.originalUrl.includes("/prayers")) {
        console.log(
          `⚠️ [GATEWAY-MANAGEMENT-SKIP] ${req.originalUrl} - Rota tratada por prayers proxy`
        );
        return;
      }

      proxyReq.setHeader("X-Gateway-Service", "management");
      proxyReq.setHeader("X-Gateway-Timestamp", Date.now().toString());
      proxyReq.setHeader(
        "X-Forwarded-For",
        req.ip || req.socket.remoteAddress || ""
      );
      proxyReq.setHeader("X-Forwarded-Host", req.headers.host || "");

      if (req.headers.authorization) {
        proxyReq.setHeader("Authorization", req.headers.authorization);
      }

      if (req.headers["content-type"]) {
        proxyReq.setHeader("Content-Type", req.headers["content-type"]);
      }

      const apiKey = getOptionalString("MANAGEMENT_API_KEY");
      if (apiKey) {
        proxyReq.setHeader("X-API-Key", apiKey);
      }

      if (
        req.method === "POST" ||
        req.method === "PUT" ||
        req.method === "PATCH"
      ) {
        if (req.body) {
          const bodyData = JSON.stringify(req.body);
          if (!proxyReq.getHeader("Content-Type")) {
            proxyReq.setHeader("Content-Type", "application/json");
          }
          proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      const statusCode = proxyRes.statusCode || 0;
      const originalUrl = req.originalUrl;

      console.log(`✅ [GATEWAY-MANAGEMENT] ${statusCode} ${originalUrl}`);

      proxyRes.headers["X-Gateway-Processed"] = "true";
      proxyRes.headers["X-Gateway-Service"] = "management";
      proxyRes.headers["X-Gateway-Response-Time"] = Date.now().toString();
    },
    onError: (err, req, res) => {
      const errorWithCode = err as ErrorWithCode;
      console.error("[PROXY ERROR] Management:", errorWithCode.message);
      res.status(502).json({
        error: "Bad Gateway",
        message: "Management service is not responding",
        service: "management",
        target: getRequiredString("MANAGEMENT_URL"),
        timestamp: new Date().toISOString(),
      });
    },
  },

  // ========== CONFIGURAÇÕES OUTROS SERVIÇOS ==========
  chatbot: {
    target: getRequiredString("CHATBOT_URL"),
    changeOrigin: true,
    logLevel: process.env.NODE_ENV === "development" ? "debug" : "info",
    timeout: getRequiredNumber("PROXY_TIMEOUT"),
    proxyTimeout: getRequiredNumber("PROXY_TIMEOUT"),
    pathRewrite: {
      "^/api/chatbot": "",
    },
    onProxyReq: (proxyReq, req, res, options) => {
      proxyReq.setHeader("X-Gateway-Service", "chatbot");
      proxyReq.setHeader("X-Gateway-Timestamp", Date.now().toString());
      proxyReq.setHeader(
        "X-Forwarded-For",
        req.ip || req.socket.remoteAddress || ""
      );
      proxyReq.setHeader("X-Forwarded-Host", req.headers.host || "");

      const apiKey = getOptionalString("CHATBOT_API_KEY");
      if (apiKey) {
        proxyReq.setHeader("X-API-Key", apiKey);
      }

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
      const statusCode = proxyRes.statusCode || 0;
      const originalUrl = req.originalUrl;

      console.log(`✅ [GATEWAY-CHATBOT] ${statusCode} ${originalUrl}`);

      proxyRes.headers["X-Gateway-Processed"] = "true";
      proxyRes.headers["X-Gateway-Service"] = "chatbot";
      proxyRes.headers["X-Gateway-Response-Time"] = Date.now().toString();
    },
    onError: (err, req, res) => {
      const errorWithCode = err as ErrorWithCode;
      console.error("[PROXY ERROR] Chatbot:", errorWithCode.message);
      res.status(502).json({
        error: "Bad Gateway",
        message: "Chatbot service is not responding",
        service: "chatbot",
        target: getRequiredString("CHATBOT_URL"),
        timestamp: new Date().toISOString(),
      });
    },
  },

  monitoring: {
    target: getRequiredString("MONITORING_URL"),
    changeOrigin: true,
    logLevel: process.env.NODE_ENV === "development" ? "debug" : "info",
    timeout: getRequiredNumber("PROXY_TIMEOUT"),
    proxyTimeout: getRequiredNumber("PROXY_TIMEOUT"),
    pathRewrite: {
      "^/api/monitoring": "/monitoring",
    },
    onProxyReq: (proxyReq, req, res, options) => {
      const originalUrl = req.originalUrl;
      const transformedUrl = originalUrl.replace(
        "/api/monitoring",
        "/monitoring"
      );

      console.log(
        `🎯 [GATEWAY-MONITORING] ${
          req.method
        } ${originalUrl} → ${getRequiredString(
          "MONITORING_URL"
        )}${transformedUrl}`
      );

      // ✅ CORREÇÃO: Usar variável de ambiente para definir o Origin
      // Pega a URL base do Gateway a partir do HOST e PORT
      const gatewayHost = getRequiredString("HOST");
      const gatewayPort = getRequiredString("PORT");
      const gatewayProtocol = process.env.NODE_ENV === "production" ? "https" : "http";
      
      // Constrói a URL do Gateway dinamicamente
      let gatewayOrigin: string;
      
      if (process.env.GATEWAY_URL) {
        // Se GATEWAY_URL estiver definida, usa ela
        gatewayOrigin = getOptionalString("GATEWAY_URL").trim();
      } else if (process.env.RENDER_EXTERNAL_URL) {
        // Se estiver no Render, usa a URL externa
        gatewayOrigin = getOptionalString("RENDER_EXTERNAL_URL").trim();
      } else {
        // Fallback: constrói a partir de HOST e PORT
        gatewayOrigin = `${gatewayProtocol}://${gatewayHost}:${gatewayPort}`;
      }
      
      // Remove trailing slash se existir
      gatewayOrigin = gatewayOrigin.replace(/\/$/, '');
      
      // Define o header Origin
      proxyReq.setHeader("Origin", gatewayOrigin);
      console.log(`🌐 [GATEWAY-MONITORING] Origin: ${gatewayOrigin}`);

      proxyReq.setHeader("X-Gateway-Service", "monitoring");
      proxyReq.setHeader("X-Gateway-Timestamp", Date.now().toString());
      proxyReq.setHeader(
        "X-Forwarded-For",
        req.ip || req.socket.remoteAddress || ""
      );
      proxyReq.setHeader("X-Forwarded-Host", req.headers.host || "");

      if (req.headers.authorization) {
        proxyReq.setHeader("Authorization", req.headers.authorization);
      }

      if (req.headers["content-type"]) {
        proxyReq.setHeader("Content-Type", req.headers["content-type"]);
      }

      const apiKey = getOptionalString("MONITORING_API_KEY");
      if (apiKey) {
        proxyReq.setHeader("X-API-Key", apiKey);
      }

      proxyReq.setHeader("X-Gateway-Debug-Original-URL", originalUrl);
      proxyReq.setHeader("X-Gateway-Debug-Transformed-URL", transformedUrl);

      if (
        req.method === "POST" ||
        req.method === "PUT" ||
        req.method === "PATCH"
      ) {
        if (req.body) {
          const bodyData = JSON.stringify(req.body);
          if (!proxyReq.getHeader("Content-Type")) {
            proxyReq.setHeader("Content-Type", "application/json");
          }
          proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
          console.log(
            `📦 [GATEWAY-MONITORING] Body enviado: ${bodyData.length} bytes`
          );
        }
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      const statusCode = proxyRes.statusCode || 0;
      const originalUrl = req.originalUrl;

      console.log(`✅ [GATEWAY-MONITORING] ${statusCode} ${originalUrl}`);

      proxyRes.headers["X-Gateway-Processed"] = "true";
      proxyRes.headers["X-Gateway-Service"] = "monitoring";
      proxyRes.headers["X-Gateway-Response-Time"] = Date.now().toString();

      if (statusCode === 200) {
        console.log(`🟢 [GATEWAY-MONITORING] Sucesso: ${originalUrl}`);
      } else if (statusCode >= 400) {
        console.log(
          `🔴 [GATEWAY-MONITORING] Erro ${statusCode}: ${originalUrl}`
        );
      }
    },
    onError: (err, req, res) => {
      const errorWithCode = err as ErrorWithCode;
      const originalUrl = req.originalUrl;
      const target = getRequiredString("MONITORING_URL");

      console.error("❌ [GATEWAY-MONITORING ERROR]:", {
        message: errorWithCode.message,
        code: errorWithCode.code,
        url: originalUrl,
        target: target,
        method: req.method,
        timestamp: new Date().toISOString(),
        stack: errorWithCode.stack,
      });

      res.status(502).json({
        success: false,
        error: "Bad Gateway",
        message: "Monitoring service is not responding",
        service: "monitoring",
        target: target,
        requestUrl: originalUrl,
        requestMethod: req.method,
        timestamp: new Date().toISOString(),
        gatewayError: errorWithCode.message,
      });
    },
  },

  notify: {
    target: getRequiredString("NOTIFY_URL"),
    changeOrigin: true,
    logLevel: process.env.NODE_ENV === "development" ? "debug" : "info",
    timeout: getRequiredNumber("PROXY_TIMEOUT"),
    proxyTimeout: getRequiredNumber("PROXY_TIMEOUT"),
    pathRewrite: {
      "^/api/notify": "",
    },
    onProxyReq: (proxyReq, req, res, options) => {
      proxyReq.setHeader("X-Gateway-Service", "notify");
      proxyReq.setHeader("X-Gateway-Timestamp", Date.now().toString());
      proxyReq.setHeader(
        "X-Forwarded-For",
        req.ip || req.socket.remoteAddress || ""
      );
      proxyReq.setHeader("X-Forwarded-Host", req.headers.host || "");

      const apiKey = getOptionalString("NOTIFY_API_KEY");
      if (apiKey) {
        proxyReq.setHeader("X-API-Key", apiKey);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      const statusCode = proxyRes.statusCode || 0;
      const originalUrl = req.originalUrl;

      console.log(`✅ [GATEWAY-NOTIFY] ${statusCode} ${originalUrl}`);

      proxyRes.headers["X-Gateway-Processed"] = "true";
      proxyRes.headers["X-Gateway-Service"] = "notify";
      proxyRes.headers["X-Gateway-Response-Time"] = Date.now().toString();
    },
    onError: (err, req, res) => {
      const errorWithCode = err as ErrorWithCode;
      console.error("[PROXY ERROR] Notify:", errorWithCode.message);
      res.status(502).json({
        error: "Bad Gateway",
        message: "Notify service is not responding",
        service: "notify",
        target: getRequiredString("NOTIFY_URL"),
        timestamp: new Date().toISOString(),
      });
    },
  },
};

// ========== CRIAR PROXIES ==========

const setupProxy = (service: string, config: Options): RequestHandler => {
  return createProxyMiddleware({
    ...config,
    onProxyReq: (proxyReq, req, res, options) => {
      console.log(
        `[${service}] ${req.method} ${req.originalUrl} → ${config.target}`
      );

      if (typeof config.onProxyReq === "function") {
        (config.onProxyReq as OnProxyReqFn)(proxyReq, req, res, options);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      if (typeof config.onProxyRes === "function") {
        (config.onProxyRes as OnProxyResFn)(proxyRes, req, res);
      }
    },
  });
};

// ========== ROTAS DE DEBUG E TESTE ==========

// Rota de debug do gateway
router.get("/gateway/debug", (req: Request, res: Response) => {
  console.log("🔍 Gateway debug endpoint acessado");
  res.json({
    success: true,
    message: "Gateway está funcionando",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    services: {
      management: {
        url: getRequiredString("MANAGEMENT_URL"),
        prayersRoute: "/prayers → /api/management/prayers",
        status: "configured",
      },
    },
  });
});

// Rota de teste específica para prayers
router.get("/prayers/debug", (req: Request, res: Response) => {
  console.log("🔍 /prayers/debug endpoint acessado");
  res.json({
    success: true,
    message: "Rota /prayers está registrada no gateway",
    proxyConfig: {
      target: proxyConfigs.prayers.target,
      pathRewrite: proxyConfigs.prayers.pathRewrite,
      timeout: proxyConfigs.prayers.timeout,
    },
    testUrls: {
      directBackend: `${getRequiredString(
        "MANAGEMENT_URL"
      )}/api/management/prayers?page=1&limit=5`,
      viaGateway: `http://localhost:${
        process.env.PORT || 8080
      }/prayers?page=1&limit=5`,
    },
  });
});

// Health check simples
router.get("/gateway/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "gateway",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ========== CONFIGURAR ROTAS DE PROXY (ORDEM CRÍTICA!) ==========

// 🔥 ORDEM CORRETA: Rotas específicas primeiro!

// 1. ROTA PRAYERS (ESPECÍFICA - DEVE VIR PRIMEIRO!)
router.use(
  "/prayers",
  proxyLogger("prayers"),
  setupProxy("prayers", proxyConfigs.prayers)
);

// 2. Rotas gerais (vêm depois)
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

// ========== ROTA FALLBACK PARA ERROS ==========

// Rota para capturar 404
router.use((req: Request, res: Response) => {
  console.log(
    `❌ [GATEWAY-404] Rota não encontrada: ${req.method} ${req.originalUrl}`
  );

  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `Route ${req.originalUrl} not found in gateway`,
    availableRoutes: [
      "/prayers/*",
      "/api/management/*",
      "/api/chatbot/*",
      "/api/monitoring/*",
      "/api/notify/*",
      "/gateway/debug",
      "/prayers/debug",
      "/gateway/health",
    ],
    timestamp: new Date().toISOString(),
  });
});

// ========== ROTA DE HEALTH DOS PROXIES ==========

router.get(
  "/api/gateway/proxies/health",
  async (req: Request, res: Response) => {
    const services = [
      {
        name: "chatbot",
        url: `${getRequiredString("CHATBOT_URL")}/api/chatbot/health`,
        apiKey: getOptionalString("CHATBOT_API_KEY"),
      },
      {
        name: "management",
        url: `${getRequiredString("MANAGEMENT_URL")}/api/management/health`,
        apiKey: getOptionalString("MANAGEMENT_API_KEY"),
      },
      {
        name: "monitoring",
        url: `${getRequiredString("MONITORING_URL")}/api/monitoring/health`,
        apiKey: getOptionalString("MONITORING_API_KEY"),
      },
      {
        name: "notify",
        url: `${getRequiredString("NOTIFY_URL")}/health`,
        apiKey: getOptionalString("NOTIFY_API_KEY"),
      },
      {
        name: "prayers",
        url: `${getRequiredString(
          "MANAGEMENT_URL"
        )}/api/management/prayers/health`,
        apiKey: getOptionalString("MANAGEMENT_API_KEY"),
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

    const allHealthy = servicesStatus.every(
      (service) => service.status === "healthy"
    );
    const gatewayStatus = allHealthy ? "healthy" : "degraded";

    res.status(allHealthy ? 200 : 207).json({
      timestamp: new Date().toISOString(),
      gateway: {
        status: gatewayStatus,
        port: getRequiredString("PORT"),
        environment: getRequiredString("NODE_ENV"),
        uptime: process.uptime(),
      },
      services: servicesStatus,
      summary: {
        total: servicesStatus.length,
        healthy: servicesStatus.filter((s) => s.status === "healthy").length,
        unhealthy: servicesStatus.filter((s) => s.status === "unhealthy")
          .length,
        down: servicesStatus.filter((s) => s.status === "down").length,
        error: servicesStatus.filter((s) => s.status === "error").length,
      },
    });
  }
);

// ========== ROTA DE CONFIGURAÇÃO ==========

router.get("/api/gateway/config", (req: Request, res: Response) => {
  try {
    // Determina a URL do Gateway dinamicamente
    let gatewayUrl: string;
    if (process.env.RENDER_EXTERNAL_URL) {
      gatewayUrl = getOptionalString("RENDER_EXTERNAL_URL");
    } else if (process.env.GATEWAY_URL) {
      gatewayUrl = getOptionalString("GATEWAY_URL");
    } else {
      const host = getRequiredString("HOST");
      const port = getRequiredString("PORT");
      const protocol = getRequiredString("NODE_ENV") === "production" ? "https" : "http";
      gatewayUrl = `${protocol}://${host}:${port}`;
    }

    const config = {
      timestamp: new Date().toISOString(),
      environment: getRequiredString("NODE_ENV"),
      gateway: {
        url: gatewayUrl,
        port: getRequiredString("PORT"),
        host: getRequiredString("HOST"),
        node_env: getRequiredString("NODE_ENV"),
        request_timeout: getRequiredString("PROXY_TIMEOUT"),
      },
      services: {
        chatbot: {
          url: getRequiredString("CHATBOT_URL"),
          hasApiKey: !!getOptionalString("CHATBOT_API_KEY"),
          healthEndpoint: "/api/chatbot/health",
        },
        management: {
          url: getRequiredString("MANAGEMENT_URL"),
          hasApiKey: !!getOptionalString("MANAGEMENT_API_KEY"),
          healthEndpoint: "/api/management/health",
          prayersProxy: {
            route: "/prayers",
            target: "/api/management/prayers",
            active: true,
          },
        },
        monitoring: {
          url: getRequiredString("MONITORING_URL"),
          hasApiKey: !!getOptionalString("MONITORING_API_KEY"),
          healthEndpoint: "/api/monitoring/health",
        },
        notify: {
          url: getRequiredString("NOTIFY_URL"),
          hasApiKey: !!getOptionalString("NOTIFY_API_KEY"),
          healthEndpoint: "/health",
        },
        prayers: {
          url: getRequiredString("MANAGEMENT_URL"),
          hasApiKey: !!getOptionalString("MANAGEMENT_API_KEY"),
          healthEndpoint: "/api/management/prayers/health",
          note: "Proxy para /prayers → /api/management/prayers",
          routeOrder: "FIRST (specific route before general routes)",
        },
      },
    };

    res.json(config);
  } catch (error: any) {
    res.status(500).json({
      error: "Erro ao obter configuração",
      message: error.message,
    });
  }
});

// ========== ROTA DE STATUS DOS PROXIES ==========

router.get("/api/gateway/proxies/status", (req: Request, res: Response) => {
  try {
    const proxyStatuses = Object.entries(proxyConfigs).map(
      ([service, config]) => ({
        service,
        target: config.target,
        configured: !!config.target,
        timeout: config.timeout,
        pathRewrite: config.pathRewrite
          ? Object.keys(config.pathRewrite)[0]
          : "none",
        pathRewriteTo: config.pathRewrite
          ? Object.values(config.pathRewrite)[0]
          : "none",
        order: service === "prayers" ? "FIRST" : "AFTER",
      })
    );

    res.json({
      timestamp: new Date().toISOString(),
      proxies: proxyStatuses,
      total: proxyStatuses.length,
      configured: proxyStatuses.filter((p) => p.configured).length,
      routeOrderWarning:
        "prayers MUST be before management in route registration",
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Erro ao obter status",
      message: error.message,
    });
  }
});

export default router;