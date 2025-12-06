export interface ServiceConfig {
  name: string;
  url: string;
  prefix: string;
  timeout: number;
  requiresAuth: boolean;
  healthEndpoint?: string;
}

const services: ServiceConfig[] = [
  {
    name: 'management',
    url: process.env.MANAGEMENT_SERVICE_URL || 'http://localhost:3001',
    prefix: '/api/management',
    timeout: 15000,
    requiresAuth: true,
    healthEndpoint: '/health',
  },
  {
    name: 'chatbot',
    url: process.env.CHATBOT_SERVICE_URL || 'http://localhost:3002',
    prefix: '/api/chatbot',
    timeout: 15000,
    requiresAuth: true,
    healthEndpoint: '/health',
  },
  {
    name: 'notifications',
    url: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3003',
    prefix: '/api/notifications',
    timeout: 10000,
    requiresAuth: true,
    healthEndpoint: '/health',
  },
];

export default services;