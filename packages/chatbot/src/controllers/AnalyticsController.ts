// src/controllers/AnalyticsController.ts - VERSÃO CORRIGIDA
import { Request, Response } from "express";
import { analyticsRepository } from "../Repository/AnalyticsRepository";
import { analyticsService } from "../services/AnalyticsService";
import type { IDailyAnalyticsReport } from "../models/DailyAnalyticsReport";

export class AnalyticsController {
  async getTodayStats(req: Request, res: Response): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Tenta buscar do MongoDB
      let report = await analyticsRepository.getReportByDate(today);

      if (!report) {
        // Se não tem no MongoDB, pega da memória
        const memoryStats = analyticsService.getCurrentStats();

        // Converter Map para array com tipagem correta
        const popularMenusEntries = Array.from(
          memoryStats.popularMenus.entries()
        );
        const popularMenusArray = popularMenusEntries
          .map(([menuId, count]) => ({ menuId, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Criar objeto com a estrutura correta
        const mockReport: Partial<IDailyAnalyticsReport> = {
          date: today,
          totalSessions: memoryStats.totalSessions,
          totalMessages: memoryStats.totalMessages,
          uniqueUsers: memoryStats.userRetention.size,
          popularMenus: popularMenusArray,
          peakHours: memoryStats.peakHours,
          userRetention: Array.from(memoryStats.userRetention),
          generatedAt: new Date(),
        };

        // Usar type assertion para o mock
        report = mockReport as IDailyAnalyticsReport;
      }

      // Agora report não é null
      const safeReport = report!;

      res.json({
        success: true,
        date: safeReport.date,
        stats: {
          totalSessions: safeReport.totalSessions,
          totalMessages: safeReport.totalMessages,
          uniqueUsers: safeReport.uniqueUsers,
          avgMessagesPerSession:
            safeReport.totalSessions > 0
              ? (safeReport.totalMessages / safeReport.totalSessions).toFixed(1)
              : 0,
        },
        popularMenus: safeReport.popularMenus,
        peakHours: safeReport.peakHours.map((count: number, hour: number) => ({
          hour,
          count,
        })),
        generatedAt: safeReport.generatedAt,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getHistoricalStats(req: Request, res: Response): Promise<void> {
    try {
      const { days = 7 } = req.query;
      const daysNum = parseInt(days as string);

      const reports = await analyticsRepository.getLastReports(daysNum);

      const summary = {
        period: `${daysNum} dias`,
        totalDays: reports.length,
        totalSessions: reports.reduce((sum, r) => sum + r.totalSessions, 0),
        totalMessages: reports.reduce((sum, r) => sum + r.totalMessages, 0),
        avgDailyMessages:
          reports.length > 0
            ? (
                reports.reduce((sum, r) => sum + r.totalMessages, 0) /
                reports.length
              ).toFixed(0)
            : 0,
        avgDailyUsers:
          reports.length > 0
            ? (
                reports.reduce((sum, r) => sum + r.uniqueUsers, 0) /
                reports.length
              ).toFixed(0)
            : 0,
      };

      res.json({
        success: true,
        summary,
        dailyReports: reports.map((r) => ({
          date: r.date,
          totalMessages: r.totalMessages,
          uniqueUsers: r.uniqueUsers,
          totalSessions: r.totalSessions,
        })),
        mostPopularMenus:
          await analyticsRepository.getMostPopularMenus(daysNum),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getReportByDate(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.params;

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({
          success: false,
          error: "Formato de data inválido. Use YYYY-MM-DD",
        });
        return;
      }

      const report = await analyticsRepository.getReportByDate(date);

      if (!report) {
        res.status(404).json({
          success: false,
          error: `Relatório para ${date} não encontrado`,
        });
        return;
      }

      res.json({
        success: true,
        report,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getRealTimeStats(req: Request, res: Response): Promise<void> {
    try {
      const memoryStats = analyticsService.getCurrentStats();

      // Converter Map para array com tipagem explícita
      const popularMenusEntries: Array<[string, number]> = Array.from(
        memoryStats.popularMenus.entries()
      );
      const topMenus = popularMenusEntries
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([menuId, count]) => ({ menuId, count }));

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        realtime: {
          messagesToday: memoryStats.totalMessages,
          sessionsToday: memoryStats.totalSessions,
          uniqueUsers: memoryStats.userRetention.size,
          currentHour: new Date().getHours(),
          messagesThisHour: memoryStats.peakHours[new Date().getHours()],
        },
        today: memoryStats.date,
        peakHour: memoryStats.peakHours.indexOf(
          Math.max(...memoryStats.peakHours)
        ),
        topMenus,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
