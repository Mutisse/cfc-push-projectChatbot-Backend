// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Rotas (usando require para evitar problemas)
const authRoutes = require("./modules/people/users/Routes/authRoutes").default;
const userRoutes = require("./modules/people/users/Routes/userRoutes").default;
const menuRoutes = require("./modules/menuitems/routes/menuRoutes").default;
const welcomeMessageRoutes =
  require("./modules/menuitems/routes/welcomeMessageRoutes").default;
const memberRoutes =
  require("./modules/people/members/routes/memberRoutes").default;
const analyticsRoutes =
  require("./modules/analytics/routes/analytics.Routes").default;
const prayerRoutes = require("./modules/prayers/routes/prayerRoutes").default;

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health Check
app.get("/health", (req, res) => {
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
      auth: "POST /api/management/auth/login",
      prayers: "GET /api/management/prayers",
    },
  });
});

// Rotas da aplicação
app.use("/api/management/auth", authRoutes);
app.use("/api/management/prayers", prayerRoutes);
app.use("/api/management/menus", menuRoutes);
app.use("/api/management/welcome", welcomeMessageRoutes);
app.use("/api/management/registrations", memberRoutes);
app.use("/api/management/users", userRoutes);
app.use("/api/management/analytics", analyticsRoutes);

// 404 Handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Error Handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error("🔥 Erro:", error.message);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// CORREÇÃO: Adicionar método getApp() se não existir
(app as any).getApp = function () {
  return app;
};

export default app;
