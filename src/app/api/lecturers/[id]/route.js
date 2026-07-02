import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Lecturer from '@/models/Lecturer';
import { hashPassword } from '@/lib/auth';
import { requireRole, handleApiError } from '@/lib/middleware';

export async function PUT(req, { params }) {
  try {
    const auth = await requireRole(req, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    await connectDB();
    const body = await req.json();

    const lecturer = await Lecturer.findById(params.id);
    if (!lecturer) {
      return NextResponse.json({ error: 'Lecturer not found' }, { status: 404 });
    }

    if (body.name || body.email) {
      const updateData = {};
      if (body.name) updateData.name = body.name;
      if (body.email) updateData.email = body.email.toLowerCase();
      if (body.password) updateData.password = await hashPassword(body.password);
      await User.findByIdAndUpdate(lecturer.userId, updateData);
    }

    const lecturerUpdate = {};
    if (body.staffId) lecturerUpdate.staffId = body.staffId.toUpperCase();
    if (body.departmentId) lecturerUpdate.departmentId = body.departmentId;
    if (body.title) lecturerUpdate.title = body.title;

    const updatedLecturer = await Lecturer.findByIdAndUpdate(
      params.id,
      lecturerUpdate,
      { new: true, runValidators: true }
    ).populate('userId', 'name email').populate('departmentId', 'name code');

    return NextResponse.json({ data: updatedLecturer });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await requireRole(req, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    await connectDB();
    const lecturer = await Lecturer.findById(params.id);
    if (!lecturer) {
      return NextResponse.json({ error: 'Lecturer not found' }, { status: 404 });
    }

    await User.findByIdAndDelete(lecturer.userId);
    await Lecturer.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Lecturer deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
