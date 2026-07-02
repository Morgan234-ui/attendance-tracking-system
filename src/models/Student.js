import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  matricNumber: {
    type: String,
    required: [true, 'Matric number is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  level: {
    type: String,
    required: true,
    enum: ['100', '200', '300', '400', '500', '600'],
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession',
  },
}, {
  timestamps: true,
});

studentSchema.index({ matricNumber: 1 });
studentSchema.index({ departmentId: 1 });

export default mongoose.models.Student || mongoose.model('Student', studentSchema);
