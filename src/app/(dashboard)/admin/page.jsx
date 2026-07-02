'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/dashboard/StatCard';
import { AttendanceTrendChart, AttendancePieChart } from '@/components/dashboard/AttendanceChart';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Users, GraduationCap, BookOpen, Building2, AlertTriangle, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/login');
      return;
    }
    fetchDashboard();
  }, [isAdmin, router]);

  async function fetchDashboard() {
    try {
      const res = await fetch('/api/dashboard');
      const result = await res.json();
      if (res.ok) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-3" />
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pieData = data?.trendData
    ? [
        { name: 'Present', value: data.trendData.reduce((sum, d) => sum + d.present, 0) },
        { name: 'Absent', value: data.trendData.reduce((sum, d) => sum + d.absent, 0) },
      ]
    : [];

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Overview of the attendance management system
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={data?.totalStudents || 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Lecturers"
          value={data?.totalLecturers || 0}
          icon={GraduationCap}
          color="green"
        />
        <StatCard
          title="Total Courses"
          value={data?.totalCourses || 0}
          icon={BookOpen}
          color="orange"
        />
        <StatCard
          title="Total Departments"
          value={data?.totalDepartments || 0}
          icon={Building2}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Attendance Trends (Last 7 Days)
            </h3>
          </CardHeader>
          <CardBody>
            <AttendanceTrendChart data={data?.trendData || []} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Attendance Distribution
            </h3>
          </CardHeader>
          <CardBody>
            <AttendancePieChart data={pieData} />
          </CardBody>
        </Card>
      </div>

      {data?.lowAttendanceStudents?.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-500" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Low Attendance Students
              </h3>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Matric No.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Percentage</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.lowAttendanceStudents.map((student, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{student.matricNumber}</td>
                      <td className="px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">{student.percentage}%</td>
                      <td className="px-4 py-3">
                        <Badge variant={student.percentage < 50 ? 'danger' : 'warning'}>
                          {student.percentage < 50 ? 'Critical' : 'Warning'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
