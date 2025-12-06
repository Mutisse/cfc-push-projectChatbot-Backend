import { Schema, model, Document, Types } from 'mongoose';
import { 
  NotificationType, 
  NotificationChannel, 
  NotificationStatus,
  RecipientGroup 
} from '../interfaces/notification.interface';

export interface INotificationDocument extends Document {
  _id: Types.ObjectId;
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

const NotificationSchema = new Schema({
  type: { 
    type: String, 
    enum: Object.values(NotificationType), 
    required: true,
    index: true
  },
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 200,
    index: 'text'
  },
  message: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 1000,
    index: 'text'
  },
  recipient: { 
    type: Schema.Types.Mixed, 
    required: true,
    index: true
  },
  channels: [{ 
    type: String, 
    enum: Object.values(NotificationChannel),
    required: true
  }],
  data: { 
    type: Schema.Types.Mixed,
    default: {}
  },
  status: { 
    type: String, 
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.PENDING,
    index: true
  },
  sentAt: { 
    type: Date,
    index: true
  },
  readAt: { 
    type: Date 
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

// Indexes compostos para performance
NotificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, status: 1 });
NotificationSchema.index({ channels: 1, status: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ 'data.memberRequestId': 1 });
NotificationSchema.index({ 'data.prayerRequestId': 1 });
NotificationSchema.index({ 'data.visitId': 1 });

// Middleware para validação antes de salvar
NotificationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === NotificationStatus.READ && !this.readAt) {
    this.readAt = new Date();
  }
  
  if (this.isModified('status') && this.status === NotificationStatus.SENT && !this.sentAt) {
    this.sentAt = new Date();
  }
  
  next();
});

// Método de instância para marcar como lida
NotificationSchema.methods.markAsRead = function() {
  this.status = NotificationStatus.READ;
  this.readAt = new Date();
  return this.save();
};

// Método de instância para reenviar
NotificationSchema.methods.retrySend = function() {
  this.status = NotificationStatus.PENDING;
  this.sentAt = undefined;
  return this.save();
};

// Método estático para buscar notificações por usuário
NotificationSchema.statics.findByUserId = function(userId: string, options: any = {}) {
  const { page = 1, limit = 20, status } = options;
  const skip = (page - 1) * limit;
  
  const query: any = {
    $or: [
      { recipient: userId },
      { recipient: { $in: [userId] } },
      { recipient: 'all_members' },
      { recipient: 'all_admins' }
    ]
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Método estático para contar não lidas por usuário
NotificationSchema.statics.countUnreadByUserId = function(userId: string) {
  return this.countDocuments({
    $or: [
      { recipient: userId },
      { recipient: { $in: [userId] } },
      { recipient: 'all_members' },
      { recipient: 'all_admins' }
    ],
    status: { $ne: NotificationStatus.READ }
  });
};

// Método estático para estatísticas
NotificationSchema.statics.getStats = function(userId?: string) {
  const matchStage: any = {};
  
  if (userId) {
    matchStage.$or = [
      { recipient: userId },
      { recipient: { $in: [userId] } },
      { recipient: 'all_members' },
      { recipient: 'all_admins' }
    ];
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              unread: {
                $sum: { $cond: [{ $ne: ['$status', NotificationStatus.READ] }, 1, 0] }
              },
              pending: {
                $sum: { $cond: [{ $eq: ['$status', NotificationStatus.PENDING] }, 1, 0] }
              },
              sent: {
                $sum: { $cond: [{ $eq: ['$status', NotificationStatus.SENT] }, 1, 0] }
              },
              failed: {
                $sum: { $cond: [{ $eq: ['$status', NotificationStatus.FAILED] }, 1, 0] }
              }
            }
          }
        ],
        byType: [
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 }
            }
          }
        ],
        byChannel: [
          { $unwind: '$channels' },
          {
            $group: {
              _id: '$channels',
              count: { $sum: 1 }
            }
          }
        ]
      }
    }
  ]);
};

export default model<INotificationDocument>('Notification', NotificationSchema);