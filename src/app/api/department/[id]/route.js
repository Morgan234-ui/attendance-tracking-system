import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Department from '@/models/Department';
import { requireRole, handleApiError } from '@/lib/middleware';

export async function GET(req, { params }) {
  try {
    const auth = await requireRole(req, ['admin', 'lecturer', 'student']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    await connectDB();
    const department = await Department.findById(params.id);
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    return NextResponse.json({ data: department });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const auth = await requireRole(req, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    await connectDB();
    const body = await req.json();
    const department = await Department.findByIdAndUpdate(
      params.id,
      { ...body, code: body.code?.toUpperCase() },
      { new: true, runValidators: true }
    );
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    return NextResponse.json({ data: department });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await requireRole(req, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    await connectDB();
    const department = await Department.findByIdAndDelete(params.id);
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Department deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
