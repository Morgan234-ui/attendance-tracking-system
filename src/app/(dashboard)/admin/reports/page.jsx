'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('summary');
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/departments?limit=100').then(r => r.json()).then(d => d.data && setDepartments(d.data)).catch(() => {});
    fetch('/api/courses?limit=100').then(r => r.json()).then(d => d.data && setCourses(d.data)).catch(() => {});
  }, []);

  async function generateReport() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: reportType });
      if (selectedDepartment) params.append('departmentId', selectedDepartment);
      if (selectedCourse) params.append('courseId', selectedCourse);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/reports?${params}`);
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

  function exportPDF() {
    if (!reportData) return;
    toast.info('PDF export initiated. In production, this would use jsPDF.');
  }

  function exportExcel() {
    if (!reportData) return;
    toast.info('Excel export initiated. In production, this would use xlsx.');
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Generate and export attendance reports</p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            Report Filters
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={[
                { value: 'summary', label: 'Summary Report' },
                { value: 'course', label: 'Course Report' },
                { value: 'department', label: 'Department Report' },
              ]}
            />
            <Select
              label="Department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              placeholder="All Departments"
              options={departments.map(d => ({ value: d._id, label: d.name }))}
            />
            <Select
              label="Course"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              placeholder="All Courses"
              options={courses.map(c => ({ value: c._id, label: `${c.courseCode} - ${c.courseTitle}` }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">From</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">To</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Button onClick={generateReport} loading={loading}>Generate Report</Button>
            {reportData && (
              <>
                <Button variant="outline" onClick={exportPDF} icon={Download}>PDF</Button>
                <Button variant="outline" onClick={exportExcel} icon={FileSpreadsheet}>Excel</Button>
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {reportData && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-slate-900 dark:text-white">Report Results</h3>
          </CardHeader>
          <CardBody>
            {reportType === 'summary' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{reportData.totalStudents}</p>
                  <p className="text-xs text-blue-600/70">Students</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{reportData.totalLecturers}</p>
                  <p className="text-xs text-emerald-600/70">Lecturers</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">{reportData.totalCourses}</p>
                  <p className="text-xs text-orange-600/70">Courses</p>
                </div>
                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-teal-600">{reportData.totalDepartments}</p>
                  <p className="text-xs text-teal-600/70">Departments</p>
                </div>
              </div>
            )}
            {reportType === 'course' && reportData.studentStats && (
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
            )}
            {reportType === 'department' && reportData.courseStats && (
              <Table
                columns={[
                  { key: 'courseCode', label: 'Code' },
                  { key: 'courseTitle', label: 'Title' },
                  { key: 'totalRecords', label: 'Total Records' },
                  { key: 'presentRecords', label: 'Present' },
                  { key: 'percentage', label: 'Percentage', render: (val) => (
                    <Badge variant={val >= 75 ? 'active' : val >= 50 ? 'warning' : 'danger'}>
                      {val}%
                    </Badge>
                  )},
                ]}
                data={reportData.courseStats}
              />
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
