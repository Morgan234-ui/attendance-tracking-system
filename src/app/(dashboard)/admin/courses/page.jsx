'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Plus, Search, Edit2, Trash2, BookOpen } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    courseCode: '', courseTitle: '', unit: '3', departmentId: '', lecturerId: '', semester: 'first', level: '100',
  });
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses?search=${search}&page=${pagination.page}&limit=${pagination.limit}`);
      const data = await res.json();
      if (res.ok) {
        setCourses(data.data);
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [search, pagination.page, pagination.limit]);

  async function fetchDepartments() {
    try {
      const res = await fetch('/api/departments?limit=100');
      const data = await res.json();
      if (res.ok) setDepartments(data.data);
    } catch {}
  }

  async function fetchLecturers() {
    try {
      const res = await fetch('/api/lecturers?limit=100');
      const data = await res.json();
      if (res.ok) setLecturers(data.data);
    } catch {}
  }

  useEffect(() => {
    fetchCourses();
    fetchDepartments();
    fetchLecturers();
  }, [fetchCourses]);

  function openCreate() {
    setEditing(null);
    setForm({ courseCode: '', courseTitle: '', unit: '3', departmentId: '', lecturerId: '', semester: 'first', level: '100' });
    setModalOpen(true);
  }

  function openEdit(course) {
    setEditing(course._id);
    setForm({
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      unit: String(course.unit),
      departmentId: course.departmentId?._id || course.departmentId || '',
      lecturerId: course.lecturerId?._id || course.lecturerId || '',
      semester: course.semester,
      level: course.level || '100',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editing ? `/api/courses/${editing}` : '/api/courses';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, unit: parseInt(form.unit) }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editing ? 'Course updated' : 'Course created');
        setModalOpen(false);
        fetchCourses();
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Course deleted');
        fetchCourses();
      } else {
        toast.error('Failed to delete course');
      }
    } catch {
      toast.error('Something went wrong');
    }
  }

  const columns = [
    { key: 'courseCode', label: 'Code' },
    { key: 'courseTitle', label: 'Title' },
    { key: 'unit', label: 'Units' },
    {
      key: 'departmentId',
      label: 'Department',
      render: (val) => val?.name || val?.code || 'N/A',
    },
    {
      key: 'semester',
      label: 'Semester',
      render: (val) => <Badge variant="info">{val}</Badge>,
    },
    {
      key: '_id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <Edit2 className="h-4 w-4 text-primary-600" />
          </button>
          <button onClick={() => handleDelete(row._id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Courses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage university courses</p>
        </div>
        <Button onClick={openCreate} icon={Plus}>Add Course</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-600" />
            <span className="font-semibold text-slate-900 dark:text-white">All Courses ({pagination.total})</span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table
            columns={columns}
            data={courses}
            loading={loading}
            pagination={pagination}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          />
        </CardBody>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Course' : 'Add Course'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Course Code"
              value={form.courseCode}
              onChange={(e) => setForm(prev => ({ ...prev, courseCode: e.target.value }))}
              placeholder="e.g. CSC 101"
              required
            />
            <Input
              label="Units"
              type="number"
              value={form.unit}
              onChange={(e) => setForm(prev => ({ ...prev, unit: e.target.value }))}
              min="1"
              max="6"
              required
            />
          </div>
          <Input
            label="Course Title"
            value={form.courseTitle}
            onChange={(e) => setForm(prev => ({ ...prev, courseTitle: e.target.value }))}
            placeholder="e.g. Introduction to Computer Science"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Department"
              value={form.departmentId}
              onChange={(e) => setForm(prev => ({ ...prev, departmentId: e.target.value }))}
              placeholder="Select department"
              options={departments.map(d => ({ value: d._id, label: `${d.code} - ${d.name}` }))}
              required
            />
            <Select
              label="Lecturer"
              value={form.lecturerId}
              onChange={(e) => setForm(prev => ({ ...prev, lecturerId: e.target.value }))}
              placeholder="Select lecturer"
              options={lecturers.map(l => ({ value: l._id, label: l.userId?.name || l.staffId }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Semester"
              value={form.semester}
              onChange={(e) => setForm(prev => ({ ...prev, semester: e.target.value }))}
              options={[
                { value: 'first', label: 'First Semester' },
                { value: 'second', label: 'Second Semester' },
                { value: 'both', label: 'Both Semesters' },
              ]}
              required
            />
            <Select
              label="Level"
              value={form.level}
              onChange={(e) => setForm(prev => ({ ...prev, level: e.target.value }))}
              options={['100','200','300','400','500','600'].map(l => ({ value: l, label: `${l} Level` }))}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
