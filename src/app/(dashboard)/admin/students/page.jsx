'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', password: '', matricNumber: '', departmentId: '', level: '100',
  });
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students?search=${search}&page=${pagination.page}&limit=${pagination.limit}`);
      const data = await res.json();
      if (res.ok) {
        setStudents(data.data);
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [search, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchStudents();
    fetch('/api/departments?limit=100')
      .then(r => r.json())
      .then(d => d.data && setDepartments(d.data))
      .catch(() => {});
  }, [fetchStudents]);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', email: '', password: '', matricNumber: '', departmentId: '', level: '100' });
    setModalOpen(true);
  }

  function openEdit(student) {
    setEditing(student._id);
    setForm({
      name: student.userId?.name || '',
      email: student.userId?.email || '',
      password: '',
      matricNumber: student.matricNumber,
      departmentId: student.departmentId?._id || student.departmentId || '',
      level: student.level,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editing ? `/api/students/${editing}` : '/api/students';
      const method = editing ? 'PUT' : 'POST';
      const body = { ...form };
      if (editing && !form.password) delete body.password;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editing ? 'Student updated' : 'Student created');
        setModalOpen(false);
        fetchStudents();
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
    if (!confirm('Are you sure? This will also delete the user account.')) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Student deleted');
        fetchStudents();
      } else {
        toast.error('Failed to delete student');
      }
    } catch {
      toast.error('Something went wrong');
    }
  }

  const columns = [
    {
      key: 'userId',
      label: 'Name',
      render: (val) => val?.name || 'N/A',
    },
    {
      key: 'matricNumber',
      label: 'Matric No.',
      render: (val) => <span className="font-mono text-xs">{val}</span>,
    },
    {
      key: 'userId',
      label: 'Email',
      render: (val) => val?.email || 'N/A',
    },
    {
      key: 'departmentId',
      label: 'Department',
      render: (val) => val?.name || val?.code || 'N/A',
    },
    {
      key: 'level',
      label: 'Level',
      render: (val) => <Badge variant="info">{val} Level</Badge>,
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Students</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage student records</p>
        </div>
        <Button onClick={openCreate} icon={Plus}>Add Student</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-600" />
            <span className="font-semibold text-slate-900 dark:text-white">All Students ({pagination.total})</span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table columns={columns} data={students} loading={loading} pagination={pagination}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))} />
        </CardBody>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add Student'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} required />
            <Input label={editing ? 'Password (leave blank to keep)' : 'Password'} type="password" value={form.password} onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} required={!editing} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Matric Number" value={form.matricNumber} onChange={(e) => setForm(prev => ({ ...prev, matricNumber: e.target.value }))} placeholder="e.g. CSC/21/0001" required />
            <Select label="Level" value={form.level} onChange={(e) => setForm(prev => ({ ...prev, level: e.target.value }))}
              options={['100','200','300','400','500','600'].map(l => ({ value: l, label: `${l} Level` }))} required />
          </div>
          <Select label="Department" value={form.departmentId} onChange={(e) => setForm(prev => ({ ...prev, departmentId: e.target.value }))}
            placeholder="Select department" options={departments.map(d => ({ value: d._id, label: `${d.code} - ${d.name}` }))} required />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
