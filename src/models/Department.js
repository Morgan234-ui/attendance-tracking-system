import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
    },
    faculty: {
      type: String,
      required: [true, "Faculty is required"],
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

departmentSchema.index({ faculty: 1 });

export default mongoose.models.Department ||
  mongoose.model("Department", departmentSchema);
