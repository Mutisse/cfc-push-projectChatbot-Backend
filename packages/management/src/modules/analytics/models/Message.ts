import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  from: string;
  fromRole: string;
  subject: string;
  content: string;
  type: 'pastoral' | 'prayer' | 'assistance' | 'system';
  read: boolean;
  urgent: boolean;
  toUserId?: string;
  toGroup?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    from: { type: String, required: true },
    fromRole: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['pastoral', 'prayer', 'assistance', 'system'],
      default: 'system'
    },
    read: { type: Boolean, default: false },
    urgent: { type: Boolean, default: false },
    toUserId: { type: String },
    toGroup: { type: String }
  },
  { timestamps: true }
);

// Index para consultas
MessageSchema.index({ read: 1, urgent: 1 });
MessageSchema.index({ toUserId: 1, createdAt: -1 });
MessageSchema.index({ type: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);