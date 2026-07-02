'use client';

import { clsx } from 'clsx';

export default function StatusBadge({ status }) {
  const statusConfig = {
    present: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    absent: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
    late: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    excused: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  };

  const config = statusConfig[status] || statusConfig.absent;

  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', config.bg, config.text)}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', config.dot)} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
