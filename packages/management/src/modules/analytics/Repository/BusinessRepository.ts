// src/modules/analytics/repositories/BusinessRepository.ts
import {
  MemberRegistration,
  PrayerRequest,
  ServantRegistration,
  PastoralVisit,
  ChatbotSession,
  Message,
  ServerControlLog
} from '../models/References';

export class BusinessRepository {
  // Modelo para assistências (coleção correta)
  private getAssistanceModel() {
    try {
      // Tenta obter o modelo correto para assistências
      return require('mongoose').model('assistancerequests');
    } catch {
      console.log('⚠️ Modelo assistancerequests não encontrado, usando referência básica');
      const mongoose = require('mongoose');
      return mongoose.models.assistancerequests || 
        mongoose.model('assistancerequests', new mongoose.Schema({}, { strict: false }));
    }
  }

  async getTotalMembers(): Promise<number> {
    try {
      // Conta membros ATIVOS (com status active ou sem status)
      const count = await MemberRegistration.countDocuments({
        $or: [
          { status: 'active' },
          { status: { $exists: false } }, // Se não tiver status, conta
          { active: true }
        ]
      });
      console.log('📊 Membros ATIVOS encontrados:', count);
      return count;
    } catch (error) {
      console.error('❌ Erro ao contar membros:', error);
      return 0;
    }
  }

  async getActivePrayers(): Promise<number> {
    try {
      // Conta apenas orações ATIVAS/PENDENTES
      const count = await PrayerRequest.countDocuments({
        $or: [
          { status: { $in: ['pending', 'open', 'in_progress', 'active'] } },
          { status: { $exists: false } }, // Se não tiver status, não conta como ativa
          { resolved: false },
          { completed: false }
        ]
      });
      console.log('📊 Orações ATIVAS encontradas:', count);
      return count;
    } catch (error) {
      console.error('❌ Erro ao contar orações:', error);
      return 0;
    }
  }

  async getUrgentPrayers(): Promise<number> {
    try {
      // Conta orações URGENTES
      const count = await PrayerRequest.countDocuments({
        $or: [
          { priority: 'urgent' },
          { urgency: 'high' },
          { status: 'urgent' },
          { urgent: true }
        ]
      });
      console.log('📊 Orações URGENTES encontradas:', count);
      return count;
    } catch (error) {
      console.error('❌ Erro ao contar orações urgentes:', error);
      return 0;
    }
  }

  async getAvailableServants(): Promise<number> {
    try {
      // Conta apenas servos DISPONÍVEIS/ATIVOS
      const count = await ServantRegistration.countDocuments({
        $or: [
          { status: 'active' },
          { available: true },
          { active: true },
          // Se não tiver status nem available, assume que está disponível?
          // { status: { $exists: false } },
          // { available: { $exists: false } }
        ]
      });
      console.log('📊 Servos DISPONÍVEIS encontrados:', count);
      return count;
    } catch (error) {
      console.error('❌ Erro ao contar servos disponíveis:', error);
      return 0;
    }
  }

  async getTotalAssistanceRequests(): Promise<number> {
    try {
      // Conta apenas assistências PENDENTES/ATIVAS
      const AssistanceRequest = this.getAssistanceModel();
      const count = await AssistanceRequest.countDocuments({
        $or: [
          { status: { $in: ['pending', 'open', 'in_progress', 'active'] } },
          { status: { $exists: false } }, // Se não tiver status, não conta
          { resolved: false },
          { completed: false }
        ]
      });
      console.log('📊 Assistências PENDENTES encontradas:', count);
      return count;
    } catch (error) {
      console.error('❌ Erro ao contar assistências:', error);
      return 0;
    }
  }

  async getPastoralVisitsCount(): Promise<number> {
    try {
      // Conta apenas visitas CONCLUÍDAS
      const count = await PastoralVisit.countDocuments({
        $or: [
          { status: 'completed' },
          { completed: true },
          // Se quiser contar todas as visitas (incluindo agendadas):
          // { status: { $exists: false } }
        ]
      });
      console.log('📊 Visitas CONCLUÍDAS encontradas:', count);
      return count;
    } catch (error) {
      console.error('❌ Erro ao contar visitas:', error);
      return 0;
    }
  }

  async getTotalUsers(): Promise<number> {
    try {
      // Usuários únicos do chatbot
      const count = await ChatbotSession.countDocuments();
      console.log('📊 Usuários chatbot encontrados:', count);
      return count;
    } catch (error) {
      console.error('❌ Erro ao contar usuários:', error);
      return 0;
    }
  }

  async getActiveUsersToday(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const count = await ChatbotSession.countDocuments({
        updatedAt: { $gte: today }
      });
      console.log('📊 Usuários ATIVOS HOJE:', count);
      return count;
    } catch (error) {
      console.error('❌ Erro ao contar usuários ativos hoje:', error);
      return 0;
    }
  }

  async getTotalMessages(): Promise<number> {
    try {
      const count = await Message.countDocuments();
      console.log('📊 Total mensagens:', count);
      return count;
    } catch (error) {
      console.error('❌ Erro ao contar mensagens:', error);
      return 0;
    }
  }

  async getSystemHealth(): Promise<number> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const recentErrors = await ServerControlLog.countDocuments({
        $or: [
          { level: 'error' },
          { type: 'error' },
          { status: 'error' }
        ],
        timestamp: { $gte: oneHourAgo }
      });
      
      console.log('📊 Erros recentes (última hora):', recentErrors);
      
      if (recentErrors === 0) return 100;
      if (recentErrors <= 5) return 85;
      if (recentErrors <= 10) return 70;
      return 50;
    } catch (error) {
      console.error('❌ Erro ao verificar saúde do sistema:', error);
      return 50;
    }
  }

  async getConversionRate(): Promise<number> {
    try {
      const totalSessions = await this.getTotalUsers();
      const completedMembers = await MemberRegistration.countDocuments({
        $or: [
          { registrationComplete: true },
          { status: 'completed' },
          { verified: true },
          // Se não tiver esses campos, conta como membro ativo
          { 
            $and: [
              { registrationComplete: { $exists: false } },
              { status: { $exists: false } },
              { verified: { $exists: false } }
            ]
          }
        ]
      });
      
      console.log('📊 Taxa conversão:', {
        totalSessions,
        completedMembers,
        rate: totalSessions > 0 ? Math.round((completedMembers / totalSessions) * 100) : 0
      });
      
      if (totalSessions === 0) return 0;
      return Math.round((completedMembers / totalSessions) * 100);
    } catch (error) {
      console.error('❌ Erro ao calcular taxa de conversão:', error);
      return 0;
    }
  }

  async getAverageResponseTime(): Promise<number> {
    try {
      const result = await Message.aggregate([
        {
          $match: {
            $or: [
              { responseTime: { $exists: true, $gt: 0 } },
              { processingTime: { $exists: true, $gt: 0 } }
            ],
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { 
              $avg: {
                $ifNull: ["$responseTime", "$processingTime"]
              }
            }
          }
        }
      ]);
      
      const avgTime = result[0]?.avgResponseTime 
        ? Math.round(result[0].avgResponseTime) 
        : 120;
      
      console.log('📊 Tempo médio resposta:', avgTime);
      return avgTime;
    } catch (error) {
      console.error('❌ Erro ao calcular tempo médio de resposta:', error);
      return 120;
    }
  }

  async getBusinessTotals() {
    try {
      console.log('📊 === BUSCANDO TOTAIS DE NEGÓCIO (ATIVOS) ===');
      
      const [
        prayers,
        members,
        servants,
        assistance,
        visits
      ] = await Promise.all([
        this.getActivePrayers(),
        this.getTotalMembers(),
        this.getAvailableServants(),
        this.getTotalAssistanceRequests(),
        this.getPastoralVisitsCount()
      ]);

      console.log('📊 Resultados finais (ATIVOS):', {
        prayers,
        members,
        servants,
        assistance,
        visits
      });

      return {
        prayers,
        members,
        servants,
        assistance,
        visits
      };
    } catch (error) {
      console.error('❌ Erro ao buscar totais de negócio:', error);
      return {
        prayers: 0,
        members: 0,
        servants: 0,
        assistance: 0,
        visits: 0
      };
    }
  }

  async getBusinessOverview() {
    try {
      console.log('📊 === BUSCANDO VISÃO GERAL ===');
      
      const [
        totalUsers,
        activeToday,
        totalMessages,
        systemHealth,
        conversionRate,
        averageResponseTime
      ] = await Promise.all([
        this.getTotalUsers(),
        this.getActiveUsersToday(),
        this.getTotalMessages(),
        this.getSystemHealth(),
        this.getConversionRate(),
        this.getAverageResponseTime()
      ]);

      console.log('📊 Resultados visão geral:', {
        totalUsers,
        activeToday,
        totalMessages,
        conversionRate,
        averageResponseTime,
        systemHealth
      });

      return {
        totalUsers,
        activeToday,
        totalMessages,
        conversionRate,
        averageResponseTime,
        systemHealth
      };
    } catch (error) {
      console.error('❌ Erro ao buscar visão geral de negócio:', error);
      return {
        totalUsers: 0,
        activeToday: 0,
        totalMessages: 0,
        conversionRate: 0,
        averageResponseTime: 0,
        systemHealth: 0
      };
    }
  }
}

export default new BusinessRepository();