'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { BookOpen } from 'lucide-react';

export default function LecturerCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (res.ok && data.data?.assignedCourses) {
          setCourses(data.data.assignedCourses);
        }
      } catch {
        toast.error('Failed to load courses');
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Courses</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Courses assigned to you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ))
        ) : courses.map((course) => (
          <Card key={course._id} hover>
            <CardBody>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                  <BookOpen className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{course.courseCode}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{course.courseTitle}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="info">{course.unit} Units</Badge>
                    <Badge variant="info" className="capitalize">{course.semester}</Badge>
                    {course.departmentId && (
                      <Badge variant="info">{course.departmentId.code || course.departmentId.name}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
