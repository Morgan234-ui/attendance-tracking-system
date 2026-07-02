'use client';

import { clsx } from 'clsx';
import Sidebar from './Sidebar';
import Header from './Header';
import { useApp } from '@/contexts/AppContext';

export default function DashboardLayout({ children }) {
  const { sidebarOpen } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div
        className={clsx(
          'transition-all duration-300',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-[72px]'
        )}
      >
        <Header />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
