'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { BookOpen, Plus, Search, LogOut } from 'lucide-react';

export default function StudentCoursesPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, coursesRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/courses?limit=100'),
      ]);
      const dash = await dashRes.json();
      const courses = await coursesRes.json();
      if (dashRes.ok) setEnrollments(dash.data?.enrollments || []);
      if (coursesRes.ok) setAllCourses(courses.data || []);
    } catch {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const enrolledIds = new Set(
    enrollments.map((e) => e.courseId?._id || e.courseId).filter(Boolean).map(String)
  );

  async function enroll(courseId) {
    setBusyId(courseId);
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Enrolled successfully');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to enroll');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setBusyId(null);
    }
  }

  async function drop(courseId) {
    if (!confirm('Drop this course?')) return;
    setBusyId(courseId);
    try {
      const res = await fetch(`/api/enrollments?courseId=${courseId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Course dropped');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to drop course');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setBusyId(null);
    }
  }

  const available = allCourses.filter((c) => {
    if (enrolledIds.has(String(c._id))) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.courseCode?.toLowerCase().includes(q) ||
      c.courseTitle?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Courses</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enroll in courses and manage your registrations</p>
      </div>

      {/* Enrolled courses */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Enrolled ({enrollments.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            ))
          ) : enrollments.length === 0 ? (
            <Card><CardBody className="text-center py-8 text-slate-500 dark:text-slate-400">
              You are not enrolled in any courses yet.
            </CardBody></Card>
          ) : enrollments.map((enrollment) => {
            const course = enrollment.courseId;
            const courseId = course?._id || course;
            return (
              <Card key={enrollment._id} hover>
                <CardBody>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                      <BookOpen className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{course?.courseCode || 'N/A'}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{course?.courseTitle || 'Unknown Course'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge variant="info">{course?.unit || 0} Units</Badge>
                        <Badge variant="info" className="capitalize">{course?.semester || 'N/A'}</Badge>
                      </div>
                      <div className="mt-4">
                        <Button
                          size="sm"
                          variant="error"
                          icon={LogOut}
                          loading={busyId === String(courseId)}
                          onClick={() => drop(courseId)}
                        >
                          Drop
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Available courses */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Available Courses ({available.length})
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            ))
          ) : available.length === 0 ? (
            <Card><CardBody className="text-center py-8 text-slate-500 dark:text-slate-400">
              No available courses to enroll in.
            </CardBody></Card>
          ) : available.map((course) => (
            <Card key={course._id} hover>
              <CardBody>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/40">
                    <BookOpen className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{course.courseCode}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{course.courseTitle}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge variant="info">{course.unit} Units</Badge>
                      <Badge variant="info" className="capitalize">{course.semester}</Badge>
                      {course.departmentId && (
                        <Badge variant="info">{course.departmentId.code || course.departmentId.name}</Badge>
                      )}
                    </div>
                    <div className="mt-4">
                      <Button
                        size="sm"
                        icon={Plus}
                        loading={busyId === String(course._id)}
                        onClick={() => enroll(course._id)}
                      >
                        Enroll
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
