import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import config from "./config/app.config";
import {
  ipWhitelistMiddleware,
  productionGuardMiddleware,
  rateLimitMiddleware,
} from "./middlewares/securityMiddleware";
import routes from "./routes/indexRoutes";
import serverManager from "./services/serverManager";

const app = express();

// ========== MIDDLEWARES GLOBAIS ==========

// Segurança básica
app.use(
  helmet({
    contentSecurityPolicy: config.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// CONFIGURAÇÃO CORS SIMPLIFICADA E FUNCIONAL
const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Em desenvolvimento, permite tudo
    if (config.NODE_ENV === "development") {
      console.log(`🌐 CORS: Permitindo origem ${origin} (dev mode)`);
      return callback(null, true);
    }
    
    // Em produção, verifica as origens permitidas
    const allowedOrigins = Array.isArray(config.CORS_ORIGIN) 
      ? config.CORS_ORIGIN 
      : [config.CORS_ORIGIN];
    
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      console.log(`🌐 CORS: Origem bloqueada ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With",
    "X-Environment",  // ← ADICIONADO para permitir o header do frontend
    "X-Client"        // ← ADICIONADO para permitir o header do frontend
  ],
  exposedHeaders: [],
  maxAge: 86400, // 24 horas para cache de preflight
};

app.use(cors(corsOptions));

// Middleware adicional para garantir headers CORS (opcional)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Headers CORS explícitos
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Environment, X-Client");
  res.header("Access-Control-Allow-Credentials", "true");
  
  // Para preflight OPTIONS
  if (req.method === "OPTIONS") {
    console.log("🛰️  Preflight OPTIONS request recebida");
    console.log("Headers solicitados:", req.headers["access-control-request-headers"]);
    res.status(200).end();
    return;
  }
  
  next();
});

// Logging
const logDir = config.LOG_DIR;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Log em arquivo apenas em produção
if (config.NODE_ENV === "production") {
  const accessLogStream = fs.createWriteStream(
    path.join(logDir, "access.log"),
    { flags: "a" }
  );
  app.use(morgan("combined", { stream: accessLogStream }));
} else {
  app.use(morgan("dev"));
}

// Rate limiting em produção
if (config.NODE_ENV === "production") {
  app.use(rateLimitMiddleware());
}

// Whitelist de IPs em produção
app.use(ipWhitelistMiddleware);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ========== ROTAS ADMINISTRATIVAS (DESENVOLVIMENTO APENAS) ==========

if (config.NODE_ENV === "development") {
  // Middleware para rotas de desenvolvimento
  app.use("/admin", productionGuardMiddleware(["/admin"]));

  // Dashboard de administração
  app.get("/admin/dashboard", (req, res) => {
    res.json({
      title: "Development Dashboard",
      environment: config.NODE_ENV,
      servers: serverManager.getServerStatuses(),
      config: {
        appName: config.APP_NAME,
        host: config.HOST,
        port: config.PORT,
        requestTimeout: config.REQUEST_TIMEOUT,
      },
    });
  });

  // Rotas de debug
  app.get("/admin/debug", (req, res) => {
    res.json({
      headers: req.headers,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      userAgent: req.get("User-Agent"),
    });
  });
}

// ========== ROTAS DA API ==========

// Health check básico
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: config.APP_NAME,
    version: "1.0.0",
    environment: config.NODE_ENV,
    uptime: process.uptime(),
  });
});

// Status dos servidores (disponível em produção também)
app.get("/api/status", async (req, res) => {
  try {
    const status = await serverManager.checkAllServers();
    res.json(serverManager.generateReport());
  } catch (error) {
    res.status(500).json({
      error: "Failed to check server status",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Registrar todas as rotas da aplicação
app.use(routes);

// ========== HANDLERS DE ERRO ==========

// 404 - Não encontrado
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handler global
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("🚨 Global error handler:", err);

    const statusCode = (err as any).statusCode || 500;
    const message =
      config.NODE_ENV === "production" ? "Internal Server Error" : err.message;

    res.status(statusCode).json({
      error: "Internal Server Error",
      message,
      timestamp: new Date().toISOString(),
      ...(config.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
);

// ========== SHUTDOWN GRACEFUL ==========

const gracefulShutdown = () => {
  console.log("🛑 Received shutdown signal. Cleaning up...");

  // Parar verificações de saúde
  serverManager.stopHealthChecks();

  // Dar tempo para conexões terminarem
  setTimeout(() => {
    console.log("👋 Server shutdown complete");
    process.exit(0);
  }, 1000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

export default app;