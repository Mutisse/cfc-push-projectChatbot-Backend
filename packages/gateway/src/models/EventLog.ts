import { Schema, model, Document } from 'mongoose';

export interface IEventLog extends Document {
  eventId: string;
  type: string;
  service: string;
  data: any;
  notificationId?: string;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  timestamp: Date;
}

const EventLogSchema = new Schema<IEventLog>({
  eventId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  service: { type: String, required: true },
  data: { type: Schema.Types.Mixed, default: {} },
  notificationId: String,
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  error: String,
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  collection: 'gateway_event_logs'
});

// Índices
EventLogSchema.index({ eventId: 1 });
EventLogSchema.index({ timestamp: -1 });
EventLogSchema.index({ status: 1 });
EventLogSchema.index({ service: 1, type: 1 });

export const EventLog = model<IEventLog>('EventLog', EventLogSchema);