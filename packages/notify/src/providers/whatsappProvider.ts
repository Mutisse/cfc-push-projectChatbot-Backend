import { INotification } from '../interfaces/notification.interface';

export class WhatsAppProvider {
  private isConfigured: boolean = false;

  constructor() {
    // Configuração inicial - substitua com suas credenciais
    this.isConfigured = !!process.env.WHATSAPP_API_KEY;
  }

  async send(notification: INotification): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('💬 WhatsApp Provider não configurado - simulação de envio');
      return true; // Simula sucesso em desenvolvimento
    }

    try {
      // TODO: Integrar com API do WhatsApp (Twilio, AWS SNS, etc.)
      console.log(`💬 Enviando WhatsApp para: ${notification.recipient}`);
      console.log(`Mensagem: ${notification.title}\n${notification.message}`);
      
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar WhatsApp:', error);
      return false;
    }
  }

  async validatePhone(phone: string): Promise<boolean> {
    // Validação básica de número de telefone
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  async sendTemplateMessage(phone: string, templateName: string, parameters: any[]): Promise<boolean> {
    console.log(`💬 Enviando template ${templateName} para ${phone}`, parameters);
    return true;
  }

  getProviderInfo() {
    return {
      name: 'WhatsApp Provider',
      configured: this.isConfigured,
      channels: ['whatsapp']
    };
  }
}

export default new WhatsAppProvider();