// packages/monitoring/src/repositories/AlertRepository.ts
import { AlertModel, IAlert } from "../models/AlertModel";

export interface AlertFilters {
  id?: string;
  title?: string;
  description?: string;
  severity?: string;
  status?: string;
  service?: string;
  source?: string;
  assignedTo?: string;
  assignee?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  [key: string]: any;
}

export interface PaginationResult {
  alerts: IAlert[];
  total: number;
}

export interface AlertStats {
  total: number;
  open: number;
  acknowledged: number;
  resolved: number;
  muted: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  byService: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
}

export class AlertRepository {
  async findAll(
    filters: AlertFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult> {
    try {
      const query: any = {};

      // Filtros básicos
      if (filters.id) query._id = filters.id;
      if (filters.severity) query.severity = filters.severity;
      if (filters.status) query.status = filters.status;
      if (filters.service) query.service = filters.service;
      if (filters.source) query.source = filters.source;
      if (filters.assignedTo) query.assignedTo = filters.assignedTo;
      if (filters.assignee) query.assignee = filters.assignee;

      // Filtro de data
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = filters.startDate;
        if (filters.endDate) query.createdAt.$lte = filters.endDate;
      }

      // Filtro de busca (title, description)
      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: "i" } },
          { description: { $regex: filters.search, $options: "i" } },
          { service: { $regex: filters.search, $options: "i" } },
        ];
      }

      const total = await AlertModel.countDocuments(query);

      const alerts = await AlertModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec();

      return { alerts, total };
    } catch (error) {
      console.error("Error finding alerts:", error);
      throw error;
    }
  }

  async findById(id: string): Promise<IAlert | null> {
    try {
      return await AlertModel.findById(id).exec();
    } catch (error) {
      console.error(`Error finding alert by id ${id}:`, error);
      throw error;
    }
  }

  async create(alertData: Partial<IAlert>): Promise<IAlert> {
    try {
      const alert = new AlertModel(alertData);
      return await alert.save();
    } catch (error) {
      console.error("Error creating alert:", error);
      throw error;
    }
  }

  async update(id: string, alertData: Partial<IAlert>): Promise<IAlert | null> {
    try {
      return await AlertModel.findByIdAndUpdate(
        id,
        {
          ...alertData,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      ).exec();
    } catch (error) {
      console.error(`Error updating alert ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await AlertModel.findByIdAndDelete(id).exec();
      return !!result;
    } catch (error) {
      console.error(`Error deleting alert ${id}:`, error);
      throw error;
    }
  }

  async getStats(): Promise<AlertStats> {
    try {
      const total = await AlertModel.countDocuments();

      // Contagem por status
      const statusCounts = await AlertModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);

      // Contagem por severidade
      const severityCounts = await AlertModel.aggregate([
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]);

      // Contagem por serviço
      const serviceCounts = await AlertModel.aggregate([
        { $group: { _id: "$service", count: { $sum: 1 } } },
      ]);

      // Converter para objetos
      const byStatus: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};
      const byService: Record<string, number> = {};

      statusCounts.forEach((item) => {
        byStatus[item._id] = item.count;
      });

      severityCounts.forEach((item) => {
        bySeverity[item._id] = item.count;
      });

      serviceCounts.forEach((item) => {
        byService[item._id] = item.count;
      });

      return {
        total,
        open: byStatus.open || 0,
        acknowledged: byStatus.acknowledged || 0,
        resolved: byStatus.resolved || 0,
        muted: byStatus.muted || 0,
        critical: bySeverity.critical || 0,
        high: bySeverity.high || 0,
        medium: bySeverity.medium || 0,
        low: bySeverity.low || 0,
        info: bySeverity.info || 0,
        byService,
        bySeverity,
        byStatus,
      };
    } catch (error) {
      console.error("Error getting alert stats:", error);
      throw error;
    }
  }

  async getRecent(limit: number = 20): Promise<IAlert[]> {
    try {
      return await AlertModel.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      console.error("Error getting recent alerts:", error);
      throw error;
    }
  }

  async getCritical(): Promise<IAlert[]> {
    try {
      return await AlertModel.find({
        $or: [{ severity: "critical" }, { severity: "high" }],
        status: "open",
      })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      console.error("Error getting critical alerts:", error);
      throw error;
    }
  }

  async getAlertsByTimeRange(
    timeRange: "24h" | "7d" | "30d"
  ): Promise<IAlert[]> {
    try {
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case "24h":
          startDate.setHours(now.getHours() - 24);
          break;
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
      }

      return await AlertModel.find({
        createdAt: { $gte: startDate, $lte: now },
      })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      console.error("Error getting alerts by time range:", error);
      throw error;
    }
  }

  async getAlertsWithMetrics(): Promise<IAlert[]> {
    try {
      return await AlertModel.find({
        metrics: { $exists: true, $ne: {} },
      }).exec();
    } catch (error) {
      console.error("Error getting alerts with metrics:", error);
      throw error;
    }
  }

  async countAlertsBySeverity(): Promise<Record<string, number>> {
    try {
      const result = await AlertModel.aggregate([
        {
          $group: {
            _id: "$severity",
            count: { $sum: 1 },
          },
        },
      ]);

      const counts: Record<string, number> = {};
      result.forEach((item) => {
        counts[item._id] = item.count;
      });

      return counts;
    } catch (error) {
      console.error("Error counting alerts by severity:", error);
      throw error;
    }
  }

  async resolveAlert(id: string, resolvedBy: string): Promise<IAlert | null> {
    try {
      return await AlertModel.findByIdAndUpdate(
        id,
        {
          status: "resolved",
          resolvedAt: new Date(),
          resolvedBy,
          updatedAt: new Date(),
        },
        { new: true }
      ).exec();
    } catch (error) {
      console.error(`Error resolving alert ${id}:`, error);
      throw error;
    }
  }

  async acknowledgeAlert(
    id: string,
    acknowledgedBy: string
  ): Promise<IAlert | null> {
    try {
      return await AlertModel.findByIdAndUpdate(
        id,
        {
          status: "acknowledged",
          acknowledgedAt: new Date(),
          acknowledgedBy,
          updatedAt: new Date(),
        },
        { new: true }
      ).exec();
    } catch (error) {
      console.error(`Error acknowledging alert ${id}:`, error);
      throw error;
    }
  }

  async muteAlert(
    id: string,
    mutedBy: string,
    mutedUntil?: Date
  ): Promise<IAlert | null> {
    try {
      const updateData: any = {
        status: "muted",
        mutedAt: new Date(),
        mutedBy,
        updatedAt: new Date(),
      };

      if (mutedUntil) {
        updateData.mutedUntil = mutedUntil;
      }

      return await AlertModel.findByIdAndUpdate(id, updateData, {
        new: true,
      }).exec();
    } catch (error) {
      console.error(`Error muting alert ${id}:`, error);
      throw error;
    }
  }

  async unmuteAlert(id: string): Promise<IAlert | null> {
    try {
      return await AlertModel.findByIdAndUpdate(
        id,
        {
          status: "open",
          mutedUntil: null,
          updatedAt: new Date(),
        },
        { new: true }
      ).exec();
    } catch (error) {
      console.error(`Error unmuting alert ${id}:`, error);
      throw error;
    }
  }

  async escalateAlert(id: string): Promise<IAlert | null> {
    try {
      const alert = await AlertModel.findById(id);
      if (!alert) return null;

      const newEscalationLevel = (alert.escalationLevel || 1) + 1;

      return await AlertModel.findByIdAndUpdate(
        id,
        {
          escalationLevel: newEscalationLevel,
          updatedAt: new Date(),
        },
        { new: true }
      ).exec();
    } catch (error) {
      console.error(`Error escalating alert ${id}:`, error);
      throw error;
    }
  }

  async bulkResolve(alertIds: string[], resolvedBy: string): Promise<number> {
    try {
      const result = await AlertModel.updateMany(
        { _id: { $in: alertIds } },
        {
          status: "resolved",
          resolvedAt: new Date(),
          resolvedBy,
          updatedAt: new Date(),
        }
      ).exec();

      return result.modifiedCount;
    } catch (error) {
      console.error("Error bulk resolving alerts:", error);
      throw error;
    }
  }

  async bulkAcknowledge(
    alertIds: string[],
    acknowledgedBy: string
  ): Promise<number> {
    try {
      const result = await AlertModel.updateMany(
        { _id: { $in: alertIds } },
        {
          status: "acknowledged",
          acknowledgedAt: new Date(),
          acknowledgedBy,
          updatedAt: new Date(),
        }
      ).exec();

      return result.modifiedCount;
    } catch (error) {
      console.error("Error bulk acknowledging alerts:", error);
      throw error;
    }
  }

  async bulkDelete(alertIds: string[]): Promise<number> {
    try {
      const result = await AlertModel.deleteMany({
        _id: { $in: alertIds },
      }).exec();

      return result.deletedCount;
    } catch (error) {
      console.error("Error bulk deleting alerts:", error);
      throw error;
    }
  }

  async searchAlerts(
    searchTerm: string,
    limit: number = 50
  ): Promise<IAlert[]> {
    try {
      return await AlertModel.find({
        $or: [
          { title: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
          { service: { $regex: searchTerm, $options: "i" } },
          { source: { $regex: searchTerm, $options: "i" } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      console.error("Error searching alerts:", error);
      throw error;
    }
  }

  async getAlertsByService(
    service: string,
    limit: number = 50
  ): Promise<IAlert[]> {
    try {
      return await AlertModel.find({ service })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      console.error(`Error getting alerts for service ${service}:`, error);
      throw error;
    }
  }

  async getOpenAlertsCount(): Promise<number> {
    try {
      return await AlertModel.countDocuments({ status: "open" });
    } catch (error) {
      console.error("Error getting open alerts count:", error);
      throw error;
    }
  }

  async cleanupOldAlerts(days: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await AlertModel.deleteMany({
        createdAt: { $lt: cutoffDate },
        status: "resolved",
      }).exec();

      return result.deletedCount;
    } catch (error) {
      console.error("Error cleaning up old alerts:", error);
      throw error;
    }
  }
}

export default new AlertRepository();
