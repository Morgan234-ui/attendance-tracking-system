'use client';

import { clsx } from 'clsx';

export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm',
        hover && 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={clsx('px-6 py-4 border-b border-slate-200 dark:border-slate-700', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={clsx('px-6 py-4', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={clsx('px-6 py-4 border-t border-slate-200 dark:border-slate-700', className)}>
      {children}
    </div>
  );
}
