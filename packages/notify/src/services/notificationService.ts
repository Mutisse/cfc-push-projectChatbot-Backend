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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Erro ao criar notificação: ${errorMessage}`);
    }
  }

  // Adicione os métodos que estão faltando
  async getNotificationById(id: string): Promise<INotification | null> {
    return await notificationRepository.findById(id);
  }

  async deleteNotification(id: string): Promise<INotification | null> {
    return await notificationRepository.delete(id);
  }

  async getAvailableNotificationTypes(): Promise<any[]> {
    // Retorna todos os tipos de notificação disponíveis
    return Object.values(NotificationType).map(type => ({
      value: type,
      label: this.getTypeLabel(type),
      description: this.getTypeDescription(type)
    }));
  }

  private getTypeLabel(type: NotificationType): string {
    const labels: Partial<Record<NotificationType, string>> = {
      [NotificationType.MEMBER_APPROVAL]: 'Aprovação de Membro',
      [NotificationType.MEMBER_REJECTION]: 'Rejeição de Membro',
      [NotificationType.MEMBER_PENDING]: 'Membro Pendente',
      [NotificationType.MEMBER_CANCELLED]: 'Membro Cancelado',
      [NotificationType.PRAYER_REQUEST_NEW]: 'Novo Pedido de Oração',
      [NotificationType.PRAYER_REQUEST_URGENT]: 'Pedido de Oração Urgente',
      [NotificationType.PRAYER_ANSWERED]: 'Oração Respondida',
      [NotificationType.VISIT_SCHEDULED]: 'Visita Agendada',
      [NotificationType.VISIT_REMINDER]: 'Lembrete de Visita',
      [NotificationType.VISIT_CANCELLED]: 'Visita Cancelada',
      [NotificationType.VISIT_COMPLETED]: 'Visita Concluída',
      [NotificationType.EVENT_CREATED]: 'Evento Criado',
      [NotificationType.EVENT_REMINDER]: 'Lembrete de Evento',
      [NotificationType.EVENT_CANCELLED]: 'Evento Cancelado',
      [NotificationType.BIRTHDAY_REMINDER]: 'Lembrete de Aniversário',
      [NotificationType.ANNIVERSARY_REMINDER]: 'Lembrete de Aniversário',
      [NotificationType.DONATION_RECEIVED]: 'Doação Recebida',
      [NotificationType.DONATION_THANK_YOU]: 'Agradecimento por Doação',
      [NotificationType.SYSTEM_ALERT]: 'Alerta do Sistema',
      [NotificationType.SYSTEM_MAINTENANCE]: 'Manutenção do Sistema',
      [NotificationType.GENERAL]: 'Geral',
      [NotificationType.WELCOME]: 'Boas-vindas',
      [NotificationType.PASSWORD_RESET]: 'Redefinição de Senha'
    };
    return labels[type] || this.formatTypeToLabel(type);
  }

  private getTypeDescription(type: NotificationType): string {
    const descriptions: Partial<Record<NotificationType, string>> = {
      [NotificationType.MEMBER_APPROVAL]: 'Notificação enviada quando um membro é aprovado',
      [NotificationType.MEMBER_REJECTION]: 'Notificação enviada quando um membro é rejeitado',
      [NotificationType.MEMBER_PENDING]: 'Notificação para administradores sobre novo pedido de cadastro',
      [NotificationType.MEMBER_CANCELLED]: 'Notificação quando um membro cancela cadastro',
      [NotificationType.PRAYER_REQUEST_NEW]: 'Notificação para equipe de oração sobre novo pedido',
      [NotificationType.PRAYER_REQUEST_URGENT]: 'Notificação urgente para equipe de oração',
      [NotificationType.PRAYER_ANSWERED]: 'Notificação quando uma oração é respondida',
      [NotificationType.VISIT_SCHEDULED]: 'Notificação sobre visita pastoral agendada',
      [NotificationType.VISIT_REMINDER]: 'Lembrete de visita pastoral',
      [NotificationType.VISIT_CANCELLED]: 'Notificação quando uma visita é cancelada',
      [NotificationType.VISIT_COMPLETED]: 'Notificação quando uma visita é concluída',
      [NotificationType.WELCOME]: 'Mensagem de boas-vindas para novos usuários'
    };
    return descriptions[type] || `Notificação do tipo ${type}`;
  }

  private formatTypeToLabel(type: NotificationType): string {
    // Converte snake_case para Title Case
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Corrigir o método markAsRead para receber userId
  async markAsRead(notificationId: string, userId: string): Promise<INotification | null> {
    return await notificationRepository.markAsRead(notificationId, userId);
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

  async createPrayerAnsweredNotification(prayerRequest: any): Promise<INotification> {
    const notificationData: INotificationCreate = {
      type: NotificationType.PRAYER_ANSWERED,
      title: 'Oração Respondida! 🙌',
      message: `Sua oração sobre "${prayerRequest.subject}" foi respondida. Louve ao Senhor!`,
      recipient: prayerRequest.userId,
      channels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP],
      data: {
        prayerRequestId: prayerRequest._id,
        subject: prayerRequest.subject,
        answeredAt: new Date(),
        testimony: prayerRequest.testimony
      }
    };

    return await this.createNotification(notificationData);
  }

  // NOTIFICAÇÕES PARA VISITAS PASTORAIS
  async createVisitScheduledNotification(visit: any): Promise<INotification[]> {
    const notifications: INotification[] = [];
    
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

  // NOTIFICAÇÃO DE BOAS-VINDAS
  async createWelcomeNotification(userId: string, userName: string): Promise<INotification> {
    const notificationData: INotificationCreate = {
      type: NotificationType.WELCOME,
      title: 'Bem-vindo à CFC Push! 🙏',
      message: `Olá ${userName}! Estamos felizes em tê-lo conosco. Faça parte da nossa família!`,
      recipient: userId,
      channels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP],
      data: {
        userId,
        userName,
        welcomeDate: new Date(),
        nextSteps: ['Complete seu perfil', 'Participe dos cultos', 'Conheça nossos eventos']
      }
    };

    return await this.createNotification(notificationData);
  }

  // GESTÃO DE NOTIFICAÇÕES
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    return await notificationRepository.findByRecipient(userId, page, limit);
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

  // SISTEMA DE ENTREGA (simplificado)
  async sendPendingNotifications(): Promise<{ sent: number; failed: number }> {
    const pendingNotifications = await notificationRepository.findPending();
    let sent = 0;
    let failed = 0;

    for (const notification of pendingNotifications) {
      try {
        console.log(`Enviando notificação: ${notification.title} para ${notification.recipient}`);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await notificationRepository.updateStatus(
          notification._id!, 
          NotificationStatus.SENT, 
          new Date()
        );
        sent++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Erro ao enviar notificação ${notification._id}:`, errorMessage);
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
    switch (group) {
      case RecipientGroup.ALL_ADMINS:
        return ['admin1', 'admin2'];
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