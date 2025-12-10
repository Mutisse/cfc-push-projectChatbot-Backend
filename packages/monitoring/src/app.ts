// packages/monitoring/src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import config from "./config";

// Importar rotas
import alertRoutes from "./routes/alert.Routes";
import serviceRoutes from "./routes/service.Routes";
import metricRoutes from "./routes/metric.Routes";
import logRoutes from "./routes/log.Routes";
import dashboardRoutes from "./routes/dashboard.Routes";
import analysisRoutes from "./routes/analysis.Routes";

export class MonitoringApp {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // 1. Helmet para segurança
    this.app.use(
      helmet({
        contentSecurityPolicy: false,
      })
    );

    // 2. CORS
    const corsOptions = {
      origin: function (origin: any, callback: any) {
        // Em desenvolvimento, permite tudo
        if (config.NODE_ENV === "development") {
          return callback(null, true);
        }

        // Em produção, verifica as origens permitidas
        const allowedOrigins = config.CORS_ORIGIN.split(",");

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      optionsSuccessStatus: 200,
    };

    this.app.use(cors(corsOptions));

    // 3. Performance
    this.app.use(compression());

    // 4. Body parsers
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // 5. Logger básico
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    console.log("📁 Setting up API routes...");

    // ========== HEALTH & STATUS ==========
    this.app.get("/health", (_req, res) => {
      res.status(200).json({
        status: "healthy",
        service: "CFC Monitoring API",
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
      });
    });

    this.app.get("/status", (_req, res) => {
      res.json({
        name: config.APP_NAME,
        version: "1.0.0",
        status: "operational",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    });

    // ========== MONITORING API ROUTES ==========
    const monitoringRouter = express.Router();

    // Montar todas as rotas sob /monitoring
    monitoringRouter.use("/alerts", alertRoutes);
    monitoringRouter.use("/services", serviceRoutes);
    monitoringRouter.use("/metrics", metricRoutes);
    monitoringRouter.use("/logs", logRoutes);
    monitoringRouter.use("/dashboard", dashboardRoutes);
    monitoringRouter.use("/analysis", analysisRoutes);

    // Rota raiz da API de monitoramento
    monitoringRouter.get("/", (_req, res) => {
      res.json({
        success: true,
        message: "CFC Monitoring API",
        version: "1.0.0",
        endpoints: {
          api: {
            alerts: "/monitoring/alerts",
            services: "/monitoring/services",
            metrics: "/monitoring/metrics",
            logs: "/monitoring/logs",
            dashboard: "/monitoring/dashboard",
            analysis: "/monitoring/analysis",
          },
          health: "/health",
          status: "/status",
        },
      });
    });

    // Manter rotas originais também
    this.app.use("/monitoring", monitoringRouter);

    // ========== ROTA RAIZ ==========
    this.app.get("/", (_req, res) => {
      res.json({
        name: config.APP_NAME,
        description: "Monitoring and Alert System",
        version: "1.0.0",
        documentation: "/monitoring",
        health: "/health",
        status: "/status",
      });
    });

    // ========== 404 HANDLER ==========
    this.app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        error: "Route not found",
        path: req.originalUrl,
        method: req.method,
        availableRoutes: [
          "GET /",
          "GET /health",
          "GET /status",
          "GET /monitoring",
          "GET /monitoring/alerts",
          "GET /monitoring/services",
          "GET /monitoring/metrics",
          "GET /monitoring/logs",
          "GET /monitoring/dashboard",
          "GET /monitoring/analysis",
        ],
      });
    });

    // ========== ERROR HANDLER ==========
    this.app.use(
      (
        error: any,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
      ) => {
        console.error("❌ Error:", error);

        const status = error.status || 500;
        const message = error.message || "Internal server error";

        res.status(status).json({
          success: false,
          error: message,
          ...(config.NODE_ENV === "development" && { stack: error.stack }),
        });
      }
    );

    console.log("✅ All routes configured!");
  }

  public getExpressApp(): express.Application {
    return this.app;
  }
}
