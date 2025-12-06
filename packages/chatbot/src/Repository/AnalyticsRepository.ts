// src/repositories/AnalyticsRepository.ts
import {
  DailyAnalyticsReport,
  IDailyAnalyticsReport,
} from "../models/DailyAnalyticsReport";

// src/repositories/AnalyticsRepository.ts - CORRIGIR INTERFACE
export interface DailyStats {
  date: string;
  totalSessions: number;
  totalMessages: number;
  uniqueUsers?: number; // ⬅️ Tornar opcional
  popularMenus: Map<string, number>;
  peakHours: number[];
  userRetention: Set<string>; // ⬅️ Já temos o Set
}

export class AnalyticsRepository {
  async saveDailyReport(stats: DailyStats): Promise<IDailyAnalyticsReport> {
    try {
      // Converte Map para array
      const popularMenusArray = Array.from(stats.popularMenus.entries())
        .map(([menuId, count]) => ({ menuId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Salva apenas top 10

      // Converte Set para array
      const userRetentionArray = Array.from(stats.userRetention);

      const reportData = {
        date: stats.date,
        totalSessions: stats.totalSessions,
        totalMessages: stats.totalMessages,
        uniqueUsers: stats.uniqueUsers,
        popularMenus: popularMenusArray,
        peakHours: stats.peakHours,
        userRetention: userRetentionArray,
        generatedAt: new Date(),
      };

      // Upsert - atualiza se existir, cria se não existir
      const report = await DailyAnalyticsReport.findOneAndUpdate(
        { date: stats.date },
        reportData,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(`✅ Relatório diário salvo no MongoDB: ${stats.date}`);
      return report!;
    } catch (error: any) {
      console.error("❌ Erro ao salvar relatório:", error.message);
      throw error;
    }
  }

  async getReportByDate(date: string): Promise<IDailyAnalyticsReport | null> {
    try {
      return await DailyAnalyticsReport.findOne({ date });
    } catch (error: any) {
      console.error("❌ Erro ao buscar relatório:", error.message);
      return null;
    }
  }

  async getReportsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<IDailyAnalyticsReport[]> {
    try {
      return await DailyAnalyticsReport.find({
        date: { $gte: startDate, $lte: endDate },
      }).sort({ date: 1 });
    } catch (error: any) {
      console.error("❌ Erro ao buscar relatórios por período:", error.message);
      return [];
    }
  }

  async getLastReports(limit: number = 30): Promise<IDailyAnalyticsReport[]> {
    try {
      return await DailyAnalyticsReport.find().sort({ date: -1 }).limit(limit);
    } catch (error: any) {
      console.error("❌ Erro ao buscar últimos relatórios:", error.message);
      return [];
    }
  }

  async getMostPopularMenus(days: number = 7): Promise<any> {
    try {
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split("T")[0];

      const reports = await this.getReportsByDateRange(startDateStr, endDate);

      // Agrega menus populares do período
      const menuCounts = new Map<string, { count: number; title?: string }>();

      reports.forEach((report) => {
        report.popularMenus.forEach((menu) => {
          const current = menuCounts.get(menu.menuId) || {
            count: 0,
            title: menu.title,
          };
          menuCounts.set(menu.menuId, {
            count: current.count + menu.count,
            title: menu.title || current.title,
          });
        });
      });

      // Ordena por contagem
      return Array.from(menuCounts.entries())
        .map(([menuId, data]) => ({
          menuId,
          title: data.title,
          totalCount: data.count,
          dailyAverage: (data.count / days).toFixed(1),
        }))
        .sort((a, b) => b.totalCount - a.totalCount)
        .slice(0, 10);
    } catch (error: any) {
      console.error("❌ Erro ao buscar menus populares:", error.message);
      return [];
    }
  }
}

export const analyticsRepository = new AnalyticsRepository();
