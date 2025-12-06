export interface WhatsAppMessage {
  to: string;
  body: string;
  from?: string;
  mediaUrl?: string;
}

export interface WhatsAppTemplate {
  name: string;
  language: {
    code: string;
  };
  components?: any[];
}

export interface WhatsAppValidationResult {
  valid: boolean;
  exists: boolean;
  formattedNumber?: string;
  countryCode?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp?: Date;
}

export interface WhatsAppWebhookPayload {
  From: string;
  To: string;
  Body: string;
  MessageType: string;
  Timestamp: string;
}