import whatsappProvider from '../providers/whatsappProvider';
import { NotificationType } from '../interfaces/notification.interface';

export class WhatsAppService {
  
  async sendWelcomeMessage(phone: string, userName: string): Promise<boolean> {
    const message = `Olá ${userName}! 🎉 Bem-vindo(a) à CFC Push - Igreja da Família Cristã!

Estamos muito felizes em tê-lo(a) conosco. Aqui você receberá:
• Notificações de cultos e eventos
• Pedidos de oração
• Avisos importantes
• Mensagens edificantes

Que Deus abençoe sua vida abundantemente! 🙏

_*CFC Push - Conectando vidas ao propósito de Deus*_`;

    // Simular envio - implemente com seu provedor real
    console.log(`💬 Enviando mensagem de boas-vindas para: ${phone}`);
    return await whatsappProvider.send({
      type: NotificationType.SYSTEM_ALERT,
      title: 'Mensagem de Boas-Vindas',
      message: message,
      recipient: phone,
      channels: ['whatsapp'],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);
  }

  async sendPrayerConfirmation(phone: string, prayerSubject: string): Promise<boolean> {
    const message = `🙏 *PEDIDO DE ORAÇÃO REGISTRADO*

Seu pedido de oração foi recebido:
*"${prayerSubject}"*

Nossa equipe de intercessão já está orando por você. Deus abençoe!

_*CFC Push - Igreja da Família Cristã*_`;

    return await whatsappProvider.send({
      type: NotificationType.PRAYER_REQUEST_NEW,
      title: 'Confirmação de Pedido de Oração',
      message: message,
      recipient: phone,
      channels: ['whatsapp'],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);
  }

  async sendEventReminder(phone: string, eventName: string, eventDate: string, location: string): Promise<boolean> {
    const message = `⛪ *LEMBRETE DE EVENTO*

*${eventName}*
📅 ${eventDate}
📍 ${location}

Não perca este momento abençoado! Traga sua família e amigos.

_*CFC Push - Igreja da Família Cristã*_`;

    return await whatsappProvider.send({
      type: NotificationType.EVENT_REMINDER,
      title: 'Lembrete de Evento',
      message: message,
      recipient: phone,
      channels: ['whatsapp'],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);
  }

  async sendMemberApproval(phone: string, memberName: string): Promise<boolean> {
    const message = `🎉 *CADASTRO APROVADO!*

Olá ${memberName}!

Seu cadastro como membro da *CFC Push* foi *APROVADO*! 

Bem-vindo(a) à nossa família! Estamos muito felizes em tê-lo(a) conosco.

Que sua jornada conosco seja repleta de bênçãos e crescimento espiritual.

_*CFC Push - Igreja da Família Cristã*_`;

    return await whatsappProvider.send({
      type: NotificationType.MEMBER_APPROVAL,
      title: 'Cadastro Aprovado',
      message: message,
      recipient: phone,
      channels: ['whatsapp'],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);
  }

  // Verificar se o número é válido para WhatsApp
  async validateWhatsAppNumber(phone: string): Promise<{ valid: boolean; exists: boolean }> {
    const isValid = await whatsappProvider.validatePhone(phone);
    
    // Em produção, você faria uma verificação real na API do WhatsApp
    return {
      valid: isValid,
      exists: isValid // Simulando que todos os números válidos existem
    };
  }
}

export default new WhatsAppService();