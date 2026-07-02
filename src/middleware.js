import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/admin/:path*',
    '/lecturer/:path*',
    '/student/:path*',
    '/api/departments/:path*',
    '/api/courses/:path*',
    '/api/students/:path*',
    '/api/lecturers/:path*',
    '/api/attendance/:path*',
    '/api/enrollments/:path*',
    '/api/sessions/:path*',
    '/api/reports/:path*',
    '/api/notifications/:path*',
    '/api/dashboard/:path*',
  ],
};
