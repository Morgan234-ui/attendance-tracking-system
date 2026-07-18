import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Student from "@/models/Student";
import Attendance from "@/models/Attendance";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import QRSession from "@/models/QRSession";
import { requireRole, handleApiError } from "@/lib/middleware";
import mongoose from "mongoose";

export const GET = handleApiError(async (req) => {
  const auth = await requireRole(req, ["student"]);
  if (auth.error)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const courseId = searchParams.get("courseId");
  const courseCode = searchParams.get("courseCode");

  const student = await Student.findOne({ userId: auth.user.id });
  if (!student) {
    return NextResponse.json(
      { error: "Student profile not found" },
      { status: 404 }
    );
  }

  const query = { studentId: student._id };

  if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
    query.courseId = courseId;
  } else if (courseCode) {
    const course = await Course.findOne({
      courseCode: new RegExp(`^${courseCode}$`, "i"),
    });
    if (!course) {
      return NextResponse.json({
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }
    query.courseId = course._id;
  }

  const total = await Attendance.countDocuments(query);
  const records = await Attendance.find(query)
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("courseId", "courseCode courseTitle");

  return NextResponse.json({
    data: records,
    pagination: {
      page,
      limit,
      total,
      totalPages: total > 0 ? Math.ceil(total / limit) : 1,
    },
  });
});
