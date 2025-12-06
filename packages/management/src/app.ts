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
            ? "*" // Aceita tudo em dev
            : process.env.ALLOWED_ORIGINS?.split(",") || [
                "http://localhost:9000",
              ],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Requested-With",
          "Accept",
          "x-environment", // ✅ Header personalizado do seu frontend
          "x-debug-mode", // ✅ Se usar modo debug
          "x-request-id", // ✅ Para rastreamento
          "Cache-Control", // ✅ Para controle de cache
          "Pragma", // ✅ Para compatibilidade
        ],
        exposedHeaders: [
          "Content-Length",
          "X-Request-Id",
          "X-Total-Count", // ✅ Para paginação
        ],
        credentials: true, // ✅ Permite cookies/sessões se necessário
        maxAge: 86400, // ✅ Cache de preflight por 24h
        preflightContinue: false, // ✅ O CORS cuida dos preflight
        optionsSuccessStatus: 200, // ✅ Status para OPTIONS bem-sucedidas
      })
    );

    // Logs
    this.app.use(morgan("dev"));

    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    console.log("📁 Configurando rotas...");

    // Rotas públicas
    this.app.use("/api/management/auth", authRoutes);

    // Rotas protegidas
    this.app.use("/api/management/menus", menuRoutes);
    this.app.use("/api/management/welcome-message", welcomeMessageRoutes);
    this.app.use("/api/management/registrations", memberRoutes);
    this.app.use("/api/management/users", userRoutes);
    this.app.use("/api/management/analytics", analyticsRoutes);

    // Health check simples
    this.app.get("/api/management/health", (req, res) => {
      res.json({
        success: true,
        message: "API funcionando",
        timestamp: new Date().toISOString(),
      });
    });

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({
        success: false,
        message: "Rota não encontrada",
      });
    });

    // Error handler simples
    this.app.use(
      (
        error: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.error("Erro:", error);
        res.status(500).json({
          success: false,
          message: "Erro interno",
        });
      }
    );
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default App;
