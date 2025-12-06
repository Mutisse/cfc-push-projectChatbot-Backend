// src/modules/people/users/controllers/authController.ts
import { Request, Response } from 'express';
import { UserService } from '../../users/Service/userService';
import { JwtService } from '../../users/Service/jwtService';

export class AuthController {
  private userService: UserService;
  private jwtService: JwtService;

  constructor() {
    this.userService = new UserService();
    this.jwtService = new JwtService();
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { identifier, password } = req.body;
      
      if (!identifier || !password) {
        res.status(400).json({
          success: false,
          message: 'Identificador e password são obrigatórios'
        });
        return;
      }

      const user = await this.userService.validateCredentials(identifier, password);
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Credenciais inválidas'
        });
        return;
      }

      // Gerar token JWT
      const token = this.jwtService.generateToken(user);

      const userResponse = {
        _id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        gender: user.gender,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin
      };

      res.status(200).json({
        success: true,
        data: {
          user: userResponse,
          token,
          expiresIn: '7d'
        },
        message: 'Login realizado com sucesso'
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao fazer login'
      });
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      const newToken = this.jwtService.refreshToken(user);

      res.status(200).json({
        success: true,
        data: {
          token: newToken,
          expiresIn: '7d'
        },
        message: 'Token atualizado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao atualizar token'
      });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // Em um sistema mais complexo, aqui invalidaríamos o token
      // Por enquanto, o cliente apenas remove o token localmente
      
      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao fazer logout'
      });
    }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
        return;
      }

      const userResponse = {
        _id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        gender: user.gender,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.status(200).json({
        success: true,
        data: userResponse,
        message: 'Perfil recuperado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao buscar perfil'
      });
    }
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Password atual e nova password são obrigatórias'
        });
        return;
      }

      // Verificar password atual
      const isValid = await this.userService.validateCredentials(user.phoneNumber, currentPassword);
      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'Password atual incorreta'
        });
        return;
      }

      // Atualizar password
      await this.userService.changePassword(user._id, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password alterada com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao alterar password'
      });
    }
  };
}