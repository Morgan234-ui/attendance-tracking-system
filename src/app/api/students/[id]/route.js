import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import { hashPassword } from '@/lib/auth';
import { requireRole, handleApiError } from '@/lib/middleware';

export async function PUT(req, { params }) {
  try {
    const auth = await requireRole(req, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    await connectDB();
    const body = await req.json();

    const student = await Student.findById(params.id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (body.name || body.email) {
      const updateData = {};
      if (body.name) updateData.name = body.name;
      if (body.email) updateData.email = body.email.toLowerCase();
      if (body.password) updateData.password = await hashPassword(body.password);
      await User.findByIdAndUpdate(student.userId, updateData);
    }

    const studentUpdate = {};
    if (body.matricNumber) studentUpdate.matricNumber = body.matricNumber.toUpperCase();
    if (body.departmentId) studentUpdate.departmentId = body.departmentId;
    if (body.level) studentUpdate.level = body.level;

    const updatedStudent = await Student.findByIdAndUpdate(
      params.id,
      studentUpdate,
      { new: true, runValidators: true }
    ).populate('userId', 'name email').populate('departmentId', 'name code');

    return NextResponse.json({ data: updatedStudent });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await requireRole(req, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    await connectDB();
    const student = await Student.findById(params.id);
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    await User.findByIdAndDelete(student.userId);
    await Student.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Student deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
