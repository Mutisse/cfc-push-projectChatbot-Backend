import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
      error: "UNAUTHORIZED",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const user = jwt.verify(token, config.JWT_SECRET) as any;
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
      error: "FORBIDDEN",
      timestamp: new Date().toISOString(),
    });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "UNAUTHORIZED",
        timestamp: new Date().toISOString(),
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
        error: "FORBIDDEN",
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: "API key required",
      error: "UNAUTHORIZED",
      timestamp: new Date().toISOString(),
    });
  }

  const apiKeys = config.API_KEY || "";
  const validKeys = apiKeys ? apiKeys.split(",") : [];

  if (!validKeys.includes(apiKey as string)) {
    return res.status(403).json({
      success: false,
      message: "Invalid API key",
      error: "FORBIDDEN",
      timestamp: new Date().toISOString(),
    });
  }

  next();
};
