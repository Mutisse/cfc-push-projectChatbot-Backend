import { INotification } from '../interfaces/notification.interface';

export class EmailProvider {
  private isConfigured: boolean = false;

  constructor() {
    // Configuração inicial - substitua com suas credenciais
    this.isConfigured = !!process.env.EMAIL_SERVICE;
  }

  async send(notification: INotification): Promise<boolean> {
    if (!this.isConfigured) {
      console.log('📧 Email Provider não configurado - simulação de envio');
      return true; // Simula sucesso em desenvolvimento
    }

    try {
      // TODO: Integrar com serviço de email real (SendGrid, MailChimp, etc.)
      console.log(`📧 Enviando email para: ${notification.recipient}`);
      console.log(`Assunto: ${notification.title}`);
      console.log(`Mensagem: ${notification.message}`);
      
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return false;
    }
  }

  async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getProviderInfo() {
    return {
      name: 'Email Provider',
      configured: this.isConfigured,
      channels: ['email']
    };
  }
}

export default new EmailProvider();