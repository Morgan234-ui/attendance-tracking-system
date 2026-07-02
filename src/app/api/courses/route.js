import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Course from '@/models/Course';
import { requireRole, handleApiError } from '@/lib/middleware';

export const GET = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin', 'lecturer', 'student']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const departmentId = searchParams.get('departmentId') || '';

  const query = {};
  if (search) {
    query.$or = [
      { courseCode: { $regex: search, $options: 'i' } },
      { courseTitle: { $regex: search, $options: 'i' } },
    ];
  }
  if (departmentId) query.departmentId = departmentId;

  const total = await Course.countDocuments(query);
  const courses = await Course.find(query)
    .populate('departmentId', 'name code')
    .populate('lecturerId')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return NextResponse.json({
    data: courses,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const body = await req.json();

  if (!body.courseCode || !body.courseTitle || !body.unit || !body.departmentId) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
  }

  const existing = await Course.findOne({ courseCode: body.courseCode.toUpperCase() });
  if (existing) {
    return NextResponse.json({ error: 'Course code already exists' }, { status: 409 });
  }

  const course = await Course.create({
    ...body,
    courseCode: body.courseCode.toUpperCase(),
  });

  return NextResponse.json({ data: course }, { status: 201 });
});
