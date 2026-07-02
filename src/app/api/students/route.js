import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import { hashPassword } from '@/lib/auth';
import { requireRole, handleApiError } from '@/lib/middleware';

export const GET = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin', 'lecturer']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const departmentId = searchParams.get('departmentId') || '';

  const query = {};
  if (search) {
    const users = await User.find({
      role: 'student',
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    query.userId = { $in: users.map(u => u._id) };
  }
  if (departmentId) query.departmentId = departmentId;

  const total = await Student.countDocuments(query);
  const students = await Student.find(query)
    .populate('userId', 'name email')
    .populate('departmentId', 'name code')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return NextResponse.json({
    data: students,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const body = await req.json();

  if (!body.name || !body.email || !body.password || !body.matricNumber || !body.departmentId || !body.level) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const existingUser = await User.findOne({ email: body.email.toLowerCase() });
  if (existingUser) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }

  const existingMatric = await Student.findOne({ matricNumber: body.matricNumber.toUpperCase() });
  if (existingMatric) {
    return NextResponse.json({ error: 'Matric number already exists' }, { status: 409 });
  }

  const hashedPassword = await hashPassword(body.password);

  const user = await User.create({
    name: body.name,
    email: body.email.toLowerCase(),
    password: hashedPassword,
    role: 'student',
  });

  const student = await Student.create({
    userId: user._id,
    matricNumber: body.matricNumber.toUpperCase(),
    departmentId: body.departmentId,
    level: body.level,
  });

  return NextResponse.json(
    { data: { ...student.toObject(), user: { name: user.name, email: user.email } } },
    { status: 201 }
  );
});
