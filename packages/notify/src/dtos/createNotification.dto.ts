import { 
  NotificationType, 
  NotificationChannel, 
  RecipientGroup 
} from '../interfaces/notification.interface';

export class CreateNotificationDto {
  type: NotificationType;
  title: string;
  message: string;
  recipient: string | string[] | RecipientGroup;
  channels: NotificationChannel[];
  data?: any;

  constructor(data: Partial<CreateNotificationDto>) {
    this.type = data.type!;
    this.title = data.title!;
    this.message = data.message!;
    this.recipient = data.recipient!;
    this.channels = data.channels || [];
    this.data = data.data;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.type) errors.push('Tipo é obrigatório');
    if (!this.title || this.title.trim().length === 0) errors.push('Título é obrigatório');
    if (!this.message || this.message.trim().length === 0) errors.push('Mensagem é obrigatória');
    if (!this.recipient) errors.push('Destinatário é obrigatório');
    if (!this.channels || this.channels.length === 0) errors.push('Pelo menos um canal é obrigatório');

    if (this.title && this.title.length > 200) errors.push('Título muito longo (máx. 200 caracteres)');
    if (this.message && this.message.length > 1000) errors.push('Mensagem muito longa (máx. 1000 caracteres)');

    return errors;
  }
}