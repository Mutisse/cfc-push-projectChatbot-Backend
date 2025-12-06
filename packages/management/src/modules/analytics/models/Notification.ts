import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['info', 'warning', 'success', 'error'],
      default: 'info'
    },
    read: { type: Boolean, default: false },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    actionUrl: { type: String },
    userId: { type: String }
  },
  { timestamps: true }
);

// Index para consultas
NotificationSchema.index({ read: 1, priority: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);