'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Plus, Search, Edit2, Trash2, GraduationCap } from 'lucide-react';

export default function LecturersPage() {
  const titleOptions = [
    { value: 'Dr.', label: 'Dr.' },
    { value: 'Prof.', label: 'Prof.' },
    { value: 'Mr.', label: 'Mr.' },
    { value: 'Mrs.', label: 'Mrs.' },
    { value: 'Ms.', label: 'Ms.' },
  ];
  const [lecturers, setLecturers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', staffId: '', departmentId: '', title: 'Mr.' });
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchLecturers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lecturers?search=${search}&page=${pagination.page}&limit=${pagination.limit}`);
      const data = await res.json();
      if (res.ok) {
        setLecturers(data.data);
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Failed to load lecturers');
    } finally {
      setLoading(false);
    }
  }, [search, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchLecturers();
    fetch('/api/departments?limit=100')
      .then(r => r.json())
      .then(d => d.data && setDepartments(d.data))
      .catch(() => { });
  }, [fetchLecturers]);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', email: '', password: '', staffId: '', departmentId: '', title: 'Mr.' });
    setModalOpen(true);
  }

  function openEdit(lecturer) {
    setEditing(lecturer._id);
    setForm({
      name: lecturer.userId?.name || '',
      email: lecturer.userId?.email || '',
      password: '',
      staffId: lecturer.staffId,
      departmentId: lecturer.departmentId?._id || lecturer.departmentId || '',
      title: lecturer.title || 'Mr.',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editing ? `/api/lecturers/${editing}` : '/api/lecturers';
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
        toast.success(editing ? 'Lecturer updated' : 'Lecturer created');
        setModalOpen(false);
        fetchLecturers();
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
      const res = await fetch(`/api/lecturers/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Lecturer deleted'); fetchLecturers(); }
      else toast.error('Failed to delete lecturer');
    } catch { toast.error('Something went wrong'); }
  }

  const columns = [
    { key: 'name', label: 'Name', render: (_, row) => row.userId?.name || 'N/A' },
    { key: 'staffId', label: 'Staff ID', render: (val) => <span className="font-mono text-xs">{val}</span> },
    { key: 'email', label: 'Email', render: (_, row) => row.userId?.email || 'N/A' },
    { key: 'department', label: 'Department', render: (_, row) => row.departmentId?.name || 'N/A' },
    { key: 'title', label: 'Title', render: (val) => <Badge variant="info">{val}</Badge> },
    {
      key: '_id', label: 'Actions',
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lecturers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage lecturer records</p>
        </div>
        <Button onClick={openCreate} icon={Plus}>Add Lecturer</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary-600" />
            <span className="font-semibold text-slate-900 dark:text-white">All Lecturers ({pagination.total})</span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" placeholder="Search lecturers..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors" />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table columns={columns} data={lecturers} loading={loading} pagination={pagination}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))} />
        </CardBody>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Lecturer' : 'Add Lecturer'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} required />
            <Input label={editing ? 'Password (leave blank to keep)' : 'Password'} type="password" value={form.password}
              onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} required={!editing} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Staff ID" value={form.staffId} onChange={(e) => setForm(prev => ({ ...prev, staffId: e.target.value }))} placeholder="e.g. STF-0001" required />
            <Select label="Title" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              options={titleOptions} />
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
