import { MessageRepository } from '../Repository/MessageRepository';
import { ApiResponse, Message } from '../types/interfaces';

export class MessageService {
  private messageRepository: MessageRepository;

  constructor() {
    this.messageRepository = new MessageRepository();
  }

  async getMessages(userId?: string): Promise<ApiResponse<Message[]>> {
    try {
      const messages = await this.messageRepository.findAll({ 
        toUserId: userId,
        limit: 20 
      });

      return {
        success: true,
        message: 'Messages retrieved successfully',
        data: messages,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve messages',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getUnreadMessages(userId?: string): Promise<ApiResponse<Message[]>> {
    try {
      const messages = await this.messageRepository.findAll({ 
        toUserId: userId,
        read: false,
        limit: 10 
      });

      return {
        success: true,
        message: 'Unread messages retrieved successfully',
        data: messages,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve unread messages',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getUrgentMessages(): Promise<ApiResponse<Message[]>> {
    try {
      const messages = await this.messageRepository.getUrgentMessages();
      
      return {
        success: true,
        message: 'Urgent messages retrieved successfully',
        data: messages,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve urgent messages',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async markAsRead(messageId: string): Promise<ApiResponse<Message>> {
    try {
      const message = await this.messageRepository.markAsRead(messageId);
      
      if (!message) {
        return {
          success: false,
          message: 'Message not found',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        message: 'Message marked as read',
        data: message,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to mark message as read',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async createMessage(messageData: Partial<Message>): Promise<ApiResponse<Message>> {
    try {
      const message = await this.messageRepository.create(messageData);
      
      return {
        success: true,
        message: 'Message created successfully',
        data: message,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create message',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async deleteMessage(messageId: string): Promise<ApiResponse<void>> {
    try {
      const deleted = await this.messageRepository.delete(messageId);
      
      if (!deleted) {
        return {
          success: false,
          message: 'Message not found',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: true,
        message: 'Message deleted successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete message',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getUnreadCount(userId?: string): Promise<ApiResponse<number>> {
    try {
      const count = await this.messageRepository.getUnreadCount(userId);
      
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
export default new MessageService();