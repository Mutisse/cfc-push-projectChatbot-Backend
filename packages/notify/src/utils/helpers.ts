import { NotificationType, NotificationChannel } from '../interfaces/notification.interface';

// Gerar template de mensagem baseado no tipo
export const generateNotificationTemplate = (
  type: NotificationType, 
  data: any
): { title: string; message: string } => {
  const templates = {
    [NotificationType.MEMBER_APPROVAL]: {
      title: '🎉 Cadastro Aprovado!',
      message: `Olá ${data.fullName}! Seu cadastro como membro da CFC Push foi aprovado. Bem-vindo à família!`
    },
    [NotificationType.MEMBER_REJECTION]: {
      title: 'Cadastro Não Aprovado',
      message: `Olá ${data.fullName}. Seu cadastro não pôde ser aprovado. ${data.reason || 'Entre em contato para mais informações.'}`
    },
    [NotificationType.MEMBER_PENDING]: {
      title: '📝 Novo Pedido de Cadastro',
      message: `Novo pedido de ${data.fullName} (${data.phone}) aguardando aprovação`
    },
    [NotificationType.PRAYER_REQUEST_NEW]: {
      title: '🙏 Novo Pedido de Oração',
      message: `${data.userName} precisa de oração: ${data.subject}`
    },
    [NotificationType.PRAYER_REQUEST_URGENT]: {
      title: '🚨 PEDIDO URGENTE de Oração!',
      message: `URGENTE: ${data.userName} precisa de oração: ${data.subject}`
    },
    [NotificationType.VISIT_SCHEDULED]: {
      title: '🏠 Visita Pastoral Agendada',
      message: `Visita agendada para família ${data.familyName} em ${formatDate(data.scheduledDate)}`
    }
  };

  return templates[type] || { title: 'Nova Notificação', message: 'Você tem uma nova notificação' };
};

// Validar canais de notificação
export const validateChannels = (channels: NotificationChannel[]): boolean => {
  const validChannels = Object.values(NotificationChannel);
  return channels.every(channel => validChannels.includes(channel));
};

// Formatar data para exibição
export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Gerar ID único para tracking
export const generateTrackingId = (): string => {
  return `NTF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Delay helper para simulação
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};