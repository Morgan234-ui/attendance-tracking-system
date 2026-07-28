import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Enrollment from '@/models/Enrollment';
import Student from '@/models/Student';
import Lecturer from '@/models/Lecturer';
import Course from '@/models/Course';
import { requireRole, handleApiError } from '@/lib/middleware';

// Resolve the Student document for the logged-in student user
async function getOwnStudent(userId) {
  return Student.findOne({ userId });
}

export const GET = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin', 'lecturer', 'student']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId') || '';
  const studentId = searchParams.get('studentId') || '';
  const role = auth.user.role;

  const query = {};
  if (courseId) query.courseId = courseId;
  if (studentId) query.studentId = studentId;

  // Scope results by role so users only see what they're allowed to
  if (role === 'student') {
    const student = await getOwnStudent(auth.user.id);
    if (!student) return NextResponse.json({ data: [] });
    query.studentId = student._id;
  } else if (role === 'lecturer') {
    const lecturer = await Lecturer.findOne({ userId: auth.user.id });
    if (!lecturer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const myCourses = await Course.find({ lecturerId: lecturer._id }).select('_id');
    const myCourseIds = myCourses.map((c) => c._id.toString());
    if (courseId) {
      if (!myCourseIds.includes(courseId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      query.courseId = { $in: myCourseIds };
    }
  }

  const enrollments = await Enrollment.find(query)
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
    .populate('courseId');

  return NextResponse.json({ data: enrollments });
});

export const POST = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin', 'student']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const body = await req.json();

  if (!body.courseId) {
    return NextResponse.json({ error: 'Course is required' }, { status: 400 });
  }

  // Students may only enroll themselves; admins enroll any student
  let studentId;
  if (auth.user.role === 'student') {
    const student = await getOwnStudent(auth.user.id);
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }
    studentId = student._id;
  } else {
    if (!body.studentId) {
      return NextResponse.json({ error: 'Student is required' }, { status: 400 });
    }
    studentId = body.studentId;
  }

  const course = await Course.findById(body.courseId);
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const existing = await Enrollment.findOne({ studentId, courseId: body.courseId });
  if (existing) {
    return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 409 });
  }

  const enrollment = await Enrollment.create({
    studentId,
    courseId: body.courseId,
    sessionId: body.sessionId || course.sessionId || undefined,
  });
  return NextResponse.json({ data: enrollment }, { status: 201 });
});

export const DELETE = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin', 'student']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
  }

  // Students may only drop their own enrollment; admins drop any
  let studentId;
  if (auth.user.role === 'student') {
    const student = await getOwnStudent(auth.user.id);
    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }
    studentId = student._id;
  } else {
    studentId = searchParams.get('studentId');
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }
  }

  const result = await Enrollment.findOneAndDelete({ studentId, courseId });
  if (!result) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Enrollment removed' });
});
