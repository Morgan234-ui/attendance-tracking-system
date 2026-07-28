import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import { requireRole } from '@/lib/middleware';

export async function GET(req, { params }) {
  try {
    const auth = await requireRole(req, ['admin', 'lecturer', 'student']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    await connectDB();
    const course = await Course.findById(params.id)
      .populate('departmentId', 'name code')
      .populate('lecturerId');
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ data: course });
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

    if (body.courseCode) {
      body.courseCode = body.courseCode.toUpperCase();
      const clash = await Course.findOne({ courseCode: body.courseCode, _id: { $ne: params.id } });
      if (clash) {
        return NextResponse.json({ error: 'Course code already exists' }, { status: 409 });
      }
    }
    // Empty lecturer select arrives as '' — store as null
    if (body.lecturerId === '') body.lecturerId = null;

    const course = await Course.findByIdAndUpdate(
      params.id,
      body,
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
    // Remove enrollments tied to the deleted course
    await Enrollment.deleteMany({ courseId: params.id });
    return NextResponse.json({ message: 'Course deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
