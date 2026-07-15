import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    courseTitle: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
    },
    unit: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    lecturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecturer",
      default: null,
    },
    semester: {
      type: String,
      enum: ["first", "second", "both"],
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicSession",
    },
    level: {
      type: String,
      enum: ["100", "200", "300", "400", "500", "600"],
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ departmentId: 1 });
courseSchema.index({ lecturerId: 1 });

export default mongoose.models.Course || mongoose.model("Course", courseSchema);
