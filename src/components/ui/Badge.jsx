'use client';

import { clsx } from 'clsx';

const variants = {
  present: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  absent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  late: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  excused: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  inactive: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
  admin: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400',
  lecturer: 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-400',
  student: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-400',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function Badge({ children, variant = 'info', className = '' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
