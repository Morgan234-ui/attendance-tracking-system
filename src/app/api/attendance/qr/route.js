import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import QRSession from '@/models/QRSession';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import Lecturer from '@/models/Lecturer';
import Course from '@/models/Course';
import { generateQRCode, verifyQRToken } from '@/lib/qr';
import { requireRole, handleApiError } from '@/lib/middleware';

export const POST = handleApiError(async (req) => {
  const auth = await requireRole(req, ['lecturer', 'admin']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const body = await req.json();
  const { courseId, expiresInMinutes = 15 } = body;

  if (!courseId) {
    return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
  }

  const lecturer = await Lecturer.findOne({ userId: auth.user.id });
  if (!lecturer) {
    return NextResponse.json({ error: 'Lecturer profile not found' }, { status: 404 });
  }

  // Deactivate existing QR sessions for this course today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await QRSession.updateMany(
    { courseId, isActive: true, date: { $gte: today } },
    { isActive: false }
  );

  const { token, qrDataUrl, expiresAt } = await generateQRCode(courseId, lecturer._id.toString(), expiresInMinutes);

  const qrSession = await QRSession.create({
    courseId,
    lecturerId: lecturer._id,
    date: new Date(),
    qrCode: token,
    expiresAt,
    isActive: true,
  });

  return NextResponse.json({
    data: {
      sessionId: qrSession._id,
      qrDataUrl,
      expiresAt,
    },
  }, { status: 201 });
});

// Scan QR code - student marks attendance
export const PUT = handleApiError(async (req) => {
  const auth = await requireRole(req, ['student']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const body = await req.json();
  const { qrToken } = body;

  if (!qrToken) {
    return NextResponse.json({ error: 'QR token is required' }, { status: 400 });
  }

  const student = await Student.findOne({ userId: auth.user.id });
  if (!student) {
    return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
  }

  // Find active QR session
  const qrSession = await QRSession.findOne({ qrCode: qrToken, isActive: true });
  if (!qrSession) {
    return NextResponse.json({ error: 'Invalid or expired QR code' }, { status: 400 });
  }

  if (new Date() > qrSession.expiresAt) {
    await QRSession.findByIdAndUpdate(qrSession._id, { isActive: false });
    return NextResponse.json({ error: 'QR code has expired' }, { status: 400 });
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
    return NextResponse.json({ error: 'Attendance already marked for today' }, { status: 409 });
  }

  // Mark attendance
  const record = await Attendance.create({
    studentId: student._id,
    courseId: qrSession.courseId,
    date: today,
    status: 'present',
    markedBy: qrSession.lecturerId,
    verificationMethod: 'qr_code',
  });

  return NextResponse.json({ data: record }, { status: 201 });
});
