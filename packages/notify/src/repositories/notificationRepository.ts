import { FilterQuery, UpdateQuery, Types } from 'mongoose';
import Notification, { INotificationDocument } from '../models/Notification';
import { 
  INotification, 
  INotificationCreate, 
  INotificationUpdate,
  INotificationFilter,
  NotificationStatus,
  IPaginationOptions
} from '../interfaces/notification.interface';

// Helper function para errors
const handleRepositoryError = (operation: string, error: unknown): never => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  throw new Error(`Erro ao ${operation}: ${errorMessage}`);
};

export class NotificationRepository {
  
  // CREATE
  async create(notificationData: INotificationCreate): Promise<INotification> {
    try {
      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();
      return savedNotification.toObject() as INotification;
    } catch (error: unknown) {
      return handleRepositoryError('criar notificação', error);
    }
  }

  // READ
  async findById(id: string): Promise<INotification | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }
      
      const notification = await Notification.findById(id);
      return notification ? notification.toObject() as INotification : null;
    } catch (error: unknown) {
      return handleRepositoryError('buscar notificação', error);
    }
  }

  async findByRecipient(recipientId: string, page: number = 1, limit: number = 20): Promise<{ notifications: INotification[], total: number }> {
    try {
      const skip = (page - 1) * limit;
      
      const [notifications, total] = await Promise.all([
        Notification.findByUserId(recipientId, { page, limit }),
        Notification.countDocuments({
          $or: [
            { recipient: recipientId },
            { recipient: { $in: [recipientId] } },
            { recipient: 'all_members' },
            { recipient: 'all_admins' }
          ]
        })
      ]);

      return { 
        notifications: notifications.map(n => n.toObject() as INotification), 
        total 
      };
    } catch (error: unknown) {
      return handleRepositoryError('buscar notificações do usuário', error);
    }
  }

  async findWithFilters(filters: INotificationFilter, pagination: IPaginationOptions = { page: 1, limit: 20 }): Promise<{ notifications: INotification[], total: number }> {
    try {
      const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const skip = (page - 1) * limit;
      
      const query: FilterQuery<INotificationDocument> = {};

      // Filtros básicos
      if (filters.recipient) query.recipient = filters.recipient;
      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;
      if (filters.channels && filters.channels.length > 0) {
        query.channels = { $in: filters.channels };
      }
      
      // Filtro de data
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = filters.startDate;
        if (filters.endDate) query.createdAt.$lte = filters.endDate;
      }

      // Filtro de busca textual
      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Notification.countDocuments(query)
      ]);

      return { 
        notifications: notifications.map(n => n.toObject() as INotification), 
        total 
      };
    } catch (error: unknown) {
      return handleRepositoryError('buscar notificações com filtros', error);
    }
  }

  async findPending(): Promise<INotification[]> {
    try {
      const notifications = await Notification.find({ 
        status: NotificationStatus.PENDING 
      }).sort({ createdAt: 1 });
      
      return notifications.map(n => n.toObject() as INotification);
    } catch (error: unknown) {
      return handleRepositoryError('buscar notificações pendentes', error);
    }
  }

  // UPDATE
  async update(id: string, updateData: INotificationUpdate): Promise<INotification | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const notification = await Notification.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      return notification ? notification.toObject() as INotification : null;
    } catch (error: unknown) {
      return handleRepositoryError('atualizar notificação', error);
    }
  }

  async updateStatus(id: string, status: NotificationStatus, sentAt?: Date): Promise<INotification | null> {
    try {
      const update: UpdateQuery<INotificationDocument> = { status };
      if (sentAt) update.sentAt = sentAt;

      const notification = await Notification.findByIdAndUpdate(
        id, 
        update, 
        { new: true }
      );

      return notification ? notification.toObject() as INotification : null;
    } catch (error: unknown) {
      return handleRepositoryError('atualizar status da notificação', error);
    }
  }

  async markAsRead(id: string, userId: string): Promise<INotification | null> {
    try {
      // Primeiro verifica se o usuário tem permissão
      const notification = await Notification.findOne({
        _id: id,
        $or: [
          { recipient: userId },
          { recipient: { $in: [userId] } },
          { recipient: 'all_members' },
          { recipient: 'all_admins' }
        ]
      });

      if (!notification) {
        return null;
      }

      await notification.markAsRead();
      return notification.toObject() as INotification;
    } catch (error: unknown) {
      return handleRepositoryError('marcar notificação como lida', error);
    }
  }

  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    try {
      const result = await Notification.updateMany(
        { 
          $or: [
            { recipient: userId },
            { recipient: { $in: [userId] } },
            { recipient: 'all_members' },
            { recipient: 'all_admins' }
          ],
          status: { $ne: NotificationStatus.READ }
        },
        { 
          status: NotificationStatus.READ,
          readAt: new Date()
        }
      );

      return { modifiedCount: result.modifiedCount || 0 };
    } catch (error: unknown) {
      return handleRepositoryError('marcar todas as notificações como lidas', error);
    }
  }

  // DELETE
  async delete(id: string): Promise<INotification | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return null;
      }

      const notification = await Notification.findByIdAndUpdate(
        id,
        { status: NotificationStatus.DELETED },
        { new: true }
      );

      return notification ? notification.toObject() as INotification : null;
    } catch (error: unknown) {
      return handleRepositoryError('deletar notificação', error);
    }
  }

  async hardDelete(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        return false;
      }

      const result = await Notification.findByIdAndDelete(id);
      return !!result;
    } catch (error: unknown) {
      return handleRepositoryError('deletar permanentemente notificação', error);
    }
  }

  // STATS
  async getStats(recipientId?: string): Promise<any> {
    try {
      const stats = await Notification.getStats(recipientId);
      
      if (stats.length === 0 || !stats[0]) {
        return {
          total: 0,
          unread: 0,
          pending: 0,
          sent: 0,
          failed: 0,
          byType: {},
          byChannel: {}
        };
      }

      const data = stats[0];
      const totals = data.totals?.[0] || { total: 0, unread: 0, pending: 0, sent: 0, failed: 0 };
      
      const byType: Record<string, number> = {};
      if (data.byType) {
        data.byType.forEach((item: any) => {
          byType[item._id] = item.count;
        });
      }

      const byChannel: Record<string, number> = {};
      if (data.byChannel) {
        data.byChannel.forEach((item: any) => {
          byChannel[item._id] = item.count;
        });
      }

      return {
        total: totals.total || 0,
        unread: totals.unread || 0,
        pending: totals.pending || 0,
        sent: totals.sent || 0,
        failed: totals.failed || 0,
        byType,
        byChannel
      };
    } catch (error: unknown) {
      return handleRepositoryError('buscar estatísticas', error);
    }
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    try {
      return await Notification.countUnreadByUserId(recipientId);
    } catch (error: unknown) {
      return handleRepositoryError('contar notificações não lidas', error);
    }
  }

  // MÉTODOS ESPECÍFICOS
  async findByMemberRequest(memberRequestId: string): Promise<INotification[]> {
    try {
      const notifications = await Notification.find({
        'data.memberRequestId': memberRequestId
      }).sort({ createdAt: -1 });

      return notifications.map(n => n.toObject() as INotification);
    } catch (error: unknown) {
      return handleRepositoryError('buscar notificações do pedido de membro', error);
    }
  }

  async retryFailedNotifications(): Promise<{ retried: number }> {
    try {
      const result = await Notification.updateMany(
        { status: NotificationStatus.FAILED },
        { 
          status: NotificationStatus.PENDING,
          sentAt: undefined
        }
      );

      return { retried: result.modifiedCount || 0 };
    } catch (error: unknown) {
      return handleRepositoryError('reenviar notificações falhadas', error);
    }
  }
}

export default new NotificationRepository();