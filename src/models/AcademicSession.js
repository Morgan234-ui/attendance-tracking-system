import mongoose from 'mongoose';

const academicSessionSchema = new mongoose.Schema({
  sessionName: {
    type: String,
    required: [true, 'Session name is required'],
    trim: true,
  },
  semester: {
    type: String,
    enum: ['first', 'second'],
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

academicSessionSchema.index({ isActive: 1 });

export default mongoose.models.AcademicSession || mongoose.model('AcademicSession', academicSessionSchema);
