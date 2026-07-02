import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import Course from '@/models/Course';
import Department from '@/models/Department';
import Lecturer from '@/models/Lecturer';
import Enrollment from '@/models/Enrollment';
import { requireRole, handleApiError } from '@/lib/middleware';

export const GET = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin', 'lecturer', 'student']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'summary';
  const courseId = searchParams.get('courseId') || '';
  const departmentId = searchParams.get('departmentId') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const studentId = searchParams.get('studentId') || '';

  const dateQuery = {};
  if (startDate && endDate) {
    dateQuery.$gte = new Date(startDate);
    dateQuery.$lte = new Date(endDate);
  }

  let reportData = {};

  if (type === 'summary') {
    const totalStudents = await Student.countDocuments();
    const totalLecturers = await Lecturer.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalDepartments = await Department.countDocuments();
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });

    reportData = { totalStudents, totalLecturers, totalCourses, totalDepartments, todayAttendance };
  }

  if (type === 'course' && courseId) {
    const enrollments = await Enrollment.find({ courseId }).populate('studentId');
    const attendanceRecords = await Attendance.find({
      courseId,
      ...(Object.keys(dateQuery).length > 0 ? { date: dateQuery } : {}),
    });

    const studentStats = [];
    for (const enrollment of enrollments) {
      const studentAttendances = attendanceRecords.filter(
        a => a.studentId.toString() === enrollment.studentId._id.toString()
      );
      const present = studentAttendances.filter(a => a.status === 'present' || a.status === 'late').length;
      const total = studentAttendances.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      const studentUser = await Student.findById(enrollment.studentId._id).populate('userId');
      studentStats.push({
        studentId: enrollment.studentId._id,
        name: studentUser?.userId?.name || 'Unknown',
        matricNumber: studentUser?.matricNumber || 'N/A',
        present,
        absent: studentAttendances.filter(a => a.status === 'absent').length,
        late: studentAttendances.filter(a => a.status === 'late').length,
        excused: studentAttendances.filter(a => a.status === 'excused').length,
        total,
        percentage,
      });
    }

    reportData = { studentStats };
  }

  if (type === 'student' && studentId) {
    const records = await Attendance.find({
      studentId,
      ...(Object.keys(dateQuery).length > 0 ? { date: dateQuery } : {}),
    }).populate('courseId', 'courseCode courseTitle');

    const total = records.length;
    const present = records.filter(a => a.status === 'present').length;
    const absent = records.filter(a => a.status === 'absent').length;
    const late = records.filter(a => a.status === 'late').length;
    const excused = records.filter(a => a.status === 'excused').length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    reportData = {
      total, present, absent, late, excused, percentage,
      records: records.map(r => ({
        date: r.date,
        course: r.courseId?.courseCode || 'N/A',
        courseTitle: r.courseId?.courseTitle || 'N/A',
        status: r.status,
      })),
    };
  }

  if (type === 'department' && departmentId) {
    const courses = await Course.find({ departmentId });
    const courseStats = [];

    for (const course of courses) {
      const totalRecords = await Attendance.countDocuments({ courseId: course._id });
      const presentRecords = await Attendance.countDocuments({
        courseId: course._id,
        status: { $in: ['present', 'late'] },
      });
      const percentage = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

      courseStats.push({
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        totalRecords,
        presentRecords,
        percentage,
      });
    }

    reportData = { courseStats };
  }

  return NextResponse.json({ data: reportData });
});
