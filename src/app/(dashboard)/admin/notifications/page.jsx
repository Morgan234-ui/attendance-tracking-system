'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Bell, CheckCircle, AlertTriangle, Info, Megaphone } from 'lucide-react';
import Badge from '@/components/ui/Badge';

const typeIcons = {
  warning: AlertTriangle,
  info: Info,
  announcement: Megaphone,
  reminder: Bell,
};

const typeColors = {
  warning: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  announcement: 'text-primary-500 bg-primary-50 dark:bg-primary-900/20',
  reminder: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (res.ok) setNotifications(data.data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id) {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch {}
  }

  async function markAllRead() {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success('All notifications marked as read');
      }
    } catch {}
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View system notifications and warnings</p>
        </div>
        <Button onClick={markAllRead} variant="outline" icon={CheckCircle}>Mark All Read</Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ))
        ) : notifications.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Bell className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No notifications</p>
            </CardBody>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = typeIcons[notification.type] || Bell;
            const colors = typeColors[notification.type] || typeColors.info;

            return (
              <Card key={notification._id} hover className={!notification.isRead ? 'border-l-4 border-l-primary-500' : ''}>
                <CardBody className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${colors}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{notification.title}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={notification.type}>{notification.type}</Badge>
                        {!notification.isRead && (
                          <button onClick={() => markAsRead(notification._id)}
                            className="text-xs text-primary-600 hover:underline">Mark read</button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{notification.message}</p>
                    <p className="text-xs text-slate-400 mt-2">{new Date(notification.createdAt).toLocaleString()}</p>
                  </div>
                </CardBody>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
