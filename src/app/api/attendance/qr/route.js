import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import QRSession from "@/models/QRSession";
import Attendance from "@/models/Attendance";
import Student from "@/models/Student";
import Lecturer from "@/models/Lecturer";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import { generateQRCode } from "@/lib/qr";
import { requireRole, handleApiError } from "@/lib/middleware";

export const GET = handleApiError(async (req) => {
  const auth = await requireRole(req, ["lecturer", "admin", "student"]);
  if (auth.error)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("courseId");

  if (auth.user.role === "student") {
    const student = await Student.findOne({ userId: auth.user.id });
    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const enrollments = await Enrollment.find({
      studentId: student._id,
    }).select("courseId");
    const courseIds = enrollments.map((e) => e.courseId);

    const activeSessions = await QRSession.find({
      courseId: { $in: courseIds },
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .populate("courseId", "courseCode courseTitle")
      .sort({ expiresAt: 1 });

    return NextResponse.json({ data: { sessions: activeSessions } });
  }

  if (!courseId) {
    return NextResponse.json(
      { error: "Course ID is required" },
      { status: 400 }
    );
  }

  const lecturer = await Lecturer.findOne({ userId: auth.user.id });
  if (!lecturer) {
    return NextResponse.json(
      { error: "Lecturer profile not found" },
      { status: 404 }
    );
  }

  let qrSession = await QRSession.findOne({
    courseId,
    lecturerId: lecturer._id,
    isActive: true,
  });
  if (qrSession && new Date() > qrSession.expiresAt) {
    await QRSession.findByIdAndUpdate(qrSession._id, { isActive: false });
    qrSession = null;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const scannedRecords = qrSession
    ? await Attendance.find({
        courseId,
        markedBy: lecturer._id,
        verificationMethod: "qr_code",
        date: { $gte: todayStart, $lt: todayEnd },
      })
        .populate({ path: "studentId", populate: "userId" })
        .sort({ createdAt: 1 })
    : [];

  return NextResponse.json({ data: { session: qrSession, scannedRecords } });
});

export const POST = handleApiError(async (req) => {
  const auth = await requireRole(req, ["lecturer", "admin"]);
  if (auth.error)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const body = await req.json();
  const { courseId, expiresInMinutes = 15 } = body;

  if (!courseId) {
    return NextResponse.json(
      { error: "Course ID is required" },
      { status: 400 }
    );
  }

  const lecturer = await Lecturer.findOne({ userId: auth.user.id });
  if (!lecturer) {
    return NextResponse.json(
      { error: "Lecturer profile not found" },
      { status: 404 }
    );
  }

  const existingSession = await QRSession.findOne({
    lecturerId: lecturer._id,
    isActive: true,
  });
  if (existingSession) {
    if (new Date() > existingSession.expiresAt) {
      await QRSession.findByIdAndUpdate(existingSession._id, {
        isActive: false,
      });
    } else {
      return NextResponse.json(
        {
          error:
            "You already have an open session. Close it before opening another.",
        },
        { status: 409 }
      );
    }
  }

  const { token, qrDataUrl, expiresAt } = await generateQRCode(
    courseId,
    lecturer._id.toString(),
    expiresInMinutes
  );

  const qrSession = await QRSession.create({
    courseId,
    lecturerId: lecturer._id,
    date: new Date(),
    qrCode: token,
    qrDataUrl,
    expiresAt,
    isActive: true,
  });

  const sessionData = await QRSession.findById(qrSession._id).lean();

  return NextResponse.json(
    {
      data: sessionData,
    },
    { status: 201 }
  );
});

export const DELETE = handleApiError(async (req) => {
  const auth = await requireRole(req, ["lecturer", "admin"]);
  if (auth.error)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  const lecturer = await Lecturer.findOne({ userId: auth.user.id });
  if (!lecturer) {
    return NextResponse.json(
      { error: "Lecturer profile not found" },
      { status: 404 }
    );
  }

  const qrSession = await QRSession.findById(sessionId);
  if (!qrSession || !qrSession.isActive) {
    return NextResponse.json(
      { error: "Session not found or already closed" },
      { status: 404 }
    );
  }

  if (
    auth.user.role === "lecturer" &&
    qrSession.lecturerId.toString() !== lecturer._id.toString()
  ) {
    return NextResponse.json(
      { error: "Unauthorized to close this session" },
      { status: 403 }
    );
  }

  await QRSession.findByIdAndUpdate(sessionId, { isActive: false });
  return NextResponse.json({ message: "Session closed" });
});

// Scan QR code - student marks attendance
export const PUT = handleApiError(async (req) => {
  const auth = await requireRole(req, ["student"]);
  if (auth.error)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const body = await req.json();
  const { qrToken } = body;

  if (!qrToken) {
    return NextResponse.json(
      { error: "QR token is required" },
      { status: 400 }
    );
  }

  const student = await Student.findOne({ userId: auth.user.id });
  if (!student) {
    return NextResponse.json(
      { error: "Student profile not found" },
      { status: 404 }
    );
  }

  let tokenValue = qrToken;
  let parsedToken = null;

  if (typeof qrToken === "string") {
    try {
      parsedToken = JSON.parse(qrToken);
      if (parsedToken?.token) {
        tokenValue = parsedToken.token;
      }
    } catch {
      // Keep tokenValue as raw string
    }
  }

  const qrSession = await QRSession.findOne({
    qrCode: tokenValue,
    isActive: true,
  });

  if (!qrSession) {
    return NextResponse.json(
      { error: "Invalid or expired QR code" },
      { status: 400 }
    );
  }

  if (new Date() > qrSession.expiresAt) {
    await QRSession.findByIdAndUpdate(qrSession._id, { isActive: false });
    return NextResponse.json({ error: "QR code has expired" }, { status: 400 });
  }

  if (
    parsedToken &&
    parsedToken.courseId &&
    qrSession.courseId.toString() !== parsedToken.courseId
  ) {
    return NextResponse.json(
      { error: "Invalid QR code course" },
      { status: 400 }
    );
  }

  if (
    parsedToken &&
    parsedToken.lecturerId &&
    qrSession.lecturerId.toString() !== parsedToken.lecturerId
  ) {
    return NextResponse.json(
      { error: "Invalid QR code lecturer" },
      { status: 400 }
    );
  }

  // Check if already marked
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await Attendance.findOne({
    studentId: student._id,
    courseId: qrSession.courseId,
    date: today,
  });

  if (existing) {
    return NextResponse.json(
      { error: "Attendance already marked for today" },
      { status: 409 }
    );
  }

  // Mark attendance
  let record;
  try {
    record = await Attendance.create({
      studentId: student._id,
      courseId: qrSession.courseId,
      date: today,
      status: "present",
      markedBy: qrSession.lecturerId,
      verificationMethod: "qr_code",
    });
  } catch (error) {
    // Concurrent scans can both pass the findOne check; the unique index
    // on (studentId, courseId, date) rejects the loser with code 11000.
    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "Attendance already marked for today" },
        { status: 409 }
      );
    }
    throw error;
  }

  return NextResponse.json({ data: record }, { status: 201 });
});
