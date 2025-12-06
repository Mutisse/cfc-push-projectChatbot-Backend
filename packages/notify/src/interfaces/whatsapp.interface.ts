export interface IWhatsAppProvider {
  send(message: IWhatsAppMessage): Promise<boolean>;
  sendTemplate(template: IWhatsAppTemplate): Promise<boolean>;
  validateNumber(phone: string): Promise<IValidationResult>;
  getProviderStatus(): IProviderStatus;
}

export interface IWhatsAppMessage {
  to: string;
  body: string;
  from?: string;
  mediaUrl?: string;
  persistent?: boolean;
}

export interface IWhatsAppTemplate {
  to: string;
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
}

export interface IValidationResult {
  valid: boolean;
  exists: boolean;
  formattedNumber?: string;
}

export interface IProviderStatus {
  configured: boolean;
  connected: boolean;
  service: string;
  lastChecked?: Date;
}