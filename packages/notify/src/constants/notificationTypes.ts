import { NotificationType, NotificationChannel, RecipientGroup } from '../interfaces/notification.interface';

// Mapeamento de tipos para templates padrão
export const NOTIFICATION_TEMPLATES: Record<NotificationType, { 
  defaultTitle: string; 
  defaultMessage: string;
  requiredChannels: NotificationChannel[];
}> = {
  [NotificationType.MEMBER_APPROVAL]: {
    defaultTitle: 'Cadastro Aprovado 🎉',
    defaultMessage: 'Seu cadastro como membro foi aprovado. Bem-vindo à família!',
    requiredChannels: [NotificationChannel.IN_APP]
  },
  [NotificationType.MEMBER_REJECTION]: {
    defaultTitle: 'Cadastro Não Aprovado',
    defaultMessage: 'Seu cadastro não pôde ser aprovado no momento.',
    requiredChannels: [NotificationChannel.IN_APP]
  },
  [NotificationType.MEMBER_PENDING]: {
    defaultTitle: 'Novo Pedido de Cadastro 📝',
    defaultMessage: 'Novo pedido de cadastro aguardando aprovação',
    requiredChannels: [NotificationChannel.IN_APP, NotificationChannel.PUSH]
  },
  [NotificationType.PRAYER_REQUEST_NEW]: {
    defaultTitle: 'Novo Pedido de Oração 🙏',
    defaultMessage: 'Alguém precisa de suas orações',
    requiredChannels: [NotificationChannel.IN_APP]
  },
  [NotificationType.PRAYER_REQUEST_URGENT]: {
    defaultTitle: '🚨 Pedido URGENTE de Oração!',
    defaultMessage: 'Pedido urgente de oração necessita atenção imediata',
    requiredChannels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.WHATSAPP]
  },
  [NotificationType.VISIT_SCHEDULED]: {
    defaultTitle: 'Visita Pastoral Agendada 🏠',
    defaultMessage: 'Nova visita pastoral agendada',
    requiredChannels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP]
  },
  [NotificationType.VISIT_REMINDER]: {
    defaultTitle: 'Lembrete de Visita Pastoral ⏰',
    defaultMessage: 'Lembrete: visita pastoral programada para breve',
    requiredChannels: [NotificationChannel.WHATSAPP]
  },
  [NotificationType.VISIT_CANCELLED]: {
    defaultTitle: 'Visita Pastoral Cancelada ❌',
    defaultMessage: 'Visita pastoral foi cancelada',
    requiredChannels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP]
  },
  [NotificationType.VISIT_COMPLETED]: {
    defaultTitle: 'Visita Pastoral Concluída ✅',
    defaultMessage: 'Visita pastoral foi concluída com sucesso',
    requiredChannels: [NotificationChannel.IN_APP]
  },
  [NotificationType.EVENT_REMINDER]: {
    defaultTitle: 'Lembrete de Evento ⛪',
    defaultMessage: 'Evento da igreja acontecerá em breve',
    requiredChannels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP]
  },
  [NotificationType.EVENT_CANCELLED]: {
    defaultTitle: 'Evento Cancelado ❌',
    defaultMessage: 'Evento da igreja foi cancelado',
    requiredChannels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP]
  },
  [NotificationType.EVENT_NEW]: {
    defaultTitle: 'Novo Evento 🎊',
    defaultMessage: 'Novo evento anunciado na igreja',
    requiredChannels: [NotificationChannel.IN_APP]
  },
  [NotificationType.SPECIAL_EVENT]: {
    defaultTitle: 'Evento Especial ✨',
    defaultMessage: 'Evento especial da igreja',
    requiredChannels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP, NotificationChannel.EMAIL]
  },
  [NotificationType.SYSTEM_ALERT]: {
    defaultTitle: 'Alerta do Sistema ⚠️',
    defaultMessage: 'Alerta importante do sistema',
    requiredChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
  },
  [NotificationType.BACKUP_COMPLETE]: {
    defaultTitle: 'Backup Concluído 💾',
    defaultMessage: 'Backup do sistema realizado com sucesso',
    requiredChannels: [NotificationChannel.EMAIL]
  },
  [NotificationType.USAGE_REPORT]: {
    defaultTitle: 'Relatório de Uso �',
    defaultMessage: 'Relatório mensal de uso do sistema',
    requiredChannels: [NotificationChannel.EMAIL]
  },
  [NotificationType.SECURITY_ALERT]: {
    defaultTitle: 'Alerta de Segurança 🛡️',
    defaultMessage: 'Alerta de segurança do sistema',
    requiredChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP]
  },
  [NotificationType.PRAYER_ANSWERED]: {
    defaultTitle: 'Oração Respondida! 🙌',
    defaultMessage: 'Sua oração foi respondida! Glória a Deus!',
    requiredChannels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP]
  },
  [NotificationType.MEMBER_CANCELLED]: {
    defaultTitle: 'Pedido Cancelado ❌',
    defaultMessage: 'Pedido de cadastro foi cancelado',
    requiredChannels: [NotificationChannel.IN_APP]
  }
};

// Configurações de grupos de destinatários
export const RECIPIENT_GROUP_CONFIG: Record<RecipientGroup, {
  description: string;
  defaultChannels: NotificationChannel[];
}> = {
  [RecipientGroup.ALL_MEMBERS]: {
    description: 'Todos os membros cadastrados',
    defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP]
  },
  [RecipientGroup.ALL_ADMINS]: {
    description: 'Todos os administradores do sistema',
    defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.PUSH, NotificationChannel.EMAIL]
  },
  [RecipientGroup.PASTORS]: {
    description: 'Pastores e líderes espirituais',
    defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP, NotificationChannel.PUSH]
  },
  [RecipientGroup.PRAYER_TEAM]: {
    description: 'Grupo de intercessão e oração',
    defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.WHATSAPP]
  },
  [RecipientGroup.EVENT_COORDINATORS]: {
    description: 'Coordenadores de eventos',
    defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
  },
  [RecipientGroup.TECHNICAL_TEAM]: {
    description: 'Equipe técnica e desenvolvedores',
    defaultChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP]
  }
};