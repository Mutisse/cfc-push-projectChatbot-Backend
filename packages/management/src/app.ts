import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Importar rotas
import menuRoutes from "./modules/menuitems/routes/menuRoutes";
import welcomeMessageRoutes from "./modules/menuitems/routes/welcomeMessageRoutes";
import memberRoutes from "./modules/people/members/routes/memberRoutes";
import userRoutes from "./modules/people/users/Routes/userRoutes";
import authRoutes from "./modules/people/users/Routes/authRoutes";
import analyticsRoutes from "./modules/analytics/routes/analytics.Routes";

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Segurança básica
    this.app.use(helmet());

    // ✅ CORS COMPLETO E CORRIGIDO
    this.app.use(
      cors({
        origin:
          process.env.NODE_ENV === "development"
            ? "*"
            : process.env.ALLOWED_ORIGINS?.split(",") || [
                "http://localhost:9000",
              ],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Requested-With",
          "Accept",
          "x-environment",
          "x-debug-mode",
          "x-request-id",
          "Cache-Control",
          "Pragma",
        ],
        exposedHeaders: ["Content-Length", "X-Request-Id", "X-Total-Count"],
        credentials: true,
        maxAge: 86400,
        preflightContinue: false,
        optionsSuccessStatus: 200,
      })
    );

    // Logs HTTP simplificado
    this.app.use(morgan("dev"));

    // Logging simplificado (sem interferir com o body)
    this.app.use((req, res, next) => {
      const start = Date.now();
      console.log(`📥 ${req.method} ${req.url}`);

      res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(
          `📤 ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`
        );
      });

      next();
    });

    // ✅ BODY PARSER SIMPLIFICADO E FUNCIONAL
    this.app.use(
      express.json({
        limit: "10mb",
        strict: false,
      })
    );

    this.app.use(
      express.urlencoded({
        extended: true,
        limit: "10mb",
      })
    );

    // Handler para JSON malformado
    this.app.use(
      (
        error: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        if (error instanceof SyntaxError && "body" in error) {
          console.error("❌ JSON malformado recebido:", error.message);
          console.error("Body raw recebido:", req.body);
          res.status(400).json({
            success: false,
            message: "JSON malformado",
            error: error.message,
          });
          return;
        }
        next();
      }
    );
  }

  private setupRoutes(): void {
    console.log("📁 Configurando rotas...");

    // ✅ HEALTH CHECK PRINCIPAL
    this.app.get("/health", (req, res) => {
      res.json({
        success: true,
        service: "CFC Management API",
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
      });
    });

    // ✅ HEALTH CHECK COM PREFIXO
    this.app.get("/api/management/health", (req, res) => {
      res.json({
        success: true,
        service: "CFC Management API",
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        note: "Prefixed health endpoint",
      });
    });

    // Rotas públicas
    this.app.use("/api/management/auth", authRoutes);

    // Rotas protegidas
    this.app.use("/api/management/menus", menuRoutes);
    this.app.use("/api/management/welcome-message", welcomeMessageRoutes);
    this.app.use("/api/management/registrations", memberRoutes);
    this.app.use("/api/management/users", userRoutes);
    this.app.use("/api/management/analytics", analyticsRoutes);

    // ✅ ROTA DE TESTE PARA DEBUG
    this.app.put("/api/management/debug-test", (req, res) => {
      console.log("🔍 Debug Test Route - Body recebido:", req.body);
      res.json({
        success: true,
        message: "Debug route working",
        receivedBody: req.body,
        headers: req.headers,
      });
    });

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        message: "Rota não encontrada",
        path: req.originalUrl,
        method: req.method,
        availableRoutes: [
          "GET /health",
          "GET /api/management/health",
          "POST /api/management/auth/login",
          "GET /api/management/menus",
          "PUT /api/management/menus/:id",
          "GET /api/management/debug-test",
        ],
      });
    });

    // Error handler global
    this.app.use(
      (
        error: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.error("🔥 Erro global:", {
          message: error.message,
          stack: error.stack,
          url: req.url,
          method: req.method,
          body: req.body,
        });

        res.status(error.status || 500).json({
          success: false,
          message: "Erro interno do servidor",
          timestamp: new Date().toISOString(),
          ...(process.env.NODE_ENV === "development" && {
            error: error.message,
            stack: error.stack,
          }),
        });
      }
    );
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default App;
