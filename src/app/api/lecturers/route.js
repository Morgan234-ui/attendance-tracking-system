import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Lecturer from '@/models/Lecturer';
import { hashPassword } from '@/lib/auth';
import { requireRole, handleApiError } from '@/lib/middleware';

export const GET = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  const query = {};
  if (search) {
    const users = await User.find({
      role: 'lecturer',
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    query.userId = { $in: users.map(u => u._id) };
  }

  const total = await Lecturer.countDocuments(query);
  const lecturers = await Lecturer.find(query)
    .populate('userId', 'name email')
    .populate('departmentId', 'name code')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return NextResponse.json({
    data: lecturers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const body = await req.json();

  if (!body.name || !body.email || !body.password || !body.staffId || !body.departmentId) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const existingUser = await User.findOne({ email: body.email.toLowerCase() });
  if (existingUser) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }

  const existingStaff = await Lecturer.findOne({ staffId: body.staffId.toUpperCase() });
  if (existingStaff) {
    return NextResponse.json({ error: 'Staff ID already exists' }, { status: 409 });
  }

  const hashedPassword = await hashPassword(body.password);

  const user = await User.create({
    name: body.name,
    email: body.email.toLowerCase(),
    password: hashedPassword,
    role: 'lecturer',
  });

  const lecturer = await Lecturer.create({
    userId: user._id,
    staffId: body.staffId.toUpperCase(),
    departmentId: body.departmentId,
    title: body.title || 'Mr.',
  });

  return NextResponse.json(
    { data: { ...lecturer.toObject(), user: { name: user.name, email: user.email } } },
    { status: 201 }
  );
});
