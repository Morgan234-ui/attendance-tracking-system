'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/dashboard/StatCard';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { BookOpen, ClipboardCheck, AlertTriangle, Users } from 'lucide-react';

export default function LecturerDashboard() {
  const { isLecturer } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '', staffId: '', title: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!isLecturer) { router.replace('/login'); return; }
    fetchDashboard();
    fetchProfile();
  }, [isLecturer, router]);

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

  async function fetchProfile() {
    try {
      const res = await fetch('/api/profile');
      const result = await res.json();
      if (res.ok) {
        const profile = result.data.profile || {};
        setProfileForm({
          name: result.data.user.name || '',
          email: result.data.user.email || '',
          password: '',
          staffId: profile.staffId || '',
          title: profile.title || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }

  async function openProfile() {
    try {
      const res = await fetch('/api/profile');
      const result = await res.json();
      if (res.ok) {
        const profile = result.data.profile || {};
        setProfileForm({
          name: result.data.user.name || '',
          email: result.data.user.email || '',
          password: '',
          staffId: profile.staffId || '',
          title: profile.title || '',
        });
        setProfileOpen(true);
      } else {
        toast.error(result.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    }
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Profile updated');
        setProfileOpen(false);
        fetchDashboard();
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile save failed:', error);
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
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

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lecturer Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your courses and attendance overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Assigned Courses" value={data?.assignedCourses?.length || 0} icon={BookOpen} color="blue" />
        <StatCard title="Attendance Today" value={data?.attendanceToday || 0} icon={ClipboardCheck} color="green" />
        <StatCard title="Poor Attendance Students" value={data?.poorAttendanceStudents?.length || 0} icon={AlertTriangle} color="red" />
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Profile</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Edit your lecturer profile details.</p>
          </div>
          <button
            type="button"
            onClick={openProfile}
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            Edit Profile
          </button>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Name</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{profileForm.name || 'Not loaded'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{profileForm.email || 'Not loaded'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Staff ID</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{profileForm.staffId || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Title</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{profileForm.title || 'Not set'}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={profileOpen} onClose={() => setProfileOpen(false)} title="Edit Profile" size="md">
        <div className="space-y-4">
          <Input
            label="Name"
            value={profileForm.name}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <Input
            label="Email"
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <Input
            label="Password"
            type="password"
            value={profileForm.password}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Leave blank to keep current password"
          />
          <Input
            label="Staff ID"
            value={profileForm.staffId}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, staffId: e.target.value }))}
          />
          <Input
            label="Title"
            value={profileForm.title}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setProfileOpen(false)}
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveProfile}
              disabled={savingProfile}
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Course Statistics</h3>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Enrolled</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Today Present</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.courseStats?.map((course, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{course.courseCode}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{course.courseTitle}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{course.enrolledCount}</td>
                    <td className="px-4 py-3">
                      <Badge variant={course.todayAttendance > 0 ? 'active' : 'inactive'}>
                        {course.todayAttendance}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {data?.poorAttendanceStudents?.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-500" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Students with Poor Attendance</h3>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.poorAttendanceStudents.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">{s.name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-400">{s.matricNumber}</td>
                      <td className="px-4 py-3">
                        <Badge variant={s.percentage < 50 ? 'danger' : 'warning'}>{s.percentage}%</Badge>
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
