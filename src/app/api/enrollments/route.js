import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Enrollment from '@/models/Enrollment';
import { requireRole, handleApiError } from '@/lib/middleware';

export const GET = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin', 'lecturer', 'student']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId') || '';
  const studentId = searchParams.get('studentId') || '';

  const query = {};
  if (courseId) query.courseId = courseId;
  if (studentId) query.studentId = studentId;

  const enrollments = await Enrollment.find(query)
    .populate('studentId')
    .populate('courseId');

  return NextResponse.json({ data: enrollments });
});

export const POST = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const body = await req.json();

  if (!body.studentId || !body.courseId) {
    return NextResponse.json({ error: 'Student and Course are required' }, { status: 400 });
  }

  const existing = await Enrollment.findOne({
    studentId: body.studentId,
    courseId: body.courseId,
  });

  if (existing) {
    return NextResponse.json({ error: 'Student already enrolled in this course' }, { status: 409 });
  }

  const enrollment = await Enrollment.create(body);
  return NextResponse.json({ data: enrollment }, { status: 201 });
});

export const DELETE = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const courseId = searchParams.get('courseId');

  if (!studentId || !courseId) {
    return NextResponse.json({ error: 'Student ID and Course ID are required' }, { status: 400 });
  }

  const result = await Enrollment.findOneAndDelete({ studentId, courseId });
  if (!result) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Enrollment removed' });
});
