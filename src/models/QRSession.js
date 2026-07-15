import mongoose from "mongoose";

const qrSessionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lecturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecturer",
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    qrCode: {
      type: String,
      required: true,
    },
    qrDataUrl: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

qrSessionSchema.index({ courseId: 1, date: 1 });
qrSessionSchema.index({ expiresAt: 1 });

export default mongoose.models.QRSession ||
  mongoose.model("QRSession", qrSessionSchema);
