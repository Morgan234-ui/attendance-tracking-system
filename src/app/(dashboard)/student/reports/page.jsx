'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatCard from '@/components/dashboard/StatCard';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import StatusBadge from '@/components/ui/StatusBadge';
import { FileText, Download, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

export default function StudentReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState('');

  useEffect(() => {
    async function getStudentId() {
      try {
        const res = await fetch('/api/dashboard');
        const data = await res.json();
        if (res.ok && data.data?.student?._id) {
          setStudentId(data.data.student._id);
        }
      } catch {}
    }
    getStudentId();
  }, []);

  useEffect(() => {
    if (studentId) generateReport();
  }, [studentId]);

  async function generateReport() {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=student&studentId=${studentId}`);
      const data = await res.json();
      if (res.ok) {
        setReportData(data.data);
      } else {
        toast.error('Failed to generate report');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Attendance summary and details</p>
        </div>
        <Button variant="outline" onClick={generateReport} loading={loading} icon={FileText}>
          Refresh
        </Button>
      </div>

      {reportData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Classes"
              value={reportData.total}
              icon={FileText}
              color="blue"
            />
            <StatCard
              title="Present"
              value={reportData.present}
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="Absent"
              value={reportData.absent}
              icon={XCircle}
              color="red"
            />
            <StatCard
              title="Percentage"
              value={`${reportData.percentage}%`}
              icon={reportData.percentage >= 75 ? CheckCircle : AlertTriangle}
              color={reportData.percentage >= 75 ? 'green' : 'red'}
            />
          </div>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-slate-900 dark:text-white">Attendance Details</h3>
            </CardHeader>
            <CardBody className="p-0">
              <Table
                columns={[
                  {
                    key: 'date',
                    label: 'Date',
                    render: (val) => new Date(val).toLocaleDateString(),
                  },
                  { key: 'course', label: 'Course Code' },
                  { key: 'courseTitle', label: 'Course Title' },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (val) => <StatusBadge status={val} />,
                  },
                ]}
                data={reportData.records || []}
                loading={loading}
              />
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
