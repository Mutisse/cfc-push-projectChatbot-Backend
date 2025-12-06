import { NotificationRepository } from '../Repository/NotificationRepository';
import { ApiResponse, Notification } from '../types/interfaces';

export class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  async getNotifications(userId?: string): Promise<ApiResponse<Notification[]>> {
    try {
      const notifications = await this.notificationRepository.findAll({ 
        userId,
        limit: 20 
      });

      return {
        success: true,
        message: 'Notifications retrieved successfully',
        data: notifications,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve notifications',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getUnreadNotifications(userId?: string): Promise<ApiResponse<Notification[]>> {
    try {
      const notifications = await this.notificationRepository.findAll({ 
        userId,
        read: false,
        limit: 10 
      });

      return {
        success: true,
        message: 'Unread notifications retrieved successfully',
        data: notifications,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve unread notifications',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    try {
      const notification = await this.notificationRepository.markAsRead(notificationId);
      
      if (!notification) {
        return {
          success: false,
          message: 'Notification not found',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        message: 'Notification marked as read',
        data: notification,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to mark notification as read',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async markAllAsRead(userId?: string): Promise<ApiResponse<{ count: number }>> {
    try {
      const count = await this.notificationRepository.markAllAsRead(userId);
      
      return {
        success: true,
        message: `${count} notifications marked as read`,
        data: { count },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async createNotification(notificationData: Partial<Notification>): Promise<ApiResponse<Notification>> {
    try {
      const notification = await this.notificationRepository.create(notificationData);
      
      return {
        success: true,
        message: 'Notification created successfully',
        data: notification,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create notification',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    try {
      const deleted = await this.notificationRepository.delete(notificationId);
      
      if (!deleted) {
        return {
          success: false,
          message: 'Notification not found',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        message: 'Notification deleted successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete notification',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getUnreadCount(userId?: string): Promise<ApiResponse<number>> {
    try {
      const count = await this.notificationRepository.getUnreadCount(userId);
      
      return {
        success: true,
        message: 'Unread count retrieved',
        data: count,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get unread count',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export default new NotificationService();