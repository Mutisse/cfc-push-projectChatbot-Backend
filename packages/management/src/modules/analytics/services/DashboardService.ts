// src/modules/analytics/services/DashboardService.ts
import { BusinessRepository } from '../Repository/BusinessRepository';
import {
  PrayerRequest,
  MemberRegistration,
  PastoralVisit,
  Notification
} from '../models/References';
import { ApiResponse } from '../types/interfaces';

export class DashboardService {
  private businessRepository: BusinessRepository;

  constructor() {
    this.businessRepository = new BusinessRepository();
  }

  async getDashboardMetrics(): Promise<ApiResponse<any>> {
    try {
      const [totals, overview] = await Promise.all([
        this.businessRepository.getBusinessTotals(),
        this.businessRepository.getBusinessOverview()
      ]);

      const urgentPrayers = await this.businessRepository.getUrgentPrayers();

      const metrics = [
        {
          icon: '👤',
          title: 'MEMBROS',
          value: totals.members.toString(),
          trend: await this.calculateMemberTrend(),
          trendIcon: await this.getTrendIcon('members', totals.members),
          trendClass: await this.getTrendClass('members', totals.members),
        },
        {
          icon: '🙏',
          title: 'ORAÇÕES',
          value: totals.prayers.toString(),
          trend: urgentPrayers > 0 ? `${urgentPrayers} urgentes` : 'Ativas',
          trendIcon: urgentPrayers > 0 ? '⚠️' : '🙏',
          trendClass: urgentPrayers > 0 ? 'text-orange' : 'text-green',
          subtitle: urgentPrayers > 0 ? '⚡ necessitam atenção' : undefined,
        },
        {
          icon: '🤝',
          title: 'ASSISTÊNCIAS',
          value: totals.assistance.toString(),
          trend: totals.assistance > 0 ? 'Pendentes' : 'Em dia',
          trendIcon: totals.assistance > 0 ? '⏳' : '✓',
          trendClass: totals.assistance > 0 ? 'text-red' : 'text-green',
        },
        {
          icon: '👥',
          title: 'SERVOS',
          value: totals.servants.toString(),
          trend: totals.servants > 0 ? 'Disponíveis' : 'Sem servos',
          trendIcon: totals.servants > 0 ? '✓' : '⚠️',
          trendClass: totals.servants > 0 ? 'text-blue' : 'text-orange',
        },
        {
          icon: '📊',
          title: 'SAÚDE SISTEMA',
          value: `${overview.systemHealth}%`,
          trend: this.getHealthStatus(overview.systemHealth),
          trendIcon: this.getHealthIcon(overview.systemHealth),
          trendClass: this.getHealthClass(overview.systemHealth),
        },
      ];

      return {
        success: true,
        message: 'Dashboard metrics retrieved successfully',
        data: metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve dashboard metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getBusinessDashboard(): Promise<ApiResponse<any>> {
    try {
      const [totals, overview] = await Promise.all([
        this.businessRepository.getBusinessTotals(),
        this.businessRepository.getBusinessOverview()
      ]);

      return {
        success: true,
        message: 'Business dashboard data retrieved successfully',
        data: {
          totals,
          overview,
          lastUpdated: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve business dashboard',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getRecentActivities(): Promise<ApiResponse<any>> {
    try {
      const recentPrayers = await PrayerRequest.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .lean() as any[];

      const recentMembers = await MemberRegistration.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .lean() as any[];

      const recentVisits = await PastoralVisit.find()
        .sort({ createdAt: -1 })
        .limit(2)
        .lean() as any[];

      const recentNotifications = await Notification.find()
        .sort({ createdAt: -1 })
        .limit(2)
        .lean() as any[];

      const activities = [
        ...recentPrayers.map(prayer => ({
          id: prayer._id.toString(),
          title: `Oração: ${prayer.title || prayer.name || 'Sem título'}`,
          description: prayer.description 
            ? (prayer.description.substring(0, 50) + (prayer.description.length > 50 ? '...' : ''))
            : 'Nova oração',
          timestamp: prayer.createdAt || new Date(),
          icon: '🙏',
          type: prayer.priority === 'urgent' ? 'warning' : 'info'
        })),
        ...recentMembers.map(member => ({
          id: member._id.toString(),
          title: `Novo membro: ${member.name || 'Anônimo'}`,
          description: member.email || 'Registro completo',
          timestamp: member.createdAt || new Date(),
          icon: '👤',
          type: 'success'
        })),
        ...recentVisits.map(visit => ({
          id: visit._id.toString(),
          title: `Visita: ${visit.location || visit.address || 'Local não especificado'}`,
          description: visit.purpose 
            ? (visit.purpose.substring(0, 50) + (visit.purpose.length > 50 ? '...' : ''))
            : 'Visita pastoral',
          timestamp: visit.createdAt || new Date(),
          icon: '🏠',
          type: 'info'
        })),
        ...recentNotifications.map(notif => ({
          id: notif._id.toString(),
          title: notif.title || 'Notificação',
          description: notif.message 
            ? (notif.message.substring(0, 50) + (notif.message.length > 50 ? '...' : ''))
            : 'Nova notificação',
          timestamp: notif.createdAt || new Date(),
          icon: '🔔',
          type: notif.type || 'info'
        }))
      ];

      activities.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA;
      });

      return {
        success: true,
        message: 'Recent activities retrieved successfully',
        data: activities.slice(0, 8),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao buscar atividades recentes:', error);
      return {
        success: true,
        message: 'Recent activities retrieved',
        data: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  async getQuickActions(): Promise<ApiResponse<any>> {
    try {
      const actions = [
        {
          id: '1',
          title: 'Nova Oração',
          description: 'Registrar nova solicitação de oração',
          icon: '🙏',
          route: '/prayers/new',
          color: 'primary'
        },
        {
          id: '2',
          title: 'Adicionar Membro',
          description: 'Cadastrar novo membro',
          icon: '👥',
          route: '/members/new',
          color: 'positive'
        },
        {
          id: '3',
          title: 'Agendar Visita',
          description: 'Agendar visita pastoral',
          icon: '📅',
          route: '/visits/schedule',
          color: 'accent'
        },
        {
          id: '4',
          title: 'Ver Notificações',
          description: 'Visualizar todas as notificações',
          icon: '🔔',
          route: '/notifications',
          color: 'warning'
        }
      ];

      return {
        success: true,
        message: 'Quick actions retrieved successfully',
        data: actions,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve quick actions',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  private async calculateMemberTrend(): Promise<string> {
    try {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const newMembersThisWeek = await MemberRegistration.countDocuments({
        createdAt: { $gte: lastWeek }
      });
      
      const totalMembers = await this.businessRepository.getTotalMembers();
      
      if (totalMembers === 0) return '0%';
      const growthRate = (newMembersThisWeek / totalMembers) * 100;
      return growthRate > 0 ? `+${Math.round(growthRate)}%` : '0%';
    } catch {
      return '+0%';
    }
  }

  private async getTrendIcon(metric: string, value: number): Promise<string> {
    if (value === 0) return '→';
    
    switch(metric) {
      case 'members': return '↑';
      case 'prayers': return '🙏';
      case 'servants': return '👥';
      default: return value > 0 ? '↑' : '↓';
    }
  }

  private async getTrendClass(metric: string, value: number): Promise<string> {
    if (value === 0) return 'text-grey';
    
    switch(metric) {
      case 'members': return 'text-green';
      case 'prayers': return 'text-blue';
      case 'servants': return 'text-blue';
      default: return value > 0 ? 'text-green' : 'text-red';
    }
  }

  private getHealthStatus(health: number): string {
    if (health >= 90) return 'Ótima';
    if (health >= 70) return 'Boa';
    if (health >= 50) return 'Atenção';
    return 'Crítica';
  }

  private getHealthIcon(health: number): string {
    if (health >= 90) return '❤️';
    if (health >= 70) return '👍';
    if (health >= 50) return '⚠️';
    return '🔴';
  }

  private getHealthClass(health: number): string {
    if (health >= 90) return 'text-green';
    if (health >= 70) return 'text-blue';
    if (health >= 50) return 'text-orange';
    return 'text-red';
  }
}

export default new DashboardService();