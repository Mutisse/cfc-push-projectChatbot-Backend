import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Importações corretas usando ES6 modules
import authRoutes from "./modules/people/users/Routes/authRoutes";
import userRoutes from "./modules/people/users/Routes/userRoutes";
import menuRoutes from "./modules/menuitems/routes/menuRoutes";
import welcomeMessageRoutes from "./modules/menuitems/routes/welcomeMessageRoutes";
import memberRoutes from "./modules/people/members/routes/memberRoutes";
import analyticsRoutes from "./modules/analytics/routes/analytics.Routes";
import prayerRoutes from "./modules/prayers/routes/prayerRoutes";

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health Check - Mantenha ambos os endpoints para compatibilidade
app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "CFC Management API",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Endpoint específico para o frontend (com prefixo)
app.get("/api/management/health", (req, res) => {
  res.json({
    success: true,
    service: "CFC Management API",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Rota principal
app.get("/", (req, res) => {
  res.json({
    message: "CFC Management API",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      managementHealth: "GET /api/management/health",
      auth: "POST /api/management/auth/login",
      prayers: "GET /api/management/prayers",
      welcome: "GET /api/management/welcome/active",
      menus: "GET /api/management/menus",
      registrations: "GET /api/management/registrations",
      users: "GET /api/management/users",
      analytics: "GET /api/management/analytics"
    },
  });
});

// Rotas da aplicação com prefixo /api/management
app.use("/api/management/auth", authRoutes);
app.use("/api/management/prayers", prayerRoutes);
app.use("/api/management/menus", menuRoutes);
app.use("/api/management/welcome", welcomeMessageRoutes);
app.use("/api/management/registrations", memberRoutes);
app.use("/api/management/users", userRoutes);
app.use("/api/management/analytics", analyticsRoutes);

// 404 Handler - melhorado com informações de debug
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      "GET /health",
      "GET /api/management/health",
      "POST /api/management/auth/login",
      "GET /api/management/prayers",
      "GET /api/management/menus",
      "GET /api/management/welcome/active",
      "GET /api/management/registrations",
      "GET /api/management/users",
      "GET /api/management/analytics"
    ]
  });
});

// Error Handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("🔥 Erro:", error.message);
  console.error(error.stack);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack })
  });
});

export default app;