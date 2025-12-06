// Tipos para o módulo de analytics
export interface DashboardMetric {
  icon: string;
  title: string;
  value: string;
  trend: string;
  trendIcon: string;
  trendClass: string;
  subtitle?: string;
}

export interface BusinessOverview {
  totalUsers: number;
  activeToday: number;
  totalMessages: number;
  conversionRate: number;
  averageResponseTime: number;
  systemHealth: number;
}

export interface BusinessTotals {
  prayers: number;
  members: number;
  assistance: number;
  servants: number;
  visits: number;
}

export interface BusinessData {
  overview?: BusinessOverview;
  totals?: BusinessTotals;
  error?: string;
}

export interface RecentActivity {
  icon: string;
  text: string;
  time: string;
  type: string;
}

export interface QuickAction {
  icon: string;
  label: string;
  color: string;
  action: string;
}

export interface UrgentPrayer {
  icon: string;
  title: string;
  description: string;
  prayingCount: number;
}

export interface Notification {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

export interface Message {
  from: string;
  fromRole: string;
  subject: string;
  content: string;
  type: 'pastoral' | 'prayer' | 'assistance' | 'system';
  read: boolean;
  urgent: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}