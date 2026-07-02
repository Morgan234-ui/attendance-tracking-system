import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['warning', 'info', 'announcement', 'reminder'],
    default: 'info',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  relatedModel: {
    type: String,
    enum: ['Course', 'Attendance', 'Enrollment'],
  },
}, {
  timestamps: true,
});

notificationSchema.index({ userId: 1, isRead: 1 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
