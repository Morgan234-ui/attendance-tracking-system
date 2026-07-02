import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Student from '@/models/Student';
import Lecturer from '@/models/Lecturer';
import Course from '@/models/Course';
import Department from '@/models/Department';
import Attendance from '@/models/Attendance';
import Enrollment from '@/models/Enrollment';
import { requireRole, handleApiError } from '@/lib/middleware';

export const GET = handleApiError(async (req) => {
  const auth = await requireRole(req, ['admin', 'lecturer', 'student']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const role = auth.user.role;

  let data = {};

  if (role === 'admin') {
    const totalStudents = await Student.countDocuments();
    const totalLecturers = await Lecturer.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalDepartments = await Department.countDocuments();

    // Attendance trends for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentAttendance = await Attendance.find({
      date: { $gte: sevenDaysAgo },
    });

    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayRecords = recentAttendance.filter(
        r => r.date >= date && r.date < nextDate
      );
      trendData.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        present: dayRecords.filter(r => r.status === 'present' || r.status === 'late').length,
        absent: dayRecords.filter(r => r.status === 'absent').length,
      });
    }

    // Low attendance students (below 75%)
    const allStudents = await Student.find().populate('userId', 'name email');
    const lowAttendanceStudents = [];

    for (const student of allStudents) {
      const total = await Attendance.countDocuments({ studentId: student._id });
      const present = await Attendance.countDocuments({
        studentId: student._id,
        status: { $in: ['present', 'late'] },
      });
      const percentage = total > 0 ? Math.round((present / total) * 100) : 100;
      if (percentage < 75 && total > 0) {
        lowAttendanceStudents.push({
          name: student.userId?.name || 'Unknown',
          matricNumber: student.matricNumber,
          percentage,
        });
      }
    }

    // Recent activity
    const recentActivity = await Attendance.find()
      .populate('studentId')
      .sort({ createdAt: -1 })
      .limit(5);

    data = {
      totalStudents,
      totalLecturers,
      totalCourses,
      totalDepartments,
      trendData,
      lowAttendanceStudents: lowAttendanceStudents.slice(0, 10),
      recentActivity,
    };
  }

  if (role === 'lecturer') {
    const lecturer = await Lecturer.findOne({ userId: auth.user.id });
    if (lecturer) {
      const assignedCourses = await Course.find({ lecturerId: lecturer._id })
        .populate('departmentId', 'name code');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const attendanceToday = await Attendance.countDocuments({
        markedBy: lecturer._id,
        date: today,
      });

      // Students with poor attendance in lecturer's courses
      const courseIds = assignedCourses.map(c => c._id);
      const enrollments = await Enrollment.find({ courseId: { $in: courseIds } });
      const poorAttendanceStudents = [];

      for (const enrollment of enrollments) {
        const total = await Attendance.countDocuments({
          studentId: enrollment.studentId,
          courseId: { $in: courseIds },
        });
        const present = await Attendance.countDocuments({
          studentId: enrollment.studentId,
          courseId: { $in: courseIds },
          status: { $in: ['present', 'late'] },
        });
        const percentage = total > 0 ? Math.round((present / total) * 100) : 100;
        if (percentage < 75 && total > 0) {
          const student = await Student.findById(enrollment.studentId).populate('userId', 'name email');
          poorAttendanceStudents.push({
            name: student?.userId?.name || 'Unknown',
            matricNumber: student?.matricNumber || 'N/A',
            percentage,
          });
        }
      }

      // Course stats
      const courseStats = [];
      for (const course of assignedCourses) {
        const enrolledCount = await Enrollment.countDocuments({ courseId: course._id });
        const todayAttendance = await Attendance.countDocuments({
          courseId: course._id,
          date: today,
          status: { $in: ['present', 'late'] },
        });
        courseStats.push({
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          enrolledCount,
          todayAttendance,
        });
      }

      data = {
        assignedCourses,
        attendanceToday,
        poorAttendanceStudents: poorAttendanceStudents.slice(0, 10),
        courseStats,
      };
    }
  }

  if (role === 'student') {
    const student = await Student.findOne({ userId: auth.user.id }).populate('departmentId', 'name code');
    if (student) {
      const enrollments = await Enrollment.find({ studentId: student._id })
        .populate('courseId', 'courseCode courseTitle unit');

      const totalAttendance = await Attendance.countDocuments({ studentId: student._id });
      const presentAttendance = await Attendance.countDocuments({
        studentId: student._id,
        status: { $in: ['present', 'late'] },
      });
      const percentage = totalAttendance > 0
        ? Math.round((presentAttendance / totalAttendance) * 100)
        : 0;

      const recentAttendance = await Attendance.find({ studentId: student._id })
        .populate('courseId', 'courseCode courseTitle')
        .sort({ date: -1 })
        .limit(10);

      data = {
        student,
        enrollments,
        attendancePercentage: percentage,
        totalClasses: totalAttendance,
        presentClasses: presentAttendance,
        recentAttendance,
      };
    }
  }

  return NextResponse.json({ data });
});
