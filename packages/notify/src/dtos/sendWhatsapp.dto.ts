export class SendWhatsAppDto {
  phone: string;
  message: string;
  templateName?: string;
  parameters?: any[];

  constructor(data: Partial<SendWhatsAppDto>) {
    this.phone = data.phone!;
    this.message = data.message!;
    this.templateName = data.templateName;
    this.parameters = data.parameters || [];
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.phone) errors.push('Número de telefone é obrigatório');
    if (!this.message) errors.push('Mensagem é obrigatória');

    // Validação básica de telefone
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    if (this.phone && !phoneRegex.test(this.phone.replace(/\s/g, ''))) {
      errors.push('Número de telefone inválido');
    }

    return errors;
  }
}