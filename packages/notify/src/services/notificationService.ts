import notificationRepository from '../repositories/notificationRepository';
import { 
  INotification, 
  INotificationCreate, 
  NotificationType, 
  NotificationChannel,
  NotificationStatus,
  RecipientGroup 
} from '../interfaces/notification.interface';

export class NotificationService {
  
  // Criação básica de notificação
  async createNotification(notificationData: INotificationCreate): Promise<INotification> {
    try {
      return await notificationRepository.create(notificationData);
    } catch (error) {
      throw new Error(`Erro ao criar notificação: ${error.message}`);
    }
  }

  // NOTIFICAÇÕES ESPECÍFICAS PARA MEMBER REGISTRATIONS
  async createMemberApprovalNotification(memberRequest: any): Promise<INotification> {
    const notificationData: INotificationCreate = {
      type: NotificationType.MEMBER_APPROVAL,
      title: 'Cadastro Aprovado! 🎉',
      message: `Seu cadastro como membro da CFC Push foi aprovado. Bem-vindo à família!`,
      recipient: memberRequest.userId,
      channels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP],
      data: {
        memberRequestId: memberRequest._id,
        fullName: memberRequest.fullName,
        approvedAt: new Date(),
        welcomeMessage: 'Estamos felizes em tê-lo conosco! Participe dos nossos cultos e eventos.'
      }
    };

    return await this.createNotification(notificationData);
  }

  async createMemberRejectionNotification(memberRequest: any, reason?: string): Promise<INotification> {
    const notificationData: INotificationCreate = {
      type: NotificationType.MEMBER_REJECTION,
      title: 'Cadastro Não Aprovado',
      message: `Seu cadastro não pôde ser aprovado no momento. ${reason || 'Entre em contato para mais informações.'}`,
      recipient: memberRequest.userId,
      channels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP],
      data: {
        memberRequestId: memberRequest._id,
        fullName: memberRequest.fullName,
        rejectedAt: new Date(),
        reason: reason
      }
    };

    return await this.createNotification(notificationData);
  }

  async notifyNewMemberRequest(memberRequest: any): Promise<INotification[]> {
    const notifications: INotification[] = [];
    
    // Notificação para administradores
    const adminNotification: INotificationCreate = {
      type: NotificationType.MEMBER_PENDING,
      title: 'Novo Pedido de Cadastro 📝',
      message: `${memberRequest.fullName} solicitou cadastro como membro. Telefone: ${memberRequest.phone}`,
      recipient: RecipientGroup.ALL_ADMINS,
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      data: {
        memberRequestId: memberRequest._id,
        fullName: memberRequest.fullName,
        phone: memberRequest.phone,
        submittedAt: memberRequest.createdAt,
        urgency: 'medium'
      }
    };

    notifications.push(await this.createNotification(adminNotification));
    return notifications;
  }

  // NOTIFICAÇÕES PARA PEDIDOS DE ORAÇÃO
  async createPrayerRequestNotification(prayerRequest: any): Promise<INotification> {
    const isUrgent = prayerRequest.urgency === 'high';
    
    const notificationData: INotificationCreate = {
      type: isUrgent ? NotificationType.PRAYER_REQUEST_URGENT : NotificationType.PRAYER_REQUEST_NEW,
      title: isUrgent ? '🙏 Pedido URGENTE de Oração!' : 'Novo Pedido de Oração',
      message: `${prayerRequest.userName} precisa de oração: ${prayerRequest.subject}`,
      recipient: RecipientGroup.PRAYER_TEAM,
      channels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP],
      data: {
        prayerRequestId: prayerRequest._id,
        userName: prayerRequest.userName,
        subject: prayerRequest.subject,
        description: prayerRequest.description,
        urgency: prayerRequest.urgency,
        category: prayerRequest.category
      }
    };

    return await this.createNotification(notificationData);
  }

  // NOTIFICAÇÕES PARA VISITAS PASTORAIS
  async createVisitScheduledNotification(visit: any): Promise<INotification[]> {
    const notifications: INotification[] = [];
    
    // Notificação para o pastor
    const pastorNotification: INotificationCreate = {
      type: NotificationType.VISIT_SCHEDULED,
      title: 'Visita Pastoral Agendada 🏠',
      message: `Visita agendada para ${visit.familyName} em ${visit.scheduledDate}`,
      recipient: visit.pastorId,
      channels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP],
      data: {
        visitId: visit._id,
        familyName: visit.familyName,
        address: visit.address,
        phone: visit.phone,
        scheduledDate: visit.scheduledDate,
        notes: visit.notes
      }
    };

    // Notificação para a família (se tiver contato)
    if (visit.familyContact) {
      const familyNotification: INotificationCreate = {
        type: NotificationType.VISIT_SCHEDULED,
        title: 'Visita Pastoral Confirmada ⛪',
        message: `Pastor ${visit.pastorName} visitará sua família em ${visit.scheduledDate}`,
        recipient: visit.familyContact,
        channels: [NotificationChannel.WHATSAPP],
        data: {
          visitId: visit._id,
          pastorName: visit.pastorName,
          scheduledDate: visit.scheduledDate,
          preparationTips: 'Esteja à vontade para compartilhar suas necessidades espirituais.'
        }
      };
      notifications.push(await this.createNotification(familyNotification));
    }

    notifications.push(await this.createNotification(pastorNotification));
    return notifications;
  }

  // GESTÃO DE NOTIFICAÇÕES
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    return await notificationRepository.findByRecipient(userId, page, limit);
  }

  async markAsRead(notificationId: string): Promise<INotification | null> {
    return await notificationRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    return await notificationRepository.markAllAsRead(userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await notificationRepository.getUnreadCount(userId);
  }

  async getNotificationStats(userId?: string) {
    return await notificationRepository.getStats(userId);
  }

  // SISTEMA DE ENTREGA (simplificado - será expandido com providers)
  async sendPendingNotifications(): Promise<{ sent: number; failed: number }> {
    const pendingNotifications = await notificationRepository.findPending();
    let sent = 0;
    let failed = 0;

    for (const notification of pendingNotifications) {
      try {
        // TODO: Integrar com providers específicos (WhatsApp, Email, etc.)
        console.log(`Enviando notificação: ${notification.title} para ${notification.recipient}`);
        
        // Simular envio
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await notificationRepository.updateStatus(
          notification._id!, 
          NotificationStatus.SENT, 
          new Date()
        );
        sent++;
      } catch (error) {
        console.error(`Erro ao enviar notificação ${notification._id}:`, error);
        await notificationRepository.updateStatus(
          notification._id!, 
          NotificationStatus.FAILED
        );
        failed++;
      }
    }

    return { sent, failed };
  }

  // MÉTODOS AUXILIARES
  private async resolveRecipientGroup(group: RecipientGroup): Promise<string[]> {
    // TODO: Integrar com serviço de usuários para resolver grupos
    // Por enquanto, retornamos arrays vazios - será implementado depois
    switch (group) {
      case RecipientGroup.ALL_ADMINS:
        return ['admin1', 'admin2']; // IDs fictícios
      case RecipientGroup.PRAYER_TEAM:
        return ['intercessor1', 'intercessor2'];
      case RecipientGroup.PASTORS:
        return ['pastor1', 'pastor2'];
      case RecipientGroup.ALL_MEMBERS:
        return ['member1', 'member2', 'member3'];
      default:
        return [];
    }
  }
}

export default new NotificationService();