'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Plus, Calendar, Edit2 } from 'lucide-react';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ sessionName: '', semester: 'first', isActive: false, startDate: '', endDate: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    setLoading(true);
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (res.ok) setSessions(data.data);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ sessionName: '', semester: 'first', isActive: false, startDate: '', endDate: '' });
    setModalOpen(true);
  }

  function openEdit(session) {
    setEditing(session._id);
    setForm({
      sessionName: session.sessionName,
      semester: session.semester,
      isActive: session.isActive,
      startDate: session.startDate ? new Date(session.startDate).toISOString().split('T')[0] : '',
      endDate: session.endDate ? new Date(session.endDate).toISOString().split('T')[0] : '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        id: editing,
        ...form,
        startDate: form.startDate ? new Date(form.startDate) : undefined,
        endDate: form.endDate ? new Date(form.endDate) : undefined,
      };
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch('/api/sessions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(editing ? 'Session updated' : 'Session created');
        setModalOpen(false);
        fetchSessions();
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Academic Sessions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage academic sessions and semesters</p>
        </div>
        <Button onClick={openCreate} icon={Plus}>Add Session</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ))
        ) : sessions.map((session) => (
          <Card key={session._id} hover>
            <CardBody>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{session.sessionName}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 capitalize">
                    {session.semester} Semester
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant={session.isActive ? 'active' : 'inactive'}>
                      {session.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {session.startDate && (
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(session.startDate).toLocaleDateString()} - {session.endDate ? new Date(session.endDate).toLocaleDateString() : 'Ongoing'}
                    </p>
                  )}
                </div>
                <button onClick={() => openEdit(session)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <Edit2 className="h-4 w-4 text-primary-600" />
                </button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Session' : 'Add Session'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Session Name" value={form.sessionName} onChange={(e) => setForm(prev => ({ ...prev, sessionName: e.target.value }))}
            placeholder="e.g. 2024/2025" required />
          <Select label="Semester" value={form.semester} onChange={(e) => setForm(prev => ({ ...prev, semester: e.target.value }))}
            options={[{ value: 'first', label: 'First Semester' }, { value: 'second', label: 'Second Semester' }]} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))} />
            <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Set as active session</span>
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={submitting}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
