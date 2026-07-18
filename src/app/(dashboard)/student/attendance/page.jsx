'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import Badge from '@/components/ui/Badge';
import { ClipboardCheck } from 'lucide-react';

export default function StudentAttendancePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState([]);
  const [filterCourse, setFilterCourse] = useState('');
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scannerMessage, setScannerMessage] = useState('Ready to scan QR code');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const qrScannerRef = useRef(null);
  const processingScanRef = useRef(false);
  const scanCooldownUntilRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(fetchAttendance, filterCourse ? 400 : 0);
    return () => clearTimeout(timer);
  }, [pagination.page, filterCourse]);

  useEffect(() => {
    fetchOpenSessions();
  }, []);

  useEffect(() => {
    if (scanModalOpen) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [scanModalOpen]);

  async function startScanner() {
    if (typeof window === 'undefined' || qrScannerRef.current) return;

    setScannerMessage('Initializing scanner...');
    processingScanRef.current = false;
    scanCooldownUntilRef.current = 0;

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        verbose: false,
      });
      qrScannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.8);
            return { width: size, height: size };
          },
          aspectRatio: 1,
          disableFlip: true,
        },
        (decodedText) => {
          // Fires on every video frame the QR is visible — only handle it once.
          if (processingScanRef.current || Date.now() < scanCooldownUntilRef.current) return;
          processingScanRef.current = true;
          handleScan(decodedText);
        },
        () => {
          // No QR in frame yet; scanner keeps running.
        }
      );

      setScannerMessage('Scan the lecturer QR code to mark attendance.');
    } catch (error) {
      console.error(error);
      setScannerMessage('Camera access failed. Allow camera permission and try again.');
    }
  }

  async function stopScanner() {
    if (!qrScannerRef.current) return;
    try {
      await qrScannerRef.current.stop();
      await qrScannerRef.current.clear();
    } catch {
      // ignore cleanup failures
    }
    qrScannerRef.current = null;
  }

  function pauseScanner() {
    try {
      qrScannerRef.current?.pause(true);
    } catch {
      // Scanner may not be in a pausable state; ignore.
    }
  }

  function resumeScanner() {
    try {
      qrScannerRef.current?.resume();
    } catch {
      // Scanner may already be running or stopped; ignore.
    }
  }

  async function handleScan(qrToken) {
    pauseScanner();
    setScannerMessage('Processing QR code...');
    try {
      const res = await fetch('/api/attendance/qr', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Attendance marked successfully');
        await stopScanner();
        setScanModalOpen(false);
        fetchAttendance();
        fetchOpenSessions();
        return;
      }
      if (res.status === 409) {
        // Already marked — nothing left to do, so treat it as done.
        toast.info(data.error || 'Attendance already marked for today');
        await stopScanner();
        setScanModalOpen(false);
        fetchAttendance();
        return;
      }
      setScannerMessage(`${data.error || 'Failed to mark attendance'}. Try scanning again.`);
      toast.error(data.error || 'Failed to mark attendance');
      scanCooldownUntilRef.current = Date.now() + 2500;
      resumeScanner();
    } catch (error) {
      console.error(error);
      setScannerMessage('Network error while scanning. Try again.');
      toast.error('Network error while scanning QR code');
      scanCooldownUntilRef.current = Date.now() + 2500;
      resumeScanner();
    } finally {
      processingScanRef.current = false;
    }
  }

  async function fetchAttendance() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (filterCourse) params.append('courseCode', filterCourse);

      const res = await fetch(`/api/attendance?${params}`);
      const data = await res.json();
      if (res.ok) {
        setRecords(data.data);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        toast.error(data.error || 'Failed to load attendance records');
      }
    } catch (error) {
      console.error('Attendance fetch failed', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }

  async function fetchOpenSessions() {
    try {
      const res = await fetch('/api/attendance/qr');
      const data = await res.json();
      if (res.ok) {
        setActiveSessions(data.data?.sessions || []);
      } else {
        setActiveSessions([]);
      }
    } catch (error) {
      console.error('Failed to load open sessions', error);
      setActiveSessions([]);
    }
  }

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (val) => new Date(val).toLocaleDateString(),
    },
    {
      key: 'courseId',
      label: 'Course',
      render: (val) => (
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{val?.courseCode || 'N/A'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{val?.courseTitle || ''}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'verificationMethod',
      label: 'Method',
      render: (val) => (
        <Badge variant="info" className="capitalize">{val || 'manual'}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Attendance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View your attendance records</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary-600" />
            <span className="font-semibold text-slate-900 dark:text-white">
              Attendance Records ({pagination.total})
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filter by course code..."
              value={filterCourse}
              onChange={(e) => {
                setFilterCourse(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full sm:w-64 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={() => setScanModalOpen(true)}
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
            >
              Scan QR
            </button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table
            columns={columns}
            data={records}
            loading={loading}
            pagination={pagination}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Open QR Attendance Sessions</h3>
        </CardHeader>
        <CardBody>
          {activeSessions.length > 0 ? (
            <div className="grid gap-4">
              {activeSessions.map((session) => (
                <div key={session._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{session.courseId?.courseCode || 'Unknown Course'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{session.courseId?.courseTitle || ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Expires at</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{new Date(session.expiresAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No open QR attendance sessions are available right now.</p>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={scanModalOpen} onClose={() => setScanModalOpen(false)} title="Scan Attendance QR" size="md">
        <div className="space-y-4">
          <div id="qr-reader" className="w-full rounded-lg bg-slate-900/5 dark:bg-slate-800/70 h-80" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{scannerMessage}</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setScanModalOpen(false);
                stopScanner();
              }}
              className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
