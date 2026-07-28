'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { Users } from 'lucide-react';

// Lists students enrolled in a given course. Used by admin and lecturer pages.
// The /api/enrollments endpoint scopes results by role, so lecturers only
// receive data for courses assigned to them.
export default function EnrolledStudentsModal({ course, isOpen, onClose }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !course?._id) return;
    let active = true;
    setLoading(true);
    fetch(`/api/enrollments?courseId=${course._id}`)
      .then((r) => r.json().then((body) => ({ ok: r.ok, body })))
      .then(({ ok, body }) => {
        if (!active) return;
        if (ok) setEnrollments(body.data || []);
        else toast.error(body.error || 'Failed to load enrolled students');
      })
      .catch(() => active && toast.error('Failed to load enrolled students'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [isOpen, course?._id]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={course ? `Enrolled Students — ${course.courseCode}` : 'Enrolled Students'}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Users className="h-4 w-4 text-primary-600" />
          <span>{course?.courseTitle}</span>
          <Badge variant="info" className="ml-auto">{enrollments.length} enrolled</Badge>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700/40 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            <Users className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            No students enrolled yet.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {enrollments.map((e) => {
              const student = e.studentId;
              return (
                <div key={e._id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {student?.userId?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {student?.userId?.email || ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {student?.level && <Badge variant="info">{student.level}L</Badge>}
                    <span className="text-sm font-mono text-slate-600 dark:text-slate-300">
                      {student?.matricNumber || 'N/A'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
