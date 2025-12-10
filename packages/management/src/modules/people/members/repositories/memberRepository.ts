import { MemberRegistration } from "../models/Member";
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

  // src/repositories/memberRepository.ts - VERSÃO FLEXÍVEL
  async findByPhone(phoneNumber: string): Promise<IMemberRegistration | null> {
    try {
      console.log(`📞 BUSCA POR TELEFONE: "${phoneNumber}"`);

      if (!phoneNumber || phoneNumber.trim().length === 0) {
        console.log("⚠️ Telefone vazio fornecido");
        return null;
      }

      // 1. Limpar número (remover tudo que não for dígito)
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      console.log(`🔢 Telefone limpo: "${cleanPhone}"`);

      // Se tiver menos de 6 dígitos, não busca
      if (cleanPhone.length < 6) {
        console.log("⚠️ Telefone muito curto:", cleanPhone.length, "dígitos");
        return null;
      }

      // ========== ESTRATÉGIAS DE BUSCA ==========

      // 1. BUSCA EXATA em phoneNumber
      console.log("1️⃣ Busca EXATA em phoneNumber:", cleanPhone);
      let registration = await MemberRegistration.findOne({
        phoneNumber: cleanPhone,
        deletedAt: null,
      }).exec();

      if (registration) {
        console.log("✅ ENCONTRADO na busca exata!");
        console.log("   👤 Nome:", registration.fullName);
        console.log("   📱 PhoneNumber salvo:", registration.phoneNumber);
        return registration;
      }

      // 2. BUSCA EXATA em phone (campo alternativo)
      console.log("2️⃣ Busca EXATA em campo phone:", cleanPhone);
      registration = await MemberRegistration.findOne({
        phone: cleanPhone,
        deletedAt: null,
      }).exec();

      if (registration) {
        console.log("✅ ENCONTRADO no campo phone!");
        console.log("   👤 Nome:", registration.fullName);
        console.log("   📱 Phone salvo:", registration.phone);
        return registration;
      }

      // 3. BUSCA POR ÚLTIMOS 9 DÍGITOS (padrão Moçambique)
      const last9Digits = cleanPhone.slice(-9);
      if (last9Digits.length >= 8) {
        // Pelo menos 8 dos últimos 9
        console.log("3️⃣ Busca por ÚLTIMOS 9 DÍGITOS:", last9Digits);

        registration = await MemberRegistration.findOne({
          $or: [
            { phoneNumber: { $regex: last9Digits } },
            { phone: { $regex: last9Digits } },
          ],
          deletedAt: null,
        }).exec();

        if (registration) {
          console.log("✅ ENCONTRADO pelos últimos dígitos!");
          console.log("   👤 Nome:", registration.fullName);
          return registration;
        }
      }

      // 4. BUSCA SEM PREFIXO 258 (formato internacional)
      let phoneWithoutPrefix = cleanPhone;
      if (cleanPhone.startsWith("258")) {
        phoneWithoutPrefix = cleanPhone.substring(3); // Remove "258"
        console.log("4️⃣ Busca SEM PREFIXO 258:", phoneWithoutPrefix);

        registration = await MemberRegistration.findOne({
          $or: [
            { phoneNumber: phoneWithoutPrefix },
            { phoneNumber: { $regex: phoneWithoutPrefix } },
            { phone: phoneWithoutPrefix },
            { phone: { $regex: phoneWithoutPrefix } },
          ],
          deletedAt: null,
        }).exec();

        if (registration) {
          console.log("✅ ENCONTRADO sem prefixo!");
          console.log("   👤 Nome:", registration.fullName);
          return registration;
        }
      }

      // 5. BUSCA COM PREFIXO 258 (adiciona se não tiver)
      if (!cleanPhone.startsWith("258") && cleanPhone.length >= 9) {
        const phoneWithPrefix = "258" + cleanPhone.slice(-9);
        console.log("5️⃣ Busca COM PREFIXO 258:", phoneWithPrefix);

        registration = await MemberRegistration.findOne({
          $or: [
            { phoneNumber: phoneWithPrefix },
            { phoneNumber: { $regex: phoneWithPrefix } },
            { phone: phoneWithPrefix },
            { phone: { $regex: phoneWithPrefix } },
          ],
          deletedAt: null,
        }).exec();

        if (registration) {
          console.log("✅ ENCONTRADO com prefixo!");
          console.log("   👤 Nome:", registration.fullName);
          return registration;
        }
      }

      // 6. BUSCA COM + (formato internacional)
      const phoneWithPlus = "+" + cleanPhone;
      console.log("6️⃣ Busca COM +:", phoneWithPlus);

      registration = await MemberRegistration.findOne({
        $or: [{ phoneNumber: phoneWithPlus }, { phone: phoneWithPlus }],
        deletedAt: null,
      }).exec();

      if (registration) {
        console.log("✅ ENCONTRADO com +!");
        console.log("   👤 Nome:", registration.fullName);
        return registration;
      }

      // 7. BUSCA FLEXÍVEL (qualquer correspondência)
      console.log("7️⃣ Busca FLEXÍVEL (regex):");

      // Se o número for longo (>10), usa partes dele
      const searchTerms = [];

      if (cleanPhone.length >= 12) {
        // Tenta os últimos 12, 11, 10, 9 dígitos
        for (let i = 12; i >= 9; i--) {
          if (cleanPhone.length >= i) {
            searchTerms.push(cleanPhone.slice(-i));
          }
        }
      } else if (cleanPhone.length >= 9) {
        // Usa o número completo
        searchTerms.push(cleanPhone);
      }

      // Adiciona partes menores se necessário
      if (cleanPhone.length >= 8) searchTerms.push(cleanPhone.slice(-8));
      if (cleanPhone.length >= 7) searchTerms.push(cleanPhone.slice(-7));

      console.log("   Termos de busca:", searchTerms);

      for (const term of searchTerms) {
        registration = await MemberRegistration.findOne({
          $or: [{ phoneNumber: { $regex: term } }, { phone: { $regex: term } }],
          deletedAt: null,
        }).exec();

        if (registration) {
          console.log(`✅ ENCONTRADO com termo "${term}"!`);
          console.log("   👤 Nome:", registration.fullName);
          return registration;
        }
      }

      // 8. VERIFICA CAMPOS COM MASCARAS ESPECIAIS
      console.log("8️⃣ Busca em formatos especiais...");

      // Formato: 258 87 861 2744 (com espaços)
      const phoneWithSpaces = cleanPhone.replace(
        /(\d{3})(\d{2})(\d{3})(\d{4})/,
        "$1 $2 $3 $4"
      );
      registration = await MemberRegistration.findOne({
        $or: [{ phoneNumber: phoneWithSpaces }, { phone: phoneWithSpaces }],
        deletedAt: null,
      }).exec();

      if (registration) {
        console.log("✅ ENCONTRADO com espaços!");
        return registration;
      }

      console.log("❌ NENHUMA CORRESPONDÊNCIA ENCONTRADA");
      console.log("   Número pesquisado:", phoneNumber);
      console.log("   Número limpo:", cleanPhone);

      return null;
    } catch (error) {
      console.error("❌ Erro ao buscar por telefone:", error);
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
