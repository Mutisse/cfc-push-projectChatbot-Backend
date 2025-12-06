export const WHATSAPP_TEMPLATES = {
  WELCOME_MESSAGE: 'welcome_message',
  PRAYER_CONFIRMATION: 'prayer_confirmation',
  EVENT_REMINDER: 'event_reminder',
  MEMBER_APPROVAL: 'member_approval',
  VISIT_REMINDER: 'visit_reminder'
};

export const WHATSAPP_CONFIG = {
  MAX_MESSAGE_LENGTH: 4096,
  MAX_MEDIA_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_MEDIA_TYPES: ['image/jpeg', 'image/png', 'audio/mpeg', 'video/mp4', 'application/pdf'],
  RATE_LIMIT: {
    MAX_MESSAGES_PER_MINUTE: 60,
    MAX_MESSAGES_PER_DAY: 1000
  }
};

export const WHATSAPP_ERROR_CODES = {
  INVALID_NUMBER: 'invalid_number',
  RATE_LIMITED: 'rate_limited',
  MEDIA_TOO_LARGE: 'media_too_large',
  UNAUTHORIZED: 'unauthorized',
  TEMPLATE_NOT_APPROVED: 'template_not_approved'
};