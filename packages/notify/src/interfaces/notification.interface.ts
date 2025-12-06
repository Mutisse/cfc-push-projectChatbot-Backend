export enum NotificationType {
  // Member Registrations
  MEMBER_APPROVAL = 'member_approval',
  MEMBER_REJECTION = 'member_rejection', 
  MEMBER_PENDING = 'member_pending',
  MEMBER_CANCELLED = 'member_cancelled',
  
  // Prayer Requests
  PRAYER_REQUEST_NEW = 'prayer_request_new',
  PRAYER_REQUEST_URGENT = 'prayer_request_urgent',
  PRAYER_ANSWERED = 'prayer_answered',
  
  // Pastoral Visits
  VISIT_SCHEDULED = 'visit_scheduled',
  VISIT_REMINDER = 'visit_reminder',
  VISIT_CANCELLED = 'visit_cancelled',
  VISIT_COMPLETED = 'visit_completed',
  
  // Events and Schedule
  EVENT_REMINDER = 'event_reminder',
  EVENT_CANCELLED = 'event_cancelled',
  EVENT_NEW = 'event_new',
  SPECIAL_EVENT = 'special_event',
  
  // System and Admin
  SYSTEM_ALERT = 'system_alert',
  BACKUP_COMPLETE = 'backup_complete',
  USAGE_REPORT = 'usage_report',
  SECURITY_ALERT = 'security_alert'
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  PUSH = 'push'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read',
  DELETED = 'deleted'
}

export enum RecipientGroup {
  ALL_MEMBERS = 'all_members',
  ALL_ADMINS = 'all_admins',
  PASTORS = 'pastors',
  PRAYER_TEAM = 'prayer_team',
  EVENT_COORDINATORS = 'event_coordinators',
  TECHNICAL_TEAM = 'technical_team'
}

export interface INotification {
  _id?: string;
  type: NotificationType;
  title: string;
  message: string;
  recipient: string | string[] | RecipientGroup;
  channels: NotificationChannel[];
  data?: any;
  status: NotificationStatus;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationCreate {
  type: NotificationType;
  title: string;
  message: string;
  recipient: string | string[] | RecipientGroup;
  channels: NotificationChannel[];
  data?: any;
}

export interface INotificationUpdate {
  title?: string;
  message?: string;
  status?: NotificationStatus;
  readAt?: Date;
}

export interface INotificationFilter {
  recipient?: string;
  type?: NotificationType;
  status?: NotificationStatus;
  channels?: NotificationChannel[];
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface INotificationStats {
  total: number;
  unread: number;
  pending: number;
  sent: number;
  failed: number;
  byType: Record<string, number>;
  byChannel: Record<string, number>;
}

export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface INotificationResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Interface para provedores de notificação
export interface INotificationProvider {
  name: string;
  channel: NotificationChannel;
  send(notification: INotification): Promise<boolean>;
  validate(recipient: string): Promise<boolean>;
  getStatus(): { configured: boolean; available: boolean };
}

// Interface para templates de notificação
export interface INotificationTemplate {
  type: NotificationType;
  defaultTitle: string;
  defaultMessage: string;
  variables: string[];
  requiredChannels: NotificationChannel[];
}