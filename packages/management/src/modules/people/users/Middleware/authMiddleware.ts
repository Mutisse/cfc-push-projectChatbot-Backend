// src/modules/people/users/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { JwtService } from "../Service/jwtService";
import { UserService } from "../Service/userService";

export class AuthMiddleware {
  private jwtService: JwtService;
  private userService: UserService;

  constructor() {
    this.jwtService = new JwtService();
    this.userService = new UserService();
  }

  // MÉTODO NORMAL - não arrow function!
  async authenticate(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = this.extractToken(req);

      if (!token) {
        res.status(401).json({
          success: false,
          message: "Token de autenticação não fornecido",
        });
        return;
      }

      const decoded = this.jwtService.verifyToken(token);

      if (!decoded || !decoded.userId) {
        res.status(401).json({
          success: false,
          message: "Token inválido",
        });
        return;
      }

      const user = await this.userService.getUserById(decoded.userId);

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Usuário não encontrado",
        });
        return;
      }

      if (user.status !== "ativo") {
        res.status(401).json({
          success: false,
          message: "Usuário inativo",
        });
        return;
      }

      // Adicionar user ao request
      (req as any).user = {
        _id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        gender: user.gender,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      next();
    } catch (error) {
      console.error("❌ Erro na autenticação:", error);
      res.status(401).json({
        success: false,
        message: "Token inválido ou expirado",
      });
    }
  }

  // Método factory que retorna middleware
  authorize(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
        return;
      }

      if (!roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: `Acesso negado. Requer role: ${roles.join(", ")}`,
        });
        return;
      }

      next();
    };
  }

  // Middleware para verificar permissões específicas
  requirePermission(permission: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
        return;
      }

      if (user.role === "super_admin") {
        next();
        return;
      }

      const hasPermission = this.checkUserPermission(user, permission);

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: `Permissão negada: ${permission}`,
        });
        return;
      }

      next();
    };
  }

  // Middleware para usuários autenticados (qualquer role)
  requireAuth(req: Request, res: Response, next: NextFunction): void {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Autenticação necessária",
      });
      return;
    }

    next();
  }

  // Middleware para verificar se é super admin
  requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    if (user.role !== "super_admin") {
      res.status(403).json({
        success: false,
        message: "Acesso restrito a super administradores",
      });
      return;
    }

    next();
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    if (req.query.token) {
      return req.query.token as string;
    }

    if (req.cookies?.auth_token) {
      return req.cookies.auth_token;
    }

    return null;
  }

  private checkUserPermission(user: any, permission: string): boolean {
    const permissionMap: Record<string, string[]> = {
      super_admin: [
        "can_manage_users",
        "can_view_users",
        "can_manage_members",
        "can_view_members",
        "can_manage_registrations",
        "can_view_registrations",
        "can_manage_menus",
        "can_view_menus",
        "can_manage_welcome",
        "can_view_welcome",
        "can_manage_prayers",
        "can_view_prayers",
        "can_manage_services",
        "can_view_services",
        "can_view_dashboard",
        "can_view_reports",
        "can_export_data",
        "can_manage_settings",
        "can_view_audit",
      ],
      grupo_pastoral: [
        "can_view_users",
        "can_manage_members",
        "can_view_members",
        "can_manage_registrations",
        "can_view_registrations",
        "can_manage_menus",
        "can_view_menus",
        "can_manage_welcome",
        "can_view_welcome",
        "can_manage_prayers",
        "can_view_prayers",
        "can_manage_services",
        "can_view_services",
        "can_view_dashboard",
        "can_view_reports",
        "can_export_data",
        "can_view_audit",
      ],
      leader: [
        "can_view_users",
        "can_view_members",
        "can_view_registrations",
        "can_view_menus",
        "can_view_welcome",
        "can_manage_prayers",
        "can_view_prayers",
        "can_manage_services",
        "can_view_services",
        "can_view_dashboard",
        "can_view_reports",
      ],
    };

    const userPermissions = permissionMap[user.role] || [];
    return userPermissions.includes(permission);
  }

  // Método para obter usuário do request (helper)
  static getCurrentUser(req: Request): any {
    return (req as any).user;
  }

  // Método para verificar se usuário atual é o dono do recurso
  isResourceOwner(resourceUserIdField: string = "userId") {
    return (req: Request, res: Response, next: NextFunction): void => {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Usuário não autenticado",
        });
        return;
      }

      if (user.role === "super_admin") {
        next();
        return;
      }

      const resourceUserId =
        (req.params as any)[resourceUserIdField] ||
        (req.body as any)[resourceUserIdField];

      if (resourceUserId && resourceUserId !== user._id.toString()) {
        res.status(403).json({
          success: false,
          message: "Acesso negado. Você não é o proprietário deste recurso.",
        });
        return;
      }

      next();
    };
  }
}

// Exporte métodos individuais para facilitar o uso
export const authenticateMiddleware = new AuthMiddleware().authenticate.bind(
  new AuthMiddleware()
);
export const createAuthorizeMiddleware = (roles: string[]) =>
  new AuthMiddleware().authorize(roles);
export const createPermissionMiddleware = (permission: string) =>
  new AuthMiddleware().requirePermission(permission);

// Exporte também a instância completa se precisar
export const authMiddleware = new AuthMiddleware();
