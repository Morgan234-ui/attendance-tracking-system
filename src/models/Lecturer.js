import mongoose from 'mongoose';

const lecturerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  staffId: {
    type: String,
    required: [true, 'Staff ID is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  title: {
    type: String,
    enum: ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.'],
    default: 'Mr.',
  },
}, {
  timestamps: true,
});

lecturerSchema.index({ staffId: 1 });
lecturerSchema.index({ departmentId: 1 });

export default mongoose.models.Lecturer || mongoose.model('Lecturer', lecturerSchema);
