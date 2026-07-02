'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  ClipboardCheck,
  FileText,
  Bell,
  Settings,
  X,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

const adminLinks = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/departments', icon: Building2, label: 'Departments' },
  { href: '/admin/courses', icon: BookOpen, label: 'Courses' },
  { href: '/admin/lecturers', icon: GraduationCap, label: 'Lecturers' },
  { href: '/admin/students', icon: Users, label: 'Students' },
  { href: '/admin/sessions', icon: Calendar, label: 'Sessions' },
  { href: '/admin/reports', icon: FileText, label: 'Reports' },
  { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
];

const lecturerLinks = [
  { href: '/lecturer', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/lecturer/courses', icon: BookOpen, label: 'My Courses' },
  { href: '/lecturer/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { href: '/lecturer/reports', icon: FileText, label: 'Reports' },
];

const studentLinks = [
  { href: '/student', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/student/courses', icon: BookOpen, label: 'My Courses' },
  { href: '/student/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { href: '/student/reports', icon: FileText, label: 'Reports' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, isLecturer, isStudent } = useAuth();
  const { sidebarOpen, toggleSidebar, mobileSidebarOpen, closeMobileSidebar } = useApp();

  const links = isAdmin
    ? adminLinks
    : isLecturer
    ? lecturerLinks
    : studentLinks;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-200 dark:border-slate-700">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              SAMS
            </span>
          )}
        </Link>
        <button
          onClick={closeMobileSidebar}
          className="lg:hidden p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {links.map((link) => {
          const isActive = pathname === link.href ||
            (link.href !== `/${isAdmin ? 'admin' : isLecturer ? 'lecturer' : 'student'}` &&
             pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMobileSidebar}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              )}
            >
              <link.icon className={clsx('h-5 w-5 flex-shrink-0', isActive && 'text-primary-600 dark:text-primary-400')} />
              {sidebarOpen && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors w-full"
        >
          <ChevronLeft className={clsx('h-5 w-5 transition-transform', !sidebarOpen && 'rotate-180')} />
          {sidebarOpen && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col fixed top-0 left-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-30',
          sidebarOpen ? 'w-64' : 'w-[72px]'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={clsx(
          'lg:hidden fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50 transition-transform duration-300',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
