import rateLimit from 'express-rate-limit';

// Rate limiting para API pública
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: {
    success: false,
    error: 'Muitas requisições deste IP, tente novamente após 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting mais restrito para autenticação
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 tentativas de login por hora
  message: {
    success: false,
    error: 'Muitas tentativas de login, tente novamente após 1 hora'
  }
});

// Rate limiting para webhooks
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 webhooks por minuto
  message: {
    success: false,
    error: 'Muitos webhooks, aguarde um momento'
  }
});