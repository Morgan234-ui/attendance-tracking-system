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
  const [scannedRecords, setScannedRecords] = useState([]);
  const [expiresMinutes, setExpiresMinutes] = useState(15);
  const [loading, setLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [qrCountdown, setQrCountdown] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [closingSession, setClosingSession] = useState(false);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (res.ok && data.data?.assignedCourses) {
          setCourses(data.data.assignedCourses);
        }
      } catch { }
    }
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchActiveSession(selectedCourse);
    } else {
      setActiveSession(null);
      setQrData(null);
      setQrCountdown(null);
      setScannedRecords([]);
    }
  }, [selectedCourse]);

  async function fetchActiveSession(courseId, { silent = false } = {}) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/attendance/qr?courseId=${courseId}`);
      const data = await res.json();
      if (res.ok && data.data?.session) {
        const session = data.data.session;
        setActiveSession(session);
        setQrData(session);
        setQrCountdown(Math.max(0, Math.ceil((new Date(session.expiresAt) - new Date()) / 1000)));
        setScannedRecords(data.data.scannedRecords || []);
      } else {
        setActiveSession(null);
        setQrData(null);
        setQrCountdown(null);
        setScannedRecords([]);
      }
    } catch {
      if (!silent) {
        setActiveSession(null);
        setQrData(null);
        setQrCountdown(null);
        setScannedRecords([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function generateQR() {
    if (!selectedCourse) return toast.error('Select a course first');
    if (activeSession) {
      return toast.error('You already have an open session. Close it before opening another.');
    }
    setGeneratingQR(true);
    try {
      const res = await fetch('/api/attendance/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourse, expiresInMinutes: expiresMinutes }),
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse response JSON', parseError, text);
      }

      if (!res.ok) {
        const errorMessage = data?.error || text || 'Failed to generate QR code';
        toast.error(errorMessage);
        return;
      }

      if (!data?.data) {
        toast.error('QR session response missing data');
        return;
      }

      setQrData(data.data);
      setActiveSession(data.data);
      setScannedRecords([]);
      setQrModalOpen(true);
      setQrCountdown(Math.max(0, Math.ceil((new Date(data.data.expiresAt) - new Date()) / 1000)));
      await fetchActiveSession(selectedCourse);
    } catch (error) {
      console.error('QR generation failed', error);
      toast.error(error?.message || 'Something went wrong');
    } finally {
      setGeneratingQR(false);
    }
  }

  async function closeSession() {
    if (!activeSession?._id) return;
    setClosingSession(true);
    try {
      const res = await fetch(`/api/attendance/qr?sessionId=${activeSession._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Session closed');
        setActiveSession(null);
        setQrData(null);
        setQrCountdown(null);
        setQrModalOpen(false);
      } else {
        toast.error(data.error || 'Failed to close session');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setClosingSession(false);
    }
  }

  const columns = [
    { key: 'matricNumber', label: 'Matric No.', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'date', label: 'Scanned At', render: (val) => new Date(val).toLocaleTimeString() },
  ];

  // Tick the countdown from expiresAt (drift-free) whenever a session is active,
  // and clear everything out once it expires.
  useEffect(() => {
    if (!activeSession?.expiresAt) return undefined;

    const expiresAt = new Date(activeSession.expiresAt).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setQrCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        toast.info('QR session expired');
        setActiveSession(null);
        setQrData(null);
        setQrCountdown(null);
        setQrModalOpen(false);
      }
    };
    const interval = setInterval(tick, 1000);
    tick();

    return () => clearInterval(interval);
  }, [activeSession?.expiresAt]);

  // Refresh the scanned-students list while a session is open so new scans
  // appear without reselecting the course.
  useEffect(() => {
    if (!activeSession?._id || !selectedCourse) return undefined;

    const interval = setInterval(() => {
      fetchActiveSession(selectedCourse, { silent: true });
    }, 8000);

    return () => clearInterval(interval);
  }, [activeSession?._id, selectedCourse]);

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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Close After</label>
              <input
                type="number"
                min="1"
                max="120"
                value={expiresMinutes}
                onChange={(e) => setExpiresMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">QR session closes after this many minutes.</p>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={generateQR} icon={QrCode} loading={generatingQR} variant="outline" className="flex-1" disabled={!!activeSession}>
                QR Code
              </Button>
            </div>
          </div>
          {activeSession && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Active QR session</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Only one session is allowed at a time.</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Expires in {qrCountdown !== null ? `${Math.floor(qrCountdown / 60)}:${String(qrCountdown % 60).padStart(2, '0')}` : '00:00'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setQrModalOpen(true)} icon={QrCode} variant="secondary">
                    View QR
                  </Button>
                  <Button onClick={closeSession} loading={closingSession} variant="ghost" className="border border-slate-300 dark:border-slate-700">
                    Close Session
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[240px_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">QR Code</p>
                  {qrData?.qrDataUrl ? (
                    <img
                      src={qrData.qrDataUrl}
                      alt="Active QR code"
                      className="mx-auto rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="h-48 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-500">
                      QR unavailable
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Session details</p>
                  <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between gap-4">
                      <span className="font-medium">Course</span>
                      <span>{courses.find(c => c._id === selectedCourse)?.courseTitle || 'Selected course'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="font-medium">Expires in</span>
                      <span>{qrCountdown !== null ? `${Math.floor(qrCountdown / 60)}:${String(qrCountdown % 60).padStart(2, '0')}` : '00:00'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="font-medium">Expires at</span>
                      <span>{qrData?.expiresAt ? new Date(qrData.expiresAt).toLocaleTimeString() : '—'}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="font-medium">Session ID</span>
                      <span className="font-mono text-xs break-all">{activeSession._id}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="font-medium">Status</span>
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Active</span>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button onClick={closeSession} loading={closingSession} variant="secondary">
                      Close Session
                    </Button>
                    <Button onClick={() => setQrModalOpen(true)} icon={QrCode} variant="ghost" className="border border-slate-200 dark:border-slate-700">
                      Open QR Modal
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {selectedCourse && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              Scanned Students ({scannedRecords.length})
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            <Table columns={columns} data={scannedRecords.map(record => ({
              _id: record._id,
              matricNumber: record.studentId?.matricNumber || 'N/A',
              name: record.studentId?.userId?.name || 'Unknown',
              status: record.status,
              date: record.createdAt,
            }))} loading={loading} />
          </CardBody>
        </Card>
      )}

      <Modal isOpen={qrModalOpen} onClose={() => setQrModalOpen(false)} title="QR Code Attendance" size="sm">
        <div className="text-center space-y-4">
          {qrData?.qrDataUrl && (
            <>
              <img src={qrData.qrDataUrl} alt="QR Code" className="mx-auto rounded-lg" />
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
                Students can scan this QR code to mark their attendance.
              </p>
              <div className="space-y-1">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Session active. Expires in:
                </p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {qrCountdown !== null ? `${Math.floor(qrCountdown / 60)}:${String(qrCountdown % 60).padStart(2, '0')}` : '—'}
                </p>
                <p className="text-xs text-slate-400">
                  Expires at {new Date(qrData.expiresAt).toLocaleTimeString()}
                </p>
                <Button onClick={closeSession} loading={closingSession} variant="secondary" className="mt-3">
                  Close Session
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
