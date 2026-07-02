'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import StatusBadge from '@/components/ui/StatusBadge';
import Badge from '@/components/ui/Badge';
import { ClipboardCheck } from 'lucide-react';

export default function StudentAttendancePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  useEffect(() => {
    fetchAttendance();
  }, [pagination.page, filterCourse]);

  async function fetchAttendance() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (filterCourse) params.append('courseId', filterCourse);

      const res = await fetch(`/api/attendance?${params}`);
      const data = await res.json();
      if (res.ok) {
        setRecords(data.data);
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
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
          <div className="w-full sm:w-48">
            <input
              type="text"
              placeholder="Filter by course code..."
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
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
    </div>
  );
}
