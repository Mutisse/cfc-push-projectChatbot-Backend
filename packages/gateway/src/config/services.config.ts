import config from '../config/app.config';

export interface ServiceConfig {
  name: string;
  url: string;
  prefix: string;
  timeout: number;
  requiresAuth: boolean;
  healthEndpoint: string;
}

// Baseado na configuração principal
const services: ServiceConfig[] = [
  {
    name: 'management',
    url: config.SERVERS.management.url,
    prefix: '/api/management',
    timeout: config.SERVERS.management.timeout,
    requiresAuth: true,
    healthEndpoint: '/health',
  },
  {
    name: 'notify',
    url: config.SERVERS.notify.url,
    prefix: '/api/notifications',
    timeout: config.SERVERS.notify.timeout,
    requiresAuth: true,
    healthEndpoint: '/health',
  },
  {
    name: 'monitoring',
    url: config.SERVERS.monitoring.url,
    prefix: '/api/monitoring',
    timeout: config.SERVERS.monitoring.timeout,
    requiresAuth: true,
    healthEndpoint: '/health',
  },
  {
    name: 'chatbot',
    url: config.SERVERS.chatbot.url,
    prefix: '/api/chatbot',
    timeout: config.SERVERS.chatbot.timeout,
    requiresAuth: true,
    healthEndpoint: '/health',
  },
];

export default services;