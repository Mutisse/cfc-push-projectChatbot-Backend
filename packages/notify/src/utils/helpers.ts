import { NotificationType } from '../interfaces/notification.interface';

export const getNotificationTemplate = (type: NotificationType) => {
  const templates: Partial<Record<NotificationType, { title: string; message: string }>> = {
    [NotificationType.MEMBER_APPROVAL]: { 
      title: 'Cadastro Aprovado!', 
      message: 'Seu cadastro como membro foi aprovado.' 
    },
    [NotificationType.MEMBER_REJECTION]: { 
      title: 'Cadastro Não Aprovado', 
      message: 'Seu cadastro não pôde ser aprovado no momento.' 
    },
    [NotificationType.MEMBER_PENDING]: { 
      title: 'Novo Pedido de Cadastro', 
      message: 'Há um novo pedido de cadastro aguardando aprovação.' 
    },
    [NotificationType.MEMBER_CANCELLED]: { 
      title: 'Cadastro Cancelado', 
      message: 'Seu cadastro foi cancelado.' 
    },
    [NotificationType.PRAYER_REQUEST_NEW]: { 
      title: 'Novo Pedido de Oração', 
      message: 'Há um novo pedido de oração.' 
    },
    [NotificationType.PRAYER_REQUEST_URGENT]: { 
      title: 'Pedido URGENTE de Oração', 
      message: 'Há um pedido de oração urgente!' 
    },
    [NotificationType.PRAYER_ANSWERED]: { 
      title: 'Oração Respondida!', 
      message: 'Uma oração foi respondida. Louve ao Senhor!' 
    },
    [NotificationType.VISIT_SCHEDULED]: { 
      title: 'Visita Agendada', 
      message: 'Uma visita pastoral foi agendada.' 
    },
    [NotificationType.VISIT_REMINDER]: { 
      title: 'Lembrete de Visita', 
      message: 'Você tem uma visita pastoral agendada para amanhã.' 
    },
    [NotificationType.VISIT_CANCELLED]: { 
      title: 'Visita Cancelada', 
      message: 'Uma visita pastoral foi cancelada.' 
    },
    [NotificationType.VISIT_COMPLETED]: { 
      title: 'Visita Concluída', 
      message: 'Uma visita pastoral foi concluída com sucesso.' 
    },
    [NotificationType.WELCOME]: { 
      title: 'Bem-vindo à CFC Push!', 
      message: 'Seja muito bem-vindo à nossa comunidade.' 
    }
  };

  return templates[type] || { title: 'Nova Notificação', message: 'Você tem uma nova notificação' };
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `55${cleaned.substring(1)}`;
  }
  
  if (cleaned.length === 10) {
    return `55${cleaned}`;
  }
  
  return cleaned;
};

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};