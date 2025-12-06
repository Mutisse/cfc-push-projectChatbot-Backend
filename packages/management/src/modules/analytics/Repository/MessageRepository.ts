import { Message, IMessage } from '../models/Message';

export interface MessageFilters {
  read?: boolean;
  urgent?: boolean;
  type?: string;
  toUserId?: string;
  toGroup?: string;
  limit?: number;
}

export class MessageRepository {
  async create(messageData: Partial<IMessage>): Promise<IMessage> {
    const message = new Message(messageData);
    return message.save();
  }

  async findById(id: string): Promise<IMessage | null> {
    return Message.findById(id).lean<IMessage>();
  }

  async findAll(filters: MessageFilters = {}): Promise<IMessage[]> {
    const query: any = {};
    
    if (filters.read !== undefined) query.read = filters.read;
    if (filters.urgent !== undefined) query.urgent = filters.urgent;
    if (filters.type) query.type = filters.type;
    if (filters.toUserId) query.toUserId = filters.toUserId;
    if (filters.toGroup) query.toGroup = filters.toGroup;

    const limit = filters.limit || 50;

    return Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<IMessage[]>();
  }

  async markAsRead(id: string): Promise<IMessage | null> {
    return Message.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    ).lean<IMessage>();
  }

  async getUnreadCount(toUserId?: string): Promise<number> {
    const query: any = { read: false };
    if (toUserId) query.toUserId = toUserId;

    return Message.countDocuments(query);
  }

  async getUrgentMessages(): Promise<IMessage[]> {
    return Message.find({ urgent: true, read: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean<IMessage[]>();
  }

  async delete(id: string): Promise<boolean> {
    const result = await Message.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}