# Student Attendance Management System (SAMS)

A modern web-based Student Attendance Management System for universities built with Next.js 15, MongoDB, and React.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js (JWT)
- **State Management**: React Context
- **Charts**: Recharts
- **UI**: Lucide Icons, Sonner Toasts

## Features

### Three User Roles
- **Admin**: Manage departments, courses, lecturers, students, sessions, reports
- **Lecturer**: Take attendance, generate QR codes, view course stats
- **Student**: View attendance records, download reports, receive warnings

### Attendance Methods
- Manual attendance marking
- QR code attendance (configurable expiry time)
- Biometric-ready architecture for future integration

### Reporting
- Daily, weekly, monthly, course, and department reports
- PDF and Excel export support
- Student attendance summaries

### Notifications
- Low attendance warnings (<75%)
- In-app notification system
- Email notification infrastructure

### UI/UX
- Responsive design
- Dark mode support
- Sidebar navigation
- Dashboard cards and charts
- Loading skeletons
- Toast notifications

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your MongoDB URI and other settings

# Seed the database with sample data
node -r @swc/register src/lib/seed.js
# Or use: npx tsx src/lib/seed.js

# Start the development server
npm run dev
```

### Demo Credentials

| Role      | Email                          | Password      |
|-----------|-------------------------------|---------------|
| Admin     | admin@university.edu           | password123   |
| Lecturer  | sarah.johnson@university.edu   | password123   |
| Student   | student1@university.edu        | password123   |

## Project Structure

```
src/
  app/
    (auth)/login/          # Login page
    (dashboard)/
      admin/               # Admin dashboard & CRUD pages
      lecturer/            # Lecturer dashboard & attendance
      student/             # Student dashboard & records
    api/                   # API routes
      auth/                # NextAuth
      departments/         # Department CRUD
      courses/             # Course CRUD
      students/            # Student CRUD
      lecturers/           # Lecturer CRUD
      attendance/          # Attendance + QR + Bulk
      enrollments/         # Enrollment management
      sessions/            # Academic sessions
      reports/             # Report generation
      notifications/       # Notifications
      dashboard/           # Dashboard stats
  components/
    ui/                    # Reusable UI components
    layout/                # Sidebar, Header, Layout
    dashboard/             # StatCard, Charts
  contexts/                # Auth, Theme, App contexts
  lib/                     # Utilities (mongodb, auth, qr, email, reports)
  models/                  # Mongoose models
  middleware.js            # Route protection
```

## API Endpoints

| Method | Endpoint              | Description               |
|--------|----------------------|---------------------------|
| GET    | /api/dashboard       | Dashboard statistics      |
| GET    | /api/departments     | List departments          |
| POST   | /api/departments     | Create department         |
| PUT    | /api/departments/[id]| Update department         |
| DELETE | /api/departments/[id]| Delete department         |
| GET    | /api/courses         | List courses              |
| POST   | /api/courses         | Create course             |
| GET    | /api/students        | List students             |
| POST   | /api/students        | Create student            |
| GET    | /api/lecturers       | List lecturers            |
| POST   | /api/lecturers       | Create lecturer           |
| GET    | /api/attendance      | List attendance records   |
| POST   | /api/attendance      | Create attendance record  |
| POST   | /api/attendance/bulk | Bulk attendance marking   |
| POST   | /api/attendance/qr   | Generate QR code          |
| PUT    | /api/attendance/qr   | Scan QR (student)         |
| GET    | /api/enrollments     | List enrollments          |
| POST   | /api/enrollments     | Create enrollment         |
| GET    | /api/sessions        | List sessions             |
| POST   | /api/sessions        | Create session            |
| GET    | /api/reports         | Generate reports          |
| GET    | /api/notifications   | List notifications        |

## Security

- Password hashing with bcryptjs
- JWT-based authentication via NextAuth
- Role-based access control
- Route protection via Next.js middleware
- Input validation on API routes
- MongoDB injection prevention via Mongoose

## Deployment

The application is deployment-ready for platforms like Vercel, Railway, or any Node.js hosting.

1. Set environment variables on your hosting platform
2. Ensure MongoDB is accessible (use MongoDB Atlas for cloud)
3. Run `npm run build` to verify the build
4. Deploy via your preferred platform

## License

MIT
