// src/modules/people/users/controller/userController.ts
import { Request, Response } from "express";
import { UserService } from "../../users/Service/userService";
import { CreateUserDto, UpdateUserDto } from "../interface/user.interface";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // CREATE - Criar novo user
  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: CreateUserDto = req.body;

      const newUser = await this.userService.createUser(userData);

      const userResponse = {
        _id: newUser._id,
        phoneNumber: newUser.phoneNumber,
        email: newUser.email,
        gender: newUser.gender,
        role: newUser.role,
        status: newUser.status,
        lastLogin: newUser.lastLogin,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      };

      res.status(201).json({
        success: true,
        data: userResponse,
        message: "Usuário criado com sucesso",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao criar usuário",
      });
    }
  };

  // READ - Buscar user por ID
  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const user = await this.userService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
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
        updatedAt: user.updatedAt,
      };

      res.status(200).json({
        success: true,
        data: userResponse,
        message: "Usuário encontrado com sucesso",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao buscar usuário",
      });
    }
  };

  // READ - Buscar user por número de celular
  getUserByPhone = async (req: Request, res: Response): Promise<void> => {
    try {
      const { phoneNumber } = req.params;

      const user = await this.userService.getUserByPhoneNumber(phoneNumber);

      if (!user) {
        res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
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
        updatedAt: user.updatedAt,
      };

      res.status(200).json({
        success: true,
        data: userResponse,
        message: "Usuário encontrado com sucesso",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao buscar usuário",
      });
    }
  };

  // READ - Buscar user por email
  getUserByEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.params;

      const user = await this.userService.getUserByEmail(email);

      if (!user) {
        res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
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
        updatedAt: user.updatedAt,
      };

      res.status(200).json({
        success: true,
        data: userResponse,
        message: "Usuário encontrado com sucesso",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao buscar usuário",
      });
    }
  };

  // READ - Listar todos users
  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = "1", limit = "10", role, status } = req.query;

      const filters: { role?: string; status?: string } = {};
      if (role) filters.role = role as string;
      if (status) filters.status = status as string;

      const result = await this.userService.getUsers(
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );

      res.status(200).json({
        success: true,
        data: {
          users: result.data,
          pagination: {
            page: result.page,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.page < result.totalPages,
            hasPrev: result.page > 1,
          },
        },
        message: "Usuários recuperados com sucesso",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao buscar usuários",
      });
    }
  };

  // UPDATE - Atualizar user
  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateUserDto = req.body;

      const updatedUser = await this.userService.updateUser(id, updateData);

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
        return;
      }

      const userResponse = {
        _id: updatedUser._id,
        phoneNumber: updatedUser.phoneNumber,
        email: updatedUser.email,
        gender: updatedUser.gender,
        role: updatedUser.role,
        status: updatedUser.status,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };

      res.status(200).json({
        success: true,
        data: userResponse,
        message: "Usuário atualizado com sucesso",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao atualizar usuário",
      });
    }
  };

  // SOFT DELETE - Desativar user
  deactivateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const deactivatedUser = await this.userService.deactivateUser(id);

      if (!deactivatedUser) {
        res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { id: deactivatedUser._id, status: deactivatedUser.status },
        message: "Usuário desativado com sucesso",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao desativar usuário",
      });
    }
  };

  // HARD DELETE - Remover permanentemente
  deleteUserPermanently = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const canDelete = await this.userService.canDeleteUser(id);
      if (!canDelete.canDelete) {
        res.status(400).json({
          success: false,
          message: canDelete.reason || "Não é possível deletar este usuário",
        });
        return;
      }

      const deleted = await this.userService.deleteUserPermanently(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Usuário removido permanentemente com sucesso",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao remover usuário",
      });
    }
  };

  // RESTAURAR user
  restoreUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const restoredUser = await this.userService.restoreUser(id);

      if (!restoredUser) {
        res.status(404).json({
          success: false,
          message: "Usuário não encontrado ou não está deletado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { id: restoredUser._id, status: restoredUser.status },
        message: "Usuário restaurado com sucesso",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao restaurar usuário",
      });
    }
  };

  // BLOQUEAR user
  blockUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const canBlock = await this.userService.canBlockUser(id);
      if (!canBlock.canBlock) {
        res.status(400).json({
          success: false,
          message: canBlock.reason || "Não é possível bloquear este usuário",
        });
        return;
      }

      const blockedUser = await this.userService.blockUser(id);

      if (!blockedUser) {
        res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { id: blockedUser._id, status: blockedUser.status },
        message: "Usuário bloqueado com sucesso",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao bloquear usuário",
      });
    }
  };

  // ATIVAR user
  activateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const activatedUser = await this.userService.activateUser(id);

      if (!activatedUser) {
        res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { id: activatedUser._id, status: activatedUser.status },
        message: "Usuário ativado com sucesso",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao ativar usuário",
      });
    }
  };

  // AUTENTICAÇÃO - Login (por email ou phone)
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        res.status(400).json({
          success: false,
          message: "Identificador (email/telefone) e password são obrigatórios",
        });
        return;
      }

      const user = await this.userService.validateCredentials(
        identifier,
        password
      );

      if (!user) {
        res.status(401).json({
          success: false,
          message: "Credenciais inválidas",
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
        updatedAt: user.updatedAt,
      };

      res.status(200).json({
        success: true,
        data: userResponse,
        message: "Login realizado com sucesso",
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao fazer login",
      });
    }
  };

  // ALTERAR PASSWORD
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        res.status(400).json({
          success: false,
          message: "Nova password é obrigatória",
        });
        return;
      }

      const updatedUser = await this.userService.changePassword(
        id,
        newPassword
      );

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: "Usuário não encontrado",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Password alterada com sucesso",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Erro ao alterar password",
      });
    }
  };

  // BUSCAR USERS DELETADOS
  getDeletedUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const deletedUsers = await this.userService.getDeletedUsers();

      res.status(200).json({
        success: true,
        data: deletedUsers,
        message: "Usuários deletados recuperados com sucesso",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro ao buscar usuários deletados",
      });
    }
  };

  // ESTATÍSTICAS
  getUserStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.userService.getUserStats();

      res.status(200).json({
        success: true,
        data: stats,
        message: "Estatísticas recuperadas com sucesso",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro ao buscar estatísticas",
      });
    }
  };

  // VERIFICAR SE PODE DELETAR
  checkCanDelete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const canDelete = await this.userService.canDeleteUser(id);

      res.status(200).json({
        success: true,
        data: canDelete,
        message: canDelete.canDelete
          ? "Usuário pode ser deletado"
          : "Usuário não pode ser deletado",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao verificar",
      });
    }
  };

  // VERIFICAR SE PODE BLOQUEAR
  checkCanBlock = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const canBlock = await this.userService.canBlockUser(id);

      res.status(200).json({
        success: true,
        data: canBlock,
        message: canBlock.canBlock
          ? "Usuário pode ser bloqueado"
          : "Usuário não pode ser bloqueado",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Erro ao verificar",
      });
    }
  };
}
