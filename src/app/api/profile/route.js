import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Student from "@/models/Student";
import Lecturer from "@/models/Lecturer";
import { hashPassword } from "@/lib/auth";
import { requireAuth, handleApiError } from "@/lib/middleware";

export const GET = handleApiError(async (req) => {
  const auth = await requireAuth(req);
  if (auth.error)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const user = await User.findById(auth.user.id).select(
    "name email role avatar"
  );
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const data = { user: user.toObject() };

  if (auth.user.role === "student") {
    const student = await Student.findOne({ userId: user._id }).populate(
      "departmentId",
      "name code"
    );
    data.profile = student;
  } else if (auth.user.role === "lecturer") {
    const lecturer = await Lecturer.findOne({ userId: user._id }).populate(
      "departmentId",
      "name code"
    );
    data.profile = lecturer;
  }

  return NextResponse.json({ data });
});

export const PUT = handleApiError(async (req) => {
  const auth = await requireAuth(req);
  if (auth.error)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const body = await req.json();
  const userUpdate = {};

  if (body.name) userUpdate.name = body.name;
  if (body.email) userUpdate.email = body.email.toLowerCase();
  if (body.password) userUpdate.password = await hashPassword(body.password);
  if (body.avatar !== undefined) userUpdate.avatar = body.avatar;

  const updatedUser = await User.findByIdAndUpdate(auth.user.id, userUpdate, {
    new: true,
    runValidators: true,
    context: "query",
  }).select("name email role avatar");

  if (!updatedUser) {
    return NextResponse.json({ error: "User update failed" }, { status: 500 });
  }

  const data = { user: updatedUser.toObject() };

  if (auth.user.role === "student") {
    const student = await Student.findOne({ userId: auth.user.id });
    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const studentUpdate = {};
    if (body.matricNumber)
      studentUpdate.matricNumber = body.matricNumber.toUpperCase();
    if (body.level) studentUpdate.level = body.level;
    if (body.departmentId) studentUpdate.departmentId = body.departmentId;

    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      studentUpdate,
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    ).populate("departmentId", "name code");

    data.profile = updatedStudent;
  } else if (auth.user.role === "lecturer") {
    const lecturer = await Lecturer.findOne({ userId: auth.user.id });
    if (!lecturer) {
      return NextResponse.json(
        { error: "Lecturer profile not found" },
        { status: 404 }
      );
    }

    const lecturerUpdate = {};
    if (body.staffId) lecturerUpdate.staffId = body.staffId.toUpperCase();
    if (body.title) lecturerUpdate.title = body.title;
    if (body.departmentId) lecturerUpdate.departmentId = body.departmentId;

    const updatedLecturer = await Lecturer.findByIdAndUpdate(
      lecturer._id,
      lecturerUpdate,
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    ).populate("departmentId", "name code");

    data.profile = updatedLecturer;
  }

  return NextResponse.json({ data });
});
