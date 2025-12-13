// src/modules/prayers/repositories/prayerRepository.ts
import { Prayer } from "../models/Prayer";
import { IPrayer } from "../interfaces/prayer.interface";
import { Types } from "mongoose";

export class PrayerRepository {
  // ==================== CRUD BÁSICO ====================

  async findAll(): Promise<IPrayer[]> {
    return await Prayer.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return await Prayer.findOne({ _id: id, deletedAt: null }).exec();
  }

  async create(prayerData: any): Promise<IPrayer> {
    const prayer = new Prayer(prayerData);
    return await prayer.save();
  }

  async update(id: string, prayerData: any): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await Prayer.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { ...prayerData, updatedAt: new Date() },
      { new: true }
    ).exec();
  }

  // ==================== SOFT DELETE ====================

  async softDelete(id: string, deletedBy?: string): Promise<IPrayer | null> {
    console.log("🔍 REPOSITORY softDelete - ID:", id, "deletedBy:", deletedBy);

    if (!Types.ObjectId.isValid(id)) {
      console.log("❌ ID inválido no repository.softDelete:", id);
      return null;
    }

    try {
      const updateData: any = {
        deletedAt: new Date(),
        status: "archived",
      };

      if (deletedBy) {
        if (Types.ObjectId.isValid(deletedBy)) {
          updateData.deletedBy = new Types.ObjectId(deletedBy);
          console.log("✅ deletedBy é ObjectId válido");
        } else {
          updateData.deletedByString = deletedBy;
          console.log(
            "⚠️ deletedBy NÃO é ObjectId, guardando como string:",
            deletedBy
          );
        }
      }

      console.log("📝 Dados para update:", updateData);

      return await Prayer.findOneAndUpdate(
        { _id: id, deletedAt: null },
        updateData,
        { new: true }
      ).exec();
    } catch (error) {
      console.error("💥 ERRO em repository.softDelete:", error);
      return null;
    }
  }

  async restore(id: string): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await Prayer.findByIdAndUpdate(
      id,
      {
        deletedAt: null,
        deletedBy: null,
        status: "pending",
      },
      { new: true }
    ).exec();
  }

  async findDeleted(): Promise<IPrayer[]> {
    console.log("🗑️ REPOSITORY: Buscando pedidos deletados");
    try {
      const deletedPrayers = await Prayer.find({ deletedAt: { $ne: null } })
        .sort({ deletedAt: -1 })
        .exec();

      console.log(`📋 Encontrados ${deletedPrayers.length} pedidos deletados`);
      return deletedPrayers;
    } catch (error) {
      console.error("❌ REPOSITORY: Erro ao buscar deletados:", error);
      return [];
    }
  }

  // ==================== HARD DELETE ====================

  async hardDelete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const result = await Prayer.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async hardDeleteMany(ids: string[]): Promise<number> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length === 0) return 0;

    const result = await Prayer.deleteMany({ _id: { $in: validIds } });
    return result.deletedCount;
  }

  // ==================== OPERAÇÕES ESPECIAIS ====================

  async updateStatus(
    id: string,
    status: string,
    notes?: string
  ): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const updateData: any = {
      status,
      lastPrayedAt: status === "in_prayer" ? new Date() : undefined,
    };

    if (notes) updateData.notes = notes;

    return await Prayer.findOneAndUpdate(
      { _id: id, deletedAt: null },
      updateData,
      { new: true }
    ).exec();
  }

  async markAsPrayed(
    id: string,
    prayerCount: number = 1
  ): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await Prayer.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $inc: { prayerCount },
        lastPrayedAt: new Date(),
        status: "in_prayer",
      },
      { new: true }
    ).exec();
  }

  async assignTo(id: string, userId: string): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await Prayer.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        assignedTo: new Types.ObjectId(userId),
        status: "in_prayer",
      },
      { new: true }
    ).exec();
  }

  // ==================== ESTATÍSTICAS ====================

  async getStats(): Promise<any> {
    console.log("📊 REPOSITORY: Iniciando cálculo de estatísticas");

    try {
      const allActivePrayers = await Prayer.find({
        deletedAt: null,
      })
        .lean()
        .exec();

      console.log(`📦 Total de pedidos ativos: ${allActivePrayers.length}`);

      if (allActivePrayers.length === 0) {
        return this.getEmptyStats();
      }

      const total = allActivePrayers.length;

      const pending = allActivePrayers.filter(
        (p: any) => (p.status || "pending") === "pending"
      ).length;

      const in_prayer = allActivePrayers.filter(
        (p: any) => (p.status || "pending") === "in_prayer"
      ).length;

      const completed = allActivePrayers.filter(
        (p: any) => (p.status || "pending") === "completed"
      ).length;

      const archived = allActivePrayers.filter(
        (p: any) => (p.status || "pending") === "archived"
      ).length;

      const byUrgency = { low: 0, medium: 0, high: 0 };
      allActivePrayers.forEach((prayer: any) => {
        const urgency = prayer.urgency || "medium";
        if (urgency === "low") byUrgency.low++;
        else if (urgency === "medium") byUrgency.medium++;
        else if (urgency === "high") byUrgency.high++;
      });

      const byType: Record<string, number> = {};
      allActivePrayers.forEach((prayer: any) => {
        const type = prayer.prayerType || "outro";
        byType[type] = (byType[type] || 0) + 1;
      });

      const weeklyTrend = await this.getWeeklyTrend();

      console.log("✅ Estatísticas calculadas:", {
        total,
        pending,
        in_prayer,
        completed,
        archived,
      });

      return {
        total,
        pending,
        in_prayer,
        completed,
        archived,
        byUrgency,
        byType,
        weeklyTrend,
      };
    } catch (error: any) {
      console.error("❌ ERRO em getStats:", error.message);
      return this.getEmptyStats();
    }
  }

  private getEmptyStats(): any {
    return {
      total: 0,
      pending: 0,
      in_prayer: 0,
      completed: 0,
      archived: 0,
      byUrgency: { low: 0, medium: 0, high: 0 },
      byType: {},
      weeklyTrend: [0, 0, 0, 0, 0, 0, 0],
    };
  }

  private async getWeeklyTrend(): Promise<number[]> {
    try {
      const trend: number[] = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const count = await Prayer.countDocuments({
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          deletedAt: null,
        });

        trend.push(count);
      }

      return trend;
    } catch (error) {
      console.error("❌ Erro ao calcular tendência semanal:", error);
      return [0, 0, 0, 0, 0, 0, 0];
    }
  }

  async getUrgentPending(): Promise<IPrayer[]> {
    try {
      console.log("⚠️ REPOSITORY: Buscando urgentes pendentes...");

      const urgentPrayers = await Prayer.find({
        deletedAt: null,
        urgency: "high",
        $or: [{ status: "pending" }, { status: { $exists: false } }],
      })
        .sort({ createdAt: 1 })
        .limit(20)
        .exec();

      console.log(`🔴 Urgentes pendentes encontrados: ${urgentPrayers.length}`);
      return urgentPrayers;
    } catch (error) {
      console.error("❌ Erro ao buscar urgentes pendentes:", error);
      return [];
    }
  }

  // ==================== BUSCA POR TELEFONE ====================
  async findDeletedById(id: string): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return await Prayer.findOne({
      _id: id,
      deletedAt: { $ne: null },
    }).exec();
  }

  async findByPhone(phone: string): Promise<IPrayer[]> {
    try {
      const cleanPhone = phone.replace(/\D/g, "").slice(-9);

      return await Prayer.find({
        phone: { $regex: cleanPhone + "$" },
        deletedAt: null,
      })
        .sort("-createdAt")
        .limit(50)
        .exec();
    } catch (error) {
      console.error("❌ Erro ao buscar por telefone:", error);
      return [];
    }
  }

  async isPhoneOwner(prayerId: string, phone: string): Promise<boolean> {
    console.log(
      `🔍 REPOSITORY isPhoneOwner: prayerId=${prayerId}, phone=${phone}`
    );

    if (!Types.ObjectId.isValid(prayerId)) {
      console.log("❌ prayerId inválido");
      return false;
    }

    try {
      const cleanInputPhone = phone.replace(/\D/g, "");
      const last9Digits =
        cleanInputPhone.length >= 9
          ? cleanInputPhone.substring(cleanInputPhone.length - 9)
          : cleanInputPhone;

      console.log(`📱 Últimos 9 dígitos do input: ${last9Digits}`);

      const prayer = await Prayer.findOne({
        _id: prayerId,
      });

      if (!prayer) {
        console.log("❌ Pedido não encontrado no banco");
        return false;
      }

      console.log(`📞 Telefone do pedido no banco: ${prayer.phone}`);

      const cleanDbPhone = prayer.phone.replace(/\D/g, "");
      const last9DbDigits =
        cleanDbPhone.length >= 9
          ? cleanDbPhone.substring(cleanDbPhone.length - 9)
          : cleanDbPhone;

      console.log(`📱 Últimos 9 dígitos do banco: ${last9DbDigits}`);

      const matchByLast9 = last9Digits === last9DbDigits;
      const matchFull = cleanInputPhone === cleanDbPhone;

      console.log(
        `🔍 Comparação: matchByLast9=${matchByLast9}, matchFull=${matchFull}`
      );

      return matchByLast9 || matchFull;
    } catch (error) {
      console.error("💥 Erro em isPhoneOwner:", error);
      return false;
    }
  }
}
