// Web App Manifest — makes the app installable (PWA) and controls how it
// appears when launched from a device home screen.
export default function manifest() {
  return {
    name: 'USAMS — Uniport Student Attendance Management System',
    short_name: 'USAMS',
    description:
      'QR-code attendance, reporting, and analytics for universities. Manage departments, courses, lecturers, and students in one place.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#2563eb',
    categories: ['education', 'productivity'],
    icons: [
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'maskable',
      },
    ],
  };
}
