'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const paths = {
        admin: '/admin',
        lecturer: '/lecturer',
        student: '/student',
      };
      router.replace(paths[user.role] || '/login');
    } else if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [user, loading, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-primary-600 flex items-center justify-center">
          <svg className="h-8 w-8 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Loading...</h2>
        <p className="text-sm text-slate-500 mt-1">Redirecting to your dashboard</p>
      </div>
    </div>
  );
}
