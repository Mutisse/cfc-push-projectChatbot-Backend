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
import prayerRoutes from "./modules/prayers/routes/prayerRoutes";

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

    // ✅ CORS CORRIGIDO
    const corsOptions = {
      origin: (origin: string | undefined, callback: Function) => {
        // Permite requisições sem origem (como curl, server-to-server)
        if (!origin) return callback(null, true);

        const allowedOrigins =
          process.env.NODE_ENV === "development"
            ? [
                "http://localhost:9000", // Frontend local
                "http://localhost:8080", // Gateway local
                "http://localhost:3000", // Outros frontends
              ]
            : process.env.ALLOWED_ORIGINS?.split(",") || [];

        if (
          allowedOrigins.indexOf(origin) !== -1 ||
          process.env.NODE_ENV === "development"
        ) {
          callback(null, true);
        } else {
          console.warn(`⚠️  Origem bloqueada pelo CORS: ${origin}`);
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "x-environment",
        "x-debug-mode",
      ],
      credentials: true,
      maxAge: 86400,
    };

    this.app.use(cors(corsOptions));

    // ✅ CORREÇÃO: Handler para requisições HEAD com return explícito
    this.app.head("*", (req, res, next) => {
      if (req.path === "/") {
        console.log(`✅ HEAD / recebida - retornando 200`);
        res.status(200).end();
        return; // ✅ IMPORTANTE: return após end()
      }
      next(); // ✅ IMPORTANTE: chamar next() para outras rotas
    });

    // Logs
    this.app.use(morgan("dev"));

    // Logging customizado
    this.app.use((req, res, next) => {
      const start = Date.now();

      // Log apenas para DEBUG
      if (req.method !== "HEAD" || req.path !== "/") {
        console.log(`📥 ${req.method} ${req.url}`);
      }

      res.on("finish", () => {
        const duration = Date.now() - start;
        if (!(req.method === "HEAD" && req.path === "/")) {
          console.log(
            `📤 ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`
          );
        }
      });

      next();
    });

    // Body parsers
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  }

  private setupRoutes(): void {
    console.log("📁 Configurando rotas...");

    // ✅ 1. HEALTH CHECKS (incluindo HEAD)
    this.app.get("/health", (req, res) => {
      res.json({
        success: true,
        service: "CFC Management API",
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    this.app.head("/health", (req, res) => {
      res.status(200).end();
    });

    this.app.get("/api/management/health", (req, res) => {
      res.json({
        success: true,
        service: "CFC Management API",
        status: "healthy",
        timestamp: new Date().toISOString(),
        note: "Prefixed health endpoint",
      });
    });

    this.app.head("/api/management/health", (req, res) => {
      res.status(200).end();
    });

    // ✅ 2. ROTA RAIZ PARA HEAD REQUESTS (alternativa mais simples)
    this.app.head("/", (req, res) => {
      res.status(200).end();
    });

    // ✅ 3. ROTA GET / PARA INFO
    this.app.get("/", (req, res) => {
      res.json({
        message: "CFC Management API",
        version: "1.0.0",
        endpoints: {
          health: ["GET /health", "GET /api/management/health"],
          auth: "POST /api/management/auth/login",
          prayers: "GET /api/management/prayers",
          docs: "See /api/management/routes for all routes",
        },
      });
    });

    // ✅ 4. ROTAS DA APLICAÇÃO
    this.app.use("/api/management/auth", authRoutes);
    this.app.use("/api/management/prayers", prayerRoutes);
    this.app.use("/api/management/menus", menuRoutes);
    this.app.use("/api/management/welcome-message", welcomeMessageRoutes);
    this.app.use("/api/management/registrations", memberRoutes);
    this.app.use("/api/management/users", userRoutes);
    this.app.use("/api/management/analytics", analyticsRoutes);

    // ✅ 5. ROTA DE DEBUG DE ROTAS
    this.app.get("/api/management/routes", (req, res) => {
      const routes: Array<{ path: string; methods: string[] }> = [];

      const extractRoutes = (layer: any) => {
        if (layer.route) {
          routes.push({
            path: layer.route.path,
            methods: Object.keys(layer.route.methods).map((m) =>
              m.toUpperCase()
            ),
          });
        } else if (layer.name === "router" && layer.handle.stack) {
          layer.handle.stack.forEach(extractRoutes);
        }
      };

      this.app._router.stack.forEach(extractRoutes);

      res.json({
        success: true,
        routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
        total: routes.length,
        timestamp: new Date().toISOString(),
      });
    });

    // ✅ CORREÇÃO: 404 HANDLER com return explícito
    this.app.use("*", (req, res) => {
      console.log(`❌ Rota não encontrada: ${req.method} ${req.originalUrl}`);

      if (req.method === "HEAD") {
        // Para HEAD requests, apenas retorna 404 sem corpo
        res.status(404).end();
        return; // ✅ IMPORTANTE: return após end()
      }

      res.status(404).json({
        success: false,
        error: "Route not found",
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        suggestion: "Check /api/management/routes for available endpoints",
      });
      // Não precisa de return aqui, pois é o último handler
    });

    // ✅ CORREÇÃO: ERROR HANDLER com return explícito
    this.app.use(
      (
        error: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.error("🔥 Erro:", {
          message: error.message,
          url: req.url,
          method: req.method,
        });

        const status = error.status || 500;

        if (req.method === "HEAD") {
          res.status(status).end();
          return; // ✅ IMPORTANTE: return após end()
        }

        res.status(status).json({
          success: false,
          error: error.message || "Internal server error",
          ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
        });
        // Não precisa de return aqui, pois é o último handler
      }
    );
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default App;
