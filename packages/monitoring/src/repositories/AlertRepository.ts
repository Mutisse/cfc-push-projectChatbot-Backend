import { Alert, IAlert } from '../models/Alert';
import { ALERT_SEVERITY, ALERT_STATUS } from '../config/constants';

export interface AlertFilters {
  search?: string;
  severity?: typeof ALERT_SEVERITY[keyof typeof ALERT_SEVERITY];
  status?: typeof ALERT_STATUS[keyof typeof ALERT_STATUS];
  service?: string;
  source?: string;
  startDate?: Date;
  endDate?: Date;
}

export class AlertRepository {
  async findAll(
    filters: AlertFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ alerts: IAlert[]; total: number }> {
    const query: any = {};

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.severity) query.severity = filters.severity;
    if (filters.status) query.status = filters.status;
    if (filters.service) query.service = filters.service;
    if (filters.source) query.source = filters.source;
    
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Alert.countDocuments(query)
    ]);

    return { alerts, total };
  }

  async findById(id: string): Promise<IAlert | null> {
    return Alert.findById(id).lean();
  }

  async create(alertData: Partial<IAlert>): Promise<IAlert> {
    const alert = new Alert(alertData);
    return alert.save();
  }

  async update(id: string, alertData: Partial<IAlert>): Promise<IAlert | null> {
    return Alert.findByIdAndUpdate(id, alertData, { new: true }).lean();
  }

  async delete(id: string): Promise<boolean> {
    const result = await Alert.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async getStats(): Promise<{
    total: number;
    open: number;
    acknowledged: number;
    resolved: number;
    bySeverity: Record<string, number>;
  }> {
    const [total, open, acknowledged, resolved] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ status: ALERT_STATUS.OPEN }),
      Alert.countDocuments({ status: ALERT_STATUS.ACKNOWLEDGED }),
      Alert.countDocuments({ status: ALERT_STATUS.RESOLVED })
    ]);

    const severityStats = await Alert.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    const bySeverity = severityStats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    return { total, open, acknowledged, resolved, bySeverity };
  }

  async getRecent(limit: number = 20): Promise<IAlert[]> {
    return Alert.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getCritical(): Promise<IAlert[]> {
    return Alert.find({ severity: ALERT_SEVERITY.CRITICAL, status: ALERT_STATUS.OPEN })
      .sort({ createdAt: -1 })
      .lean();
  }

  async resolveAlert(id: string, resolvedBy: string): Promise<IAlert | null> {
    return Alert.findByIdAndUpdate(
      id,
      { 
        status: ALERT_STATUS.RESOLVED,
        resolvedBy,
        resolvedAt: new Date()
      },
      { new: true }
    ).lean();
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<IAlert | null> {
    return Alert.findByIdAndUpdate(
      id,
      { 
        status: ALERT_STATUS.ACKNOWLEDGED,
        acknowledgedBy,
        acknowledgedAt: new Date()
      },
      { new: true }
    ).lean();
  }

  async muteAlert(id: string, mutedBy: string, mutedUntil?: Date): Promise<IAlert | null> {
    return Alert.findByIdAndUpdate(
      id,
      { 
        mutedBy,
        mutedUntil: mutedUntil || new Date(Date.now() + 24 * 60 * 60 * 1000) // Default 24h
      },
      { new: true }
    ).lean();
  }

  async unmuteAlert(id: string): Promise<IAlert | null> {
    return Alert.findByIdAndUpdate(
      id,
      { 
        mutedBy: null,
        mutedUntil: null
      },
      { new: true }
    ).lean();
  }

  async escalateAlert(id: string): Promise<IAlert | null> {
    const alert = await Alert.findById(id);
    if (!alert) return null;

    const newLevel = (alert.escalationLevel || 0) + 1;
    return Alert.findByIdAndUpdate(
      id,
      { escalationLevel: newLevel },
      { new: true }
    ).lean();
  }

  async bulkResolve(alertIds: string[], resolvedBy: string): Promise<number> {
    const result = await Alert.updateMany(
      { _id: { $in: alertIds } },
      { 
        status: ALERT_STATUS.RESOLVED,
        resolvedBy,
        resolvedAt: new Date()
      }
    );
    return result.modifiedCount;
  }

  async bulkAcknowledge(alertIds: string[], acknowledgedBy: string): Promise<number> {
    const result = await Alert.updateMany(
      { _id: { $in: alertIds } },
      { 
        status: ALERT_STATUS.ACKNOWLEDGED,
        acknowledgedBy,
        acknowledgedAt: new Date()
      }
    );
    return result.modifiedCount;
  }

  async bulkDelete(alertIds: string[]): Promise<number> {
    const result = await Alert.deleteMany({ _id: { $in: alertIds } });
    return result.deletedCount;
  }
}