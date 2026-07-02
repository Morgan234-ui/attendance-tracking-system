'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/dashboard/StatCard';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import StatusBadge from '@/components/ui/StatusBadge';
import { ClipboardCheck, BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';

export default function StudentDashboard() {
  const { isStudent } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isStudent) { router.replace('/login'); return; }
    fetchDashboard();
  }, [isStudent, router]);

  async function fetchDashboard() {
    try {
      const res = await fetch('/api/dashboard');
      const result = await res.json();
      if (res.ok) setData(result.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-3" />
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const percentage = data?.attendancePercentage || 0;
  const isBelowThreshold = percentage < 75;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Welcome, {data?.student?.userId?.name || 'Student'}
        </p>
      </div>

      {isBelowThreshold && percentage > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
              Low Attendance Warning
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              Your attendance is {percentage}%. Minimum required is 75%.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Attendance Percentage"
          value={`${percentage}%`}
          icon={percentage >= 75 ? CheckCircle : AlertTriangle}
          color={percentage >= 75 ? 'green' : 'red'}
        />
        <StatCard
          title="Total Classes"
          value={data?.totalClasses || 0}
          icon={ClipboardCheck}
          color="blue"
        />
        <StatCard
          title="Registered Courses"
          value={data?.enrollments?.length || 0}
          icon={BookOpen}
          color="orange"
        />
      </div>

      {data?.student && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900 dark:text-white">Profile</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Name</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{data.student.userId?.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Matric Number</p>
                <p className="text-sm font-mono font-medium text-slate-900 dark:text-white">{data.student.matricNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Department</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{data.student.departmentId?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Level</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{data.student.level} Level</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-900 dark:text-white">Recent Attendance</h3>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.recentAttendance?.map((record, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{record.courseId?.courseCode || 'N/A'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{record.courseId?.courseTitle || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={record.status} />
                    </td>
                  </tr>
                ))}
                {(!data?.recentAttendance || data.recentAttendance.length === 0) && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      No attendance records yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
