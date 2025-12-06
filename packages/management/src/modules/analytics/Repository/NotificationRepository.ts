import { Notification, INotification } from '../models/Notification';

export interface NotificationFilters {
  read?: boolean;
  priority?: string;
  userId?: string;
  limit?: number;
}

export class NotificationRepository {
  async create(notificationData: Partial<INotification>): Promise<INotification> {
    const notification = new Notification(notificationData);
    return notification.save();
  }

  async findById(id: string): Promise<INotification | null> {
    return Notification.findById(id).lean<INotification>();
  }

  async findAll(filters: NotificationFilters = {}): Promise<INotification[]> {
    const query: any = {};
    
    if (filters.read !== undefined) query.read = filters.read;
    if (filters.priority) query.priority = filters.priority;
    if (filters.userId) query.userId = filters.userId;

    const limit = filters.limit || 50;

    return Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<INotification[]>();
  }

  async markAsRead(id: string): Promise<INotification | null> {
    return Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    ).lean<INotification>();
  }

  async markAllAsRead(userId?: string): Promise<number> {
    const query: any = { read: false };
    if (userId) query.userId = userId;

    const result = await Notification.updateMany(
      query,
      { read: true }
    );

    return result.modifiedCount || 0;
  }

  async getUnreadCount(userId?: string): Promise<number> {
    const query: any = { read: false };
    if (userId) query.userId = userId;

    return Notification.countDocuments(query);
  }

  async delete(id: string): Promise<boolean> {
    const result = await Notification.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}