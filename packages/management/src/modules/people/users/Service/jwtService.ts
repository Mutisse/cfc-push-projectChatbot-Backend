// src/modules/people/users/services/jwtService.ts
import jwt from "jsonwebtoken";
import { IUser } from "../interface/user.interface";

export class JwtService {
  private readonly secret: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || "cfcpush-super-secret-key-2024";

    if (!this.secret) {
      throw new Error("JWT_SECRET não configurado!");
    }

    console.log("✅ JWT Service configurado");
  }

  generateToken(user: IUser): string {
    try {
      const payload = {
        userId: user._id?.toString(),
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        status: user.status,
      };

      // ✅ SOLUÇÃO: Usar '7d' diretamente como string
      return jwt.sign(payload, this.secret, {
        expiresIn: "7d" as any, // Force type para evitar erro
        issuer: "CFC-Push-Management-API",
      });
    } catch (error) {
      console.error("❌ Erro ao gerar token:", error);
      throw new Error("Falha ao gerar token JWT");
    }
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error("Token inválido");
    }
  }

  refreshToken(user: IUser): string {
    return this.generateToken(user);
  }
}
