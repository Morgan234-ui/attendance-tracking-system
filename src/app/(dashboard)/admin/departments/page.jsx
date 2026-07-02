'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Table from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Plus, Search, Edit2, Trash2, Building2 } from 'lucide-react';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', faculty: '', code: '' });
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/departments?search=${search}&page=${pagination.page}&limit=${pagination.limit}`);
      const data = await res.json();
      if (res.ok) {
        setDepartments(data.data);
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, [search, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', faculty: '', code: '' });
    setModalOpen(true);
  }

  function openEdit(dept) {
    setEditing(dept._id);
    setForm({ name: dept.name, faculty: dept.faculty, code: dept.code });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editing ? `/api/departments/${editing}` : '/api/departments';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editing ? 'Department updated' : 'Department created');
        setModalOpen(false);
        fetchDepartments();
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
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Department deleted');
        fetchDepartments();
      } else {
        toast.error('Failed to delete department');
      }
    } catch {
      toast.error('Something went wrong');
    }
  }

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'faculty', label: 'Faculty' },
    {
      key: 'createdAt',
      label: 'Created',
      render: (val) => new Date(val).toLocaleDateString(),
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Departments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage university departments</p>
        </div>
        <Button onClick={openCreate} icon={Plus}>Add Department</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600" />
            <span className="font-semibold text-slate-900 dark:text-white">
              All Departments ({pagination.total})
            </span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search departments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table
            columns={columns}
            data={departments}
            loading={loading}
            pagination={pagination}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          />
        </CardBody>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Department' : 'Add Department'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department Name"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Computer Science"
            required
          />
          <Input
            label="Faculty"
            value={form.faculty}
            onChange={(e) => setForm(prev => ({ ...prev, faculty: e.target.value }))}
            placeholder="e.g. Faculty of Science"
            required
          />
          <Input
            label="Department Code"
            value={form.code}
            onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
            placeholder="e.g. CSC"
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={submitting}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
