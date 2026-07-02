import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Course from '@/models/Course';
import { requireRole, handleApiError } from '@/lib/middleware';

export async function PUT(req, { params }) {
  try {
    const auth = await requireRole(req, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    await connectDB();
    const body = await req.json();
    const course = await Course.findByIdAndUpdate(
      params.id,
      { ...body, courseCode: body.courseCode?.toUpperCase() },
      { new: true, runValidators: true }
    );
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ data: course });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await requireRole(req, ['admin']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    await connectDB();
    const course = await Course.findByIdAndDelete(params.id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Course deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
