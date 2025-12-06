import { MemberRegistration } from "../models/Member";
import { User } from "../../users/models/User";
import {
  IMemberRegistration,
  CreateMemberRegistrationDto,
  UpdateMemberRegistrationDto,
} from "../interfaces/member-registration.interface";
import { Types } from "mongoose";

export class MemberRepository {
  // ==================== MÉTODOS DE CONSULTA ====================

  async findAll(
    filters: { status?: string; source?: string } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: IMemberRegistration[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query: any = { deletedAt: null };

    if (filters.status) query.status = filters.status;
    if (filters.source) query.source = filters.source;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      MemberRegistration.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      MemberRegistration.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<IMemberRegistration | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return await MemberRegistration.findOne({
      _id: id,
      deletedAt: null,
    }).exec();
  }

  async findPending(): Promise<IMemberRegistration[]> {
    return await MemberRegistration.find({
      status: "pending",
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByPhone(phoneNumber: string): Promise<IMemberRegistration | null> {
    try {
      let registration = await MemberRegistration.findOne({
        phoneNumber: phoneNumber,
        deletedAt: null,
      }).exec();

      if (!registration) {
        registration = await MemberRegistration.findOne({
          phoneNumber: { $regex: `^${phoneNumber}` },
          deletedAt: null,
        }).exec();
      }

      if (!registration) {
        registration = await MemberRegistration.findOne({
          phoneNumber: { $regex: phoneNumber, $options: "i" },
          deletedAt: null,
        }).exec();
      }

      return registration;
    } catch (error) {
      console.error("Erro ao buscar por telefone:", error);
      throw error;
    }
  }

  // ==================== MÉTODOS DE CRIAÇÃO ====================

  async create(
    registrationData: CreateMemberRegistrationDto
  ): Promise<IMemberRegistration> {
    const registration = new MemberRegistration(registrationData);
    return await registration.save();
  }

  // ==================== MÉTODOS DE ATUALIZAÇÃO ====================

  async update(
    id: string,
    updateData: UpdateMemberRegistrationDto
  ): Promise<IMemberRegistration | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await MemberRegistration.findOneAndUpdate(
      {
        _id: id,
        deletedAt: null,
      },
      updateData,
      { new: true }
    ).exec();
  }

  // ✅ APROVAR REGISTRO (SIMPLES E FLEXÍVEL)
  async approve(
    id: string,
    approvedBy: string
  ): Promise<IMemberRegistration | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await MemberRegistration.findOneAndUpdate(
      {
        _id: id,
        deletedAt: null,
      },
      {
        status: "approved",
        approvedBy: approvedBy, // Aceita "admin" ou ObjectId
        approvedAt: new Date(),
      },
      { new: true }
    ).exec();
  }

  async reject(
    id: string,
    rejectionReason: string
  ): Promise<IMemberRegistration | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await MemberRegistration.findOneAndUpdate(
      {
        _id: id,
        deletedAt: null,
      },
      {
        status: "rejected",
        rejectionReason,
        approvedAt: new Date(),
      },
      { new: true }
    ).exec();
  }

  async cancel(id: string): Promise<IMemberRegistration | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await MemberRegistration.findOneAndUpdate(
      {
        _id: id,
        deletedAt: null,
      },
      {
        status: "cancelled",
        updatedAt: new Date(),
      },
      { new: true }
    ).exec();
  }

  // ==================== MÉTODOS DE EXCLUSÃO ====================

  async softDelete(id: string): Promise<IMemberRegistration | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await MemberRegistration.findByIdAndUpdate(
      id,
      {
        deletedAt: new Date(),
      },
      { new: true }
    ).exec();
  }

  async restore(id: string): Promise<IMemberRegistration | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await MemberRegistration.findByIdAndUpdate(
      id,
      { deletedAt: null },
      { new: true }
    ).exec();
  }

  async hardDelete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await MemberRegistration.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  // ==================== MÉTODOS ADMINISTRATIVOS ====================

  async findDeleted(): Promise<IMemberRegistration[]> {
    return await MemberRegistration.find({
      deletedAt: { $ne: null },
    })
      .sort({ deletedAt: -1 })
      .exec();
  }

  async findByIdIncludingDeleted(
    id: string
  ): Promise<IMemberRegistration | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return await MemberRegistration.findById(id).exec();
  }

  // ==================== MÉTODOS DE ESTATÍSTICAS ====================

  async getStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  }> {
    const stats = await MemberRegistration.aggregate([
      {
        $match: { deletedAt: null },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    };

    stats.forEach((stat) => {
      switch (stat._id) {
        case "pending":
          result.pending = stat.count;
          break;
        case "approved":
          result.approved = stat.count;
          break;
        case "rejected":
          result.rejected = stat.count;
          break;
        case "cancelled":
          result.cancelled = stat.count;
          break;
        default:
          break;
      }
      result.total += stat.count;
    });

    return result;
  }

  async isPhoneNumberRegistered(phoneNumber: string): Promise<boolean> {
    const count = await MemberRegistration.countDocuments({
      phoneNumber,
      status: { $in: ["pending", "approved"] },
      deletedAt: null,
    });
    return count > 0;
  }

  async findByPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<IMemberRegistration[]> {
    return await MemberRegistration.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .exec();
  }
}