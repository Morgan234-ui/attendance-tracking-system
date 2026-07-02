import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AcademicSession from '@/models/AcademicSession';
import { requireRole, handleApiError } from '@/lib/middleware';

export const GET = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin', 'lecturer', 'student']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const sessions = await AcademicSession.find().sort({ createdAt: -1 });
  return NextResponse.json({ data: sessions });
});

export const POST = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const body = await req.json();

  if (!body.sessionName || !body.semester) {
    return NextResponse.json({ error: 'Session name and semester are required' }, { status: 400 });
  }

  if (body.isActive) {
    await AcademicSession.updateMany({ isActive: true }, { isActive: false });
  }

  const session = await AcademicSession.create(body);
  return NextResponse.json({ data: session }, { status: 201 });
});

export const PUT = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const body = await req.json();

  if (body.isActive) {
    await AcademicSession.updateMany({ isActive: true }, { isActive: false });
  }

  const session = await AcademicSession.findByIdAndUpdate(body.id, body, { new: true });
  return NextResponse.json({ data: session });
});
