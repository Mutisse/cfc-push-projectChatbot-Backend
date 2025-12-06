// src/repositories/userRepository.ts
import { User } from "../models/User";
import {
  IUser,
  CreateUserDto,
  UpdateUserDto,
} from "../../users/interface/user.interface";
import { Types } from "mongoose";

export class UserRepository {
  // CREATE - Criar novo user
  async create(userData: CreateUserDto): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  }

  // READ - Buscar por ID (excluindo deletados)
  async findById(id: string): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return await User.findOne({
      _id: id,
      deletedAt: null,
    }).exec();
  }

  // READ - Buscar por número de celular
  async findByPhoneNumber(phoneNumber: string): Promise<IUser | null> {
    return await User.findOne({
      phoneNumber,
      deletedAt: null,
    }).exec();
  }

  // READ - Buscar por email
  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({
      email: email.toLowerCase(),
      deletedAt: null,
    }).exec();
  }

  // READ - Listar todos users (não deletados) com paginação
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: { role?: string; status?: string } = {}
  ): Promise<{
    data: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = { deletedAt: null };
    if (filters.role) query.role = filters.role;
    if (filters.status) query.status = filters.status;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password")
        .exec(),
      User.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // UPDATE - Atualizar user
  async update(id: string, updateData: UpdateUserDto): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    // Se estiver a atualizar email, converter para lowercase
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    return await User.findOneAndUpdate(
      {
        _id: id,
        deletedAt: null,
      },
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true }
    ).exec();
  }

  // SOFT DELETE - Marcar como deletado
  async softDelete(id: string): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await User.findByIdAndUpdate(
      id,
      {
        deletedAt: new Date(),
        status: "desativado",
      },
      { new: true }
    ).exec();
  }

  // HARD DELETE - Remover permanentemente
  async hardDelete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await User.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  // RESTAURAR user deletado
  async restore(id: string): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await User.findByIdAndUpdate(
      id,
      {
        deletedAt: null,
        status: "ativo",
      },
      { new: true }
    ).exec();
  }

  // Buscar users deletados
  async findDeleted(): Promise<IUser[]> {
    return await User.find({
      deletedAt: { $ne: null },
    })
      .sort({ deletedAt: -1 })
      .exec();
  }

  // Métodos para autenticação
  async incrementLoginAttempts(phoneNumber: string): Promise<IUser | null> {
    return await User.findOneAndUpdate(
      { phoneNumber },
      {
        $inc: { loginAttempts: 1 },
        updatedAt: new Date(),
      },
      { new: true }
    ).exec();
  }

  async resetLoginAttempts(phoneNumber: string): Promise<IUser | null> {
    return await User.findOneAndUpdate(
      { phoneNumber },
      {
        loginAttempts: 0,
        lockUntil: undefined,
        updatedAt: new Date(),
      },
      { new: true }
    ).exec();
  }

  async updateLastLogin(phoneNumber: string): Promise<IUser | null> {
    return await User.findOneAndUpdate(
      { phoneNumber },
      {
        lastLogin: new Date(),
        updatedAt: new Date(),
      },
      { new: true }
    ).exec();
  }

  // Verificar se número já existe
  async isPhoneNumberRegistered(phoneNumber: string): Promise<boolean> {
    const count = await User.countDocuments({
      phoneNumber,
      deletedAt: null,
    });
    return count > 0;
  }

  // Verificar se email já existe
  async isEmailRegistered(email: string): Promise<boolean> {
    const count = await User.countDocuments({
      email: email.toLowerCase(),
      deletedAt: null,
    });
    return count > 0;
  }
}
