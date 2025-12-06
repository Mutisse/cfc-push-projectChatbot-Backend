// src/services/AnalyticsService.ts - VERSÃO ATUALIZADA
import { analyticsRepository, DailyStats } from '../Repository/AnalyticsRepository';

export class AnalyticsService {
  private dailyStats: DailyStats;
  
  constructor() {
    this.dailyStats = {
      date: new Date().toISOString().split('T')[0],
      totalSessions: 0,
      totalMessages: 0,
      popularMenus: new Map<string, number>(),
      peakHours: new Array(24).fill(0),
      userRetention: new Set<string>()
    };
    
    console.log("📊 AnalyticsService iniciado (com persistência)");
    
    // Agenda relatório diário às 23:55
    this.scheduleDailyReport();
  }
  
  // 🎯 Agenda relatório diário
  private scheduleDailyReport(): void {
    const now = new Date();
    const reportTime = new Date();
    
    // Configura para 23:55
    reportTime.setHours(23, 55, 0, 0);
    
    // Se já passou, agenda para amanhã
    if (now.getTime() > reportTime.getTime()) {
      reportTime.setDate(reportTime.getDate() + 1);
    }
    
    const timeUntilReport = reportTime.getTime() - now.getTime();
    
    setTimeout(async () => {
      await this.exportDailyReport();
      // Agenda para todos os dias
      setInterval(async () => await this.exportDailyReport(), 24 * 60 * 60 * 1000);
    }, timeUntilReport);
    
    console.log(`📅 Relatório diário agendado para: ${reportTime.toLocaleString()}`);
  }
  
  // 🎯 Registra uma interação
  trackInteraction(phoneNumber: string, menuId?: string): void {
    this.dailyStats.totalMessages++;
    this.dailyStats.userRetention.add(phoneNumber);
    
    // Horário de pico
    const hour = new Date().getHours();
    this.dailyStats.peakHours[hour]++;
    
    // Conta uso de menus
    if (menuId) {
      const currentCount = this.dailyStats.popularMenus.get(menuId) || 0;
      this.dailyStats.popularMenus.set(menuId, currentCount + 1);
    }
    
    // Log a cada 50 mensagens
    if (this.dailyStats.totalMessages % 50 === 0) {
      console.log(`📈 ${this.dailyStats.totalMessages} mensagens hoje`);
    }
  }
  
  // 🎯 Registra nova sessão
  trackNewSession(phoneNumber: string): void {
    this.dailyStats.totalSessions++;
    this.dailyStats.userRetention.add(phoneNumber);
  }
  
  // 🎯 Exporta relatório diário (SALVA NO MONGODB)
  async exportDailyReport(): Promise<void> {
    console.log("\n" + "=".repeat(50));
    console.log("📊 RELATÓRIO DIÁRIO DE ANALYTICS");
    console.log("=".repeat(50));
    
    console.log(`📅 Data: ${this.dailyStats.date}`);
    console.log(`👥 Sessões únicas: ${this.dailyStats.userRetention.size}`);
    console.log(`💬 Total mensagens: ${this.dailyStats.totalMessages}`);
    console.log(`📈 Média mensagens/sessão: ${this.dailyStats.totalSessions > 0 
      ? (this.dailyStats.totalMessages / this.dailyStats.totalSessions).toFixed(1) 
      : '0'}`);
    
    // Top 5 menus mais usados
    const topMenus = [...this.dailyStats.popularMenus.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    if (topMenus.length > 0) {
      console.log("\n🏆 TOP 5 MENUS MAIS USADOS:");
      topMenus.forEach(([menuId, count], index) => {
        console.log(`  ${index + 1}. ${menuId}: ${count} vezes`);
      });
    }
    
    // Horário de pico
    const peakHour = this.dailyStats.peakHours.indexOf(Math.max(...this.dailyStats.peakHours));
    console.log(`\n⏰ Horário de pico: ${peakHour}:00 (${this.dailyStats.peakHours[peakHour]} mensagens)`);
    
    console.log("=".repeat(50));
    
    // 🎯 SALVA NO MONGODB
    try {
      await analyticsRepository.saveDailyReport(this.dailyStats);
      console.log("💾 Relatório salvo no MongoDB");
    } catch (error: any) {
      console.error("❌ Erro ao salvar relatório:", error.message);
    }
    
    console.log("=".repeat(50) + "\n");
    
    // Reseta estatísticas para o próximo dia
    this.resetDailyStats();
  }
  
  // 🎯 Reseta estatísticas diárias
  private resetDailyStats(): void {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.dailyStats = {
      date: tomorrow.toISOString().split('T')[0],
      totalSessions: 0,
      totalMessages: 0,
      popularMenus: new Map(),
      peakHours: new Array(24).fill(0),
      userRetention: new Set()
    };
    
    console.log(`🔄 Estatísticas resetadas para: ${this.dailyStats.date}`);
  }
  
  // 🎯 Obtém estatísticas atuais
  getCurrentStats(): DailyStats {
    return {
      ...this.dailyStats,
      uniqueUsers: this.dailyStats.userRetention.size
    };
  }
}

export const analyticsService = new AnalyticsService();