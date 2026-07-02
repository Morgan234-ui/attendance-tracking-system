'use client';

import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    icon: 'bg-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
  },
  purple: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    icon: 'bg-teal-500',
    text: 'text-teal-600 dark:text-teal-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
  },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  change,
  changeLabel,
}) {
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {change >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span
                className={clsx(
                  'text-xs font-medium',
                  change >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {change >= 0 ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={clsx('p-3 rounded-xl', colors.bg)}>
          <div className={clsx('h-8 w-8 rounded-lg flex items-center justify-center', colors.icon)}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
