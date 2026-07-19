// Canonical origin for the app. Set NEXT_PUBLIC_SITE_URL in production
// (e.g. https://usams.example.edu); falls back to localhost for dev.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/$/, '');

export const SITE_NAME = 'USAMS';
export const SITE_TITLE =
  'USAMS — Uniport Student Attendance Management System';
export const SITE_DESCRIPTION =
  'A modern web-based student attendance management system for universities: QR-code attendance, role-based dashboards, reporting, and analytics.';
