import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Student from '../models/Student';
import Lecturer from '../models/Lecturer';
import Department from '../models/Department';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import AcademicSession from '../models/AcademicSession';
import Attendance from '../models/Attendance';
import { connectDB } from '../lib/mongodb';

async function seed() {
  console.log('Connecting to MongoDB...');
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Student.deleteMany({});
  await Lecturer.deleteMany({});
  await Department.deleteMany({});
  await Course.deleteMany({});
  await Enrollment.deleteMany({});
  await AcademicSession.deleteMany({});
  await Attendance.deleteMany({});
  console.log('Cleared existing data');

  // Create admin
  const adminPassword = await bcrypt.hash('password123', 12);
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@university.edu',
    password: adminPassword,
    role: 'admin',
  });

  // Create departments
  const departments = await Department.insertMany([
    { name: 'Computer Science', code: 'CSC', faculty: 'Faculty of Science' },
    { name: 'Electrical Engineering', code: 'EEE', faculty: 'Faculty of Engineering' },
    { name: 'Business Administration', code: 'BUS', faculty: 'Faculty of Management' },
    { name: 'Mathematics', code: 'MTH', faculty: 'Faculty of Science' },
  ]);

  // Create active session
  const session = await AcademicSession.create({
    sessionName: '2024/2025',
    semester: 'first',
    isActive: true,
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-01-31'),
  });

  // Create lecturers
  const lecturerPassword = await bcrypt.hash('password123', 12);
  const lecturer1User = await User.create({
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@university.edu',
    password: lecturerPassword,
    role: 'lecturer',
  });
  const lecturer1 = await Lecturer.create({
    userId: lecturer1User._id,
    staffId: 'STF-0001',
    departmentId: departments[0]._id,
    title: 'Dr.',
  });

  const lecturer2User = await User.create({
    name: 'Prof. Michael Chen',
    email: 'michael.chen@university.edu',
    password: lecturerPassword,
    role: 'lecturer',
  });
  const lecturer2 = await Lecturer.create({
    userId: lecturer2User._id,
    staffId: 'STF-0002',
    departmentId: departments[1]._id,
    title: 'Prof.',
  });

  const lecturer3User = await User.create({
    name: 'Mrs. Ada Okafor',
    email: 'ada.okafor@university.edu',
    password: lecturerPassword,
    role: 'lecturer',
  });
  const lecturer3 = await Lecturer.create({
    userId: lecturer3User._id,
    staffId: 'STF-0003',
    departmentId: departments[2]._id,
    title: 'Mrs.',
  });

  // Create courses
  const courses = await Course.insertMany([
    { courseCode: 'CSC 101', courseTitle: 'Introduction to Computer Science', unit: 3, departmentId: departments[0]._id, lecturerId: lecturer1._id, semester: 'first', level: '100', sessionId: session._id },
    { courseCode: 'CSC 201', courseTitle: 'Data Structures & Algorithms', unit: 3, departmentId: departments[0]._id, lecturerId: lecturer1._id, semester: 'first', level: '200', sessionId: session._id },
    { courseCode: 'EEE 101', courseTitle: 'Introduction to Electrical Engineering', unit: 3, departmentId: departments[1]._id, lecturerId: lecturer2._id, semester: 'first', level: '100', sessionId: session._id },
    { courseCode: 'BUS 101', courseTitle: 'Principles of Management', unit: 2, departmentId: departments[2]._id, lecturerId: lecturer3._id, semester: 'first', level: '100', sessionId: session._id },
    { courseCode: 'MTH 101', courseTitle: 'Calculus I', unit: 3, departmentId: departments[3]._id, lecturerId: null, semester: 'first', level: '100', sessionId: session._id },
  ]);

  // Create students
  const studentPassword = await bcrypt.hash('password123', 12);
  const students = [];

  for (let i = 1; i <= 20; i++) {
    const matric = `CSC/24/${String(i).padStart(4, '0')}`;
    const deptIndex = i <= 10 ? 0 : i <= 15 ? 1 : 2;
    const level = i <= 10 ? '100' : i <= 15 ? '200' : '300';

    const user = await User.create({
      name: `Student ${i}`,
      email: `student${i}@university.edu`,
      password: studentPassword,
      role: 'student',
    });

    const student = await Student.create({
      userId: user._id,
      matricNumber: matric,
      departmentId: departments[deptIndex]._id,
      level,
      sessionId: session._id,
    });

    students.push(student);
  }

  // Enroll students in courses
  for (const student of students) {
    const level = student.level;
    const levelCourses = courses.filter(c => c.level === level);
    for (const course of levelCourses) {
      await Enrollment.create({
        studentId: student._id,
        courseId: course._id,
        sessionId: session._id,
      });
    }
  }

  // Create sample attendance records
  const today = new Date();
  for (const student of students.slice(0, 10)) {
    const levelCourses = courses.filter(c => c.level === '100');
    for (const course of levelCourses) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        date.setHours(0, 0, 0, 0);

        const rand = Math.random();
        let status = 'present';
        if (rand > 0.85) status = 'absent';
        else if (rand > 0.75) status = 'late';
        else if (rand > 0.7) status = 'excused';

        await Attendance.create({
          studentId: student._id,
          courseId: course._id,
          date,
          status,
          markedBy: course.lecturerId || lecturer1._id,
          sessionId: session._id,
          verificationMethod: 'manual',
        });
      }
    }
  }

  console.log('\nSeed completed successfully!');
  console.log('================================');
  console.log('Admin: admin@university.edu / password123');
  console.log('Lecturer: sarah.johnson@university.edu / password123');
  console.log('Student: student1@university.edu / password123');
  console.log('================================\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
