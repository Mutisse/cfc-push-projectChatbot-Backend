// src/modules/prayers/repositories/prayerRepository.ts
import { Prayer } from '../models/Prayer';
import { 
  IPrayer, 
  CreatePrayerDto, 
  UpdatePrayerDto, 
  FilterPrayerDto,
  PrayerStats,
  PrayerSummary 
} from '../interfaces/prayer.interface';
import { Types } from 'mongoose';

export class PrayerRepository {
  // ==================== CRUD BÁSICO ====================

  async create(data: CreatePrayerDto): Promise<IPrayer> {
    const prayer = new Prayer({
      ...data,
      createdBy: 'public'
    });
    return await prayer.save();
  }

  async findById(id: string): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return await Prayer.findOne({ _id: id }).exec(); // Removido filtro deletedAt para admin poder ver deletados
  }

  async findActiveById(id: string): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return await Prayer.findOne({ _id: id, deletedAt: null }).exec();
  }

  async findAll(
    filters: FilterPrayerDto = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = '-createdAt'
  ): Promise<{ data: IPrayer[]; total: number; page: number; totalPages: number }> {
    
    const query: any = {};
    
    // Filtros de status
    if (filters.status) query.status = filters.status;
    if (filters.urgency) query.urgency = filters.urgency;
    if (filters.prayerType) query.prayerType = filters.prayerType;
    
    // Filtro de data
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
    }
    
    // Busca textual
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { notes: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    // Incluir deletados?
    if (!filters.includeDeleted) {
      query.deletedAt = null;
    }
    
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      Prayer.find(query)
        .sort(sortBy)
        .skip(skip)
        .limit(limit)
        .exec(),
      Prayer.countDocuments(query)
    ]);
    
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async update(id: string, data: UpdatePrayerDto): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    
    return await Prayer.findOneAndUpdate(
      { _id: id },
      { 
        ...data,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).exec();
  }

  async updateActive(id: string, data: UpdatePrayerDto): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    
    return await Prayer.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { 
        ...data,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).exec();
  }

  // ==================== SOFT DELETE ====================

  async softDelete(id: string, deletedBy?: string): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    
    const updateData: any = {
      deletedAt: new Date(),
      status: 'archived'
    };
    
    if (deletedBy) {
      updateData.deletedBy = new Types.ObjectId(deletedBy);
    } else if (deletedBy === 'public') {
      updateData.deletedBy = null; // Para usuário público
    }
    
    return await Prayer.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).exec();
  }

  async restore(id: string): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    
    return await Prayer.findByIdAndUpdate(
      id,
      {
        deletedAt: null,
        deletedBy: null,
        status: 'pending'
      },
      { new: true }
    ).exec();
  }

  // ==================== HARD DELETE ====================

  async hardDelete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    
    const result = await Prayer.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async hardDeleteMany(ids: string[]): Promise<number> {
    const validIds = ids.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length === 0) return 0;
    
    const result = await Prayer.deleteMany({ 
      _id: { $in: validIds } 
    });
    return result.deletedCount;
  }

  // ==================== MÉTODOS ESPECÍFICOS ====================

  async findByPhone(phone: string): Promise<IPrayer[]> {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithPrefix = cleanPhone.startsWith('258') ? cleanPhone : `258${cleanPhone}`;
    
    return await Prayer.find({
      phone: { $regex: phoneWithPrefix, $options: 'i' }
      // Não filtrar por deletedAt para mostrar todos (incluindo deletados se necessário)
    })
    .sort('-createdAt')
    .limit(50) // Aumentado para 50
    .exec();
  }

  async findByPhoneActiveOnly(phone: string): Promise<IPrayer[]> {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithPrefix = cleanPhone.startsWith('258') ? cleanPhone : `258${cleanPhone}`;
    
    return await Prayer.find({
      phone: { $regex: phoneWithPrefix, $options: 'i' },
      deletedAt: null // Apenas ativos
    })
    .sort('-createdAt')
    .limit(50)
    .exec();
  }

  async markAsPrayed(id: string, prayerCount: number = 1): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    
    return await Prayer.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        $inc: { prayerCount },
        lastPrayedAt: new Date(),
        status: 'in_prayer'
      },
      { new: true }
    ).exec();
  }

  async updateStatus(id: string, status: string, notes?: string): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    
    const updateData: any = { status };
    if (notes) updateData.notes = notes;
    
    return await Prayer.findOneAndUpdate(
      { _id: id, deletedAt: null },
      updateData,
      { new: true }
    ).exec();
  }

  async assignTo(id: string, userId: string): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    
    return await Prayer.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        assignedTo: new Types.ObjectId(userId),
        status: 'in_prayer'
      },
      { new: true }
    ).exec();
  }

  // ==================== ESTATÍSTICAS ====================

  async getStats(): Promise<PrayerStats> {
    const [
      total,
      pending,
      in_prayer,
      completed,
      archived,
      deleted,
      urgencyStats,
      typeStats,
      recentActivity
    ] = await Promise.all([
      // Totais
      Prayer.countDocuments({}),
      Prayer.countDocuments({ status: 'pending', deletedAt: null }),
      Prayer.countDocuments({ status: 'in_prayer', deletedAt: null }),
      Prayer.countDocuments({ status: 'completed', deletedAt: null }),
      Prayer.countDocuments({ status: 'archived', deletedAt: null }),
      Prayer.countDocuments({ deletedAt: { $ne: null } }),
      
      // Por urgência (apenas ativos)
      Prayer.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$urgency', count: { $sum: 1 } } }
      ]),
      
      // Por tipo (apenas ativos)
      Prayer.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$prayerType', count: { $sum: 1 } } }
      ]),
      
      // Atividade recente (últimas 24h, apenas ativos)
      Prayer.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        deletedAt: null 
      })
    ]);
    
    const byUrgency = {
      low: 0,
      medium: 0,
      high: 0
    };
    
    const byType: Record<string, number> = {};
    
    urgencyStats.forEach((stat: any) => {
      byUrgency[stat._id as keyof typeof byUrgency] = stat.count;
    });
    
    typeStats.forEach((stat: any) => {
      byType[stat._id] = stat.count;
    });
    
    return {
      total,
      pending,
      in_prayer,
      completed,
      archived,
      deleted,
      byUrgency,
      byType,
      recentActivity
    };
  }

  // ==================== QUERIES ESPECIAIS ====================

  async getUrgentPending(): Promise<IPrayer[]> {
    return await Prayer.find({
      urgency: 'high',
      status: 'pending',
      deletedAt: null
    })
    .sort('createdAt')
    .limit(20)
    .exec();
  }

  async getRecent(days: number = 7): Promise<IPrayer[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    return await Prayer.find({
      createdAt: { $gte: date },
      deletedAt: null
    })
    .sort('-createdAt')
    .exec();
  }

  async getSummary(): Promise<PrayerSummary[]> {
    return await Prayer.find({ deletedAt: null })
      .select('name phone prayerType description urgency status prayerCount lastPrayedAt createdAt')
      .sort('-createdAt')
      .limit(50)
      .lean()
      .exec() as PrayerSummary[];
  }

  // ==================== MÉTODOS DE VERIFICAÇÃO ====================

  async isPhoneOwner(prayerId: string, phone: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(prayerId)) return false;
    
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithPrefix = cleanPhone.startsWith('258') ? cleanPhone : `258${cleanPhone.slice(-9)}`;
    
    const prayer = await Prayer.findOne({
      _id: prayerId,
      phone: { $regex: phoneWithPrefix, $options: 'i' }
    }).exec();
    
    return !!prayer;
  }

  async getActivePrayerById(id: string): Promise<IPrayer | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return await Prayer.findOne({ _id: id, deletedAt: null }).exec();
  }
}