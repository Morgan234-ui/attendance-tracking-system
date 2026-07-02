import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import Lecturer from '@/models/Lecturer';
import Notification from '@/models/Notification';
import { requireRole, handleApiError } from '@/lib/middleware';

export const POST = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin', 'lecturer']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const body = await req.json();
  const { courseId, records, date, sessionId } = body;

  if (!courseId || !records || !Array.isArray(records)) {
    return NextResponse.json({ error: 'Course ID and records array are required' }, { status: 400 });
  }

  const lecturer = await Lecturer.findOne({ userId: auth.user.id });
  const markedBy = lecturer ? lecturer._id : null;

  const attendanceDate = date ? new Date(date) : new Date();
  attendanceDate.setHours(0, 0, 0, 0);

  const results = [];

  for (const record of records) {
    const existing = await Attendance.findOne({
      studentId: record.studentId,
      courseId,
      date: attendanceDate,
    });

    if (existing) {
      const updated = await Attendance.findByIdAndUpdate(
        existing._id,
        { status: record.status, markedBy, verificationMethod: 'manual', notes: record.notes },
        { new: true }
      );
      results.push(updated);
    } else {
      const created = await Attendance.create({
        studentId: record.studentId,
        courseId,
        date: attendanceDate,
        status: record.status,
        markedBy,
        sessionId,
        verificationMethod: 'manual',
        notes: record.notes,
      });
      results.push(created);
    }
  }

  // Check for low attendance warnings
  for (const record of records) {
    const totalClasses = await Attendance.countDocuments({ studentId: record.studentId, courseId });
    const presentClasses = await Attendance.countDocuments({
      studentId: record.studentId,
      courseId,
      status: { $in: ['present', 'late'] },
    });
    const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

    if (percentage < 75 && percentage > 0) {
      const student = await Student.findById(record.studentId).populate('userId');
      if (student) {
        await Notification.create({
          userId: student.userId._id,
          title: 'Low Attendance Warning',
          message: `Your attendance for course ${courseId} is ${percentage}%. Minimum required is 75%.`,
          type: 'warning',
          relatedId: courseId,
          relatedModel: 'Course',
        });
      }
    }
  }

  return NextResponse.json({ data: results, count: results.length }, { status: 201 });
});
