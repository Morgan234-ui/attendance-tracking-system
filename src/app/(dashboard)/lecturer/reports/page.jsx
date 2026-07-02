'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { FileText, Download } from 'lucide-react';

export default function LecturerReportsPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      if (d.data?.assignedCourses) setCourses(d.data.assignedCourses);
    }).catch(() => {});
  }, []);

  async function generateReport() {
    if (!selectedCourse) return toast.error('Select a course');
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=course&courseId=${selectedCourse}`);
      const data = await res.json();
      if (res.ok) {
        setReportData(data.data);
        toast.success('Report generated');
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Attendance reports for your courses</p>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select
                label="Course"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                placeholder="Select course"
                options={courses.map(c => ({ value: c._id, label: `${c.courseCode} - ${c.courseTitle}` }))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={generateReport} loading={loading} icon={FileText}>Generate</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {reportData?.studentStats && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900 dark:text-white">Course Attendance Report</h3>
          </CardHeader>
          <CardBody className="p-0">
            <Table
              columns={[
                { key: 'name', label: 'Student' },
                { key: 'matricNumber', label: 'Matric No.' },
                { key: 'present', label: 'Present' },
                { key: 'absent', label: 'Absent' },
                { key: 'late', label: 'Late' },
                { key: 'percentage', label: 'Percentage', render: (val) => (
                  <Badge variant={val >= 75 ? 'active' : val >= 50 ? 'warning' : 'danger'}>
                    {val}%
                  </Badge>
                )},
              ]}
              data={reportData.studentStats}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
