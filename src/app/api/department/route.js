import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Department from '@/models/Department';
import { requireRole, handleApiError } from '@/lib/middleware';

export const GET = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  const query = search
    ? { $or: [{ name: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }] }
    : {};

  const total = await Department.countDocuments(query);
  const departments = await Department.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return NextResponse.json({
    data: departments,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const body = await req.json();

  if (!body.name || !body.faculty || !body.code) {
    return NextResponse.json({ error: 'Name, faculty, and code are required' }, { status: 400 });
  }

  const existing = await Department.findOne({ code: body.code.toUpperCase() });
  if (existing) {
    return NextResponse.json({ error: 'Department code already exists' }, { status: 409 });
  }

  const department = await Department.create({
    ...body,
    code: body.code.toUpperCase(),
  });

  return NextResponse.json({ data: department }, { status: 201 });
});
