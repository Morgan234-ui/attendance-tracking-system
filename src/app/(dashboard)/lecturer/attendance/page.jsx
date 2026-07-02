'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import StatusBadge from '@/components/ui/StatusBadge';
import { ClipboardCheck, QrCode, Calendar } from 'lucide-react';

export default function LecturerAttendancePage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (res.ok && data.data?.assignedCourses) {
          setCourses(data.data.assignedCourses);
        }
      } catch {}
    }
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) fetchEnrolledStudents();
  }, [selectedCourse]);

  async function fetchEnrolledStudents() {
    setLoading(true);
    try {
      const res = await fetch(`/api/enrollments?courseId=${selectedCourse}`);
      const data = await res.json();
      if (res.ok) {
        const enrolled = data.data.map(e => ({
          _id: e.studentId?._id || e.studentId,
          name: e.studentId?.userId?.name || 'Unknown',
          matricNumber: e.studentId?.matricNumber || 'N/A',
        }));
        setStudents(enrolled);

        // Initialize attendance records
        const initialRecords = {};
        enrolled.forEach(s => { initialRecords[s._id] = 'present'; });
        setAttendanceRecords(initialRecords);

        // Fetch existing attendance for this date
        const attendanceRes = await fetch(`/api/attendance?courseId=${selectedCourse}&date=${date}`);
        const attendanceData = await attendanceRes.json();
        if (attendanceRes.ok && attendanceData.data) {
          attendanceData.data.forEach(record => {
            const sid = record.studentId?._id || record.studentId;
            if (sid) initialRecords[sid] = record.status;
          });
          setAttendanceRecords({ ...initialRecords });
        }
      }
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }

  async function saveAttendance() {
    if (!selectedCourse) return toast.error('Select a course first');
    setSaving(true);
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse,
          records,
          date,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Attendance saved for ${data.count} students`);
      } else {
        toast.error(data.error || 'Failed to save attendance');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function generateQR() {
    if (!selectedCourse) return toast.error('Select a course first');
    setGeneratingQR(true);
    try {
      const res = await fetch('/api/attendance/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourse, expiresInMinutes: 15 }),
      });
      const data = await res.json();
      if (res.ok) {
        setQrData(data.data);
        setQrModalOpen(true);
      } else {
        toast.error(data.error || 'Failed to generate QR code');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setGeneratingQR(false);
    }
  }

  const statusOptions = ['present', 'absent', 'late', 'excused'];

  const columns = [
    { key: 'matricNumber', label: 'Matric No.', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'name', label: 'Name' },
    {
      key: '_id',
      label: 'Status',
      render: (_, row) => (
        <select
          value={attendanceRecords[row._id] || 'present'}
          onChange={(e) => setAttendanceRecords(prev => ({ ...prev, [row._id]: e.target.value }))}
          className="text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {statusOptions.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Take Attendance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Mark attendance for your courses</p>
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Course"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              placeholder="Select course"
              options={courses.map(c => ({ value: c._id, label: `${c.courseCode} - ${c.courseTitle}` }))}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={generateQR} icon={QrCode} loading={generatingQR} variant="outline" className="flex-1">
                QR Code
              </Button>
              <Button onClick={saveAttendance} icon={ClipboardCheck} loading={saving} className="flex-1">
                Save
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {selectedCourse && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              Students ({students.length})
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            <Table columns={columns} data={students} loading={loading} />
          </CardBody>
        </Card>
      )}

      <Modal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} title="QR Code Attendance" size="sm">
        <div className="text-center">
          {qrData?.qrDataUrl && (
            <>
              <img src={qrData.qrDataUrl} alt="QR Code" className="mx-auto rounded-lg" />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                Students can scan this QR code to mark their attendance.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Expires: {new Date(qrData.expiresAt).toLocaleTimeString()}
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
