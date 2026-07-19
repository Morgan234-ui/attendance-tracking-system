# Student Attendance Management System (SAMS)

A web-based attendance management system for universities. Admins manage the
academic structure (departments, courses, sessions, people), lecturers take
attendance — including live **QR-code sessions** students scan from their phones
— and students track their own attendance and download reports.

Built with Next.js 15 (App Router), React 19, MongoDB/Mongoose, and NextAuth.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Seeding Data & Demo Credentials](#seeding-data--demo-credentials)
- [How the Codebase Is Organized](#how-the-codebase-is-organized)
- [Data Model](#data-model)
- [Authentication & Authorization](#authentication--authorization)
- [The QR Attendance Flow](#the-qr-attendance-flow)
- [API Reference](#api-reference)
- [Reporting & Notifications](#reporting--notifications)
- [Deployment](#deployment)

---

## Tech Stack

| Layer            | Technology                                             |
|------------------|--------------------------------------------------------|
| Framework        | Next.js 15 (App Router), React 19                      |
| Backend          | Next.js Route Handlers (`src/app/api/**/route.js`)     |
| Database         | MongoDB via Mongoose 8                                  |
| Auth             | NextAuth 4 (Credentials provider, JWT sessions)        |
| Styling          | Tailwind CSS 3, dark mode via `class` strategy         |
| Client state     | React Context (`Auth`, `Theme`, `App`)                 |
| QR generation    | `qrcode` (server) — data-URL PNGs                      |
| QR scanning      | `html5-qrcode` (client, camera-based)                  |
| Charts           | Recharts                                               |
| Reports          | `jspdf` + `jspdf-autotable` (PDF), `xlsx` (Excel)      |
| Email            | Nodemailer (SMTP)                                       |
| Icons / toasts   | `lucide-react`, `sonner`                               |

> Note: the project is written in **JavaScript** (`.js` / `.jsx`) even though a
> `tsconfig.json` is present — TypeScript is configured for editor tooling and
> type-checking of dependencies, not enforced on source files.

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **MongoDB** — a local instance or a MongoDB Atlas cluster

### Install & run

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file (see the next section) and set MONGODB_URI etc.

# 3. Seed the database with a full demo dataset
npm run seed

# 4. Start the dev server
npm run dev
```

The app runs at **http://localhost:3000**. Unauthenticated visitors are
redirected to `/login`; after signing in, users land on the dashboard for their
role (`/admin`, `/lecturer`, or `/student`).

### Available scripts

| Command             | What it does                                              |
|---------------------|----------------------------------------------------------|
| `npm run dev`       | Start the Next.js dev server                             |
| `npm run build`     | Production build                                         |
| `npm start`         | Serve the production build                               |
| `npm run lint`      | Run ESLint (`eslint-config-next`)                        |
| `npm run seed`      | Seed a full demo dataset via `src/lib/seed.js` (tsx)     |
| `npm run seed:demo` | Create three minimal `@demo.local` login accounts only   |

---

## Environment Variables

Create a `.env` file in the project root:

```bash
# Required
MONGODB_URI=mongodb://127.0.0.1:27017/attendance_system
NEXTAUTH_SECRET=your-long-random-secret        # used to sign JWT sessions

# Optional — only needed for outbound email notifications
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-pass
SMTP_FROM="SAMS <no-reply@example.com>"
```

If SMTP variables are absent, email sending is skipped gracefully — the rest of
the app is unaffected.

---

## Seeding Data & Demo Credentials

`npm run seed` populates departments, an academic session, courses, lecturers,
students, and enrollments, and prints login details. The seeded accounts:

| Role      | Email                          | Password      |
|-----------|--------------------------------|---------------|
| Admin     | `admin@university.edu`         | `password123` |
| Lecturer  | `sarah.johnson@university.edu` | `password123` |
| Student   | `student1@university.edu`      | `password123` |

(Additional lecturers `michael.chen@` / `ada.okafor@` and students
`student2@…`, `student3@…`, etc. are also created — all with `password123`.)

`npm run seed:demo` is a lighter alternative that only inserts three login-only
accounts (`admin@demo.local`, `lecturer@demo.local`, `student@demo.local`) with
no supporting academic data.

---

## How the Codebase Is Organized

```
src/
├── middleware.js              # NextAuth route guard (see below)
│
├── app/
│   ├── layout.jsx             # Root layout: fonts, providers, <Toaster>
│   ├── page.jsx               # Landing → redirects by auth state
│   │
│   ├── (auth)/
│   │   └── login/             # Login page (Credentials sign-in)
│   │
│   ├── (dashboard)/
│   │   ├── layout.jsx         # Shared dashboard shell (Sidebar + Header)
│   │   ├── admin/             # Admin pages: departments, courses, students,
│   │   │                      #   lecturers, sessions, reports, notifications
│   │   ├── lecturer/          # Lecturer pages: dashboard, attendance, courses,
│   │   │                      #   reports  (attendance/ hosts the QR session UI)
│   │   └── student/           # Student pages: dashboard, attendance (QR scan),
│   │                          #   courses, reports
│   │
│   └── api/                   # Route handlers — see "API Reference"
│
├── components/
│   ├── ui/                    # Button, Input/Select, Modal, Table, Card,
│   │                          #   Badge, StatusBadge, Skeleton
│   ├── layout/                # Sidebar, Header, DashboardLayout
│   ├── dashboard/             # StatCard, AttendanceChart
│   └── providers.jsx          # Wires Session + Theme + App contexts
│
├── contexts/                  # AuthContext, ThemeContext, AppContext
│
├── lib/
│   ├── mongodb.js             # Cached Mongoose connection (connectDB)
│   ├── auth.js                # NextAuth options + hashPassword()
│   ├── middleware.js          # requireAuth / requireRole / handleApiError
│   ├── qr.js                  # generateQRCode() — token + PNG data URL
│   ├── report.js              # PDF (jspdf) + Excel (xlsx) generators
│   ├── email.js               # Nodemailer transport + email templates
│   ├── validator.js           # Field validators + sanitizeInput
│   └── seed.js                # Demo data seeder
│
└── models/                    # Mongoose schemas (see "Data Model")
```

### Two route groups

- **`(auth)`** — public authentication screens.
- **`(dashboard)`** — everything behind login, sharing one sidebar/header shell.
  The parentheses mean the folder name doesn't appear in the URL, so the login
  page is `/login` and the admin dashboard is `/admin`.

### API conventions

Every route handler follows the same shape:

```js
export const GET = handleApiError(async (req) => {
  const auth = await requireRole(req, ["lecturer", "admin"]);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  await connectDB();
  // ...business logic...
});
```

- **`handleApiError`** wraps handlers so uncaught errors become JSON `500`s
  instead of crashing the route.
- **`requireRole` / `requireAuth`** (in `src/lib/middleware.js`) read the
  NextAuth session and return `{ error, status }` when the caller isn't
  permitted — the handler short-circuits on that.
- **`connectDB`** reuses a cached Mongoose connection across hot reloads.

---

## Data Model

All models live in `src/models/`. Authentication identity is separated from
role-specific profile data: every person is a **`User`**, and lecturers/students
additionally have a profile document that references their `User`.

```
User (name, email, password, role: admin|lecturer|student, isActive)
 ├─ Lecturer (userId → User, staffId, departmentId, title)
 └─ Student  (userId → User, matricNumber, departmentId, level, sessionId)

Department (name, faculty, code)
AcademicSession (name, semester: first|second, isActive, start/end dates)

Course (courseCode, courseTitle, creditUnit, departmentId, lecturerId,
        semester: first|second|both, level: 100–600, sessionId)

Enrollment (studentId, courseId, sessionId)     // unique per (student, course)

Attendance (studentId, courseId, date, status: present|absent|late|excused,
            markedBy → Lecturer, verificationMethod: manual|qr_code|biometric)
            // UNIQUE index on (studentId, courseId, date)

QRSession (courseId, lecturerId, qrCode token, qrDataUrl, expiresAt, isActive)

Notification (userId, title, message, type: warning|info|announcement|reminder,
              isRead, related entity ref)
AuditLog (userId, action, entity, changes)
```

**Key invariant:** the unique index on `Attendance (studentId, courseId, date)`
guarantees a student can only be marked once per course per day, regardless of
how attendance was taken (manual, bulk, or QR). The QR scan handler relies on
this at the database level to stay correct under concurrent scans.

---

## Authentication & Authorization

Two layers protect the app:

1. **Edge middleware** (`src/middleware.js`) uses `next-auth/middleware` to
   require a valid session for all dashboard routes and most `/api/*` routes,
   redirecting signed-out users to `/login`. Its `matcher` lists exactly which
   paths are guarded.
2. **Per-handler role checks** (`requireRole`) inside each API route enforce
   *which* role may perform an action — e.g. only `lecturer`/`admin` can open a
   QR session, only `student` can scan one.

Sessions are **JWTs** (24-hour expiry). On sign-in, the user's `role` and `id`
are baked into the token (`jwt` callback) and surfaced on `session.user`
(`session` callback) so both server and client can branch on role. Passwords are
hashed with **bcrypt** (cost factor 12) via `hashPassword()`.

---

## The QR Attendance Flow

This is the system's signature feature; the code lives in
`src/app/api/attendance/qr/route.js` plus the two page components.

**Lecturer side** (`(dashboard)/lecturer/attendance/page.jsx`):

1. `POST /api/attendance/qr` opens a session for a selected course. A random
   32-byte hex **token** is generated, rendered to a QR PNG (`src/lib/qr.js`),
   and stored as a `QRSession` with an `expiresAt`. Only one active session per
   lecturer is allowed at a time.
2. The page shows the QR image and a live countdown to expiry, and polls the
   server every few seconds to refresh the list of students who have scanned.
3. `DELETE /api/attendance/qr?sessionId=…` closes the session early.

**Student side** (`(dashboard)/student/attendance/page.jsx`):

1. `GET /api/attendance/qr` lists the student's currently open sessions.
2. The camera scanner (`html5-qrcode`) reads the QR and calls
   `PUT /api/attendance/qr` with the decoded token.
3. The server resolves the token → active, non-expired `QRSession`, then creates
   a `present` `Attendance` record marked `qr_code`.

**Correctness & UX notes** (these address the real-world scanning bugs):

- The QR encodes **only the token** (not a JSON payload). A shorter payload
  produces a coarser, higher-contrast code that phone cameras lock onto much
  faster.
- The scanner's decode callback fires on *every* video frame the code is
  visible. The client guards against this with an in-flight ref + cooldown so a
  single physical scan produces exactly one request — otherwise the duplicate
  requests race and the later ones return "already marked."
- If a student is already marked for the day, the API returns **409** and the UI
  treats it as an informational outcome (attendance is already recorded), not an
  error. Concurrent scans that slip past the initial check are caught by the
  unique-index violation (Mongo error `11000`) and also mapped to a clean 409.

---

## API Reference

All endpoints are under `/api`. Unless noted, they require an authenticated
session; the **Roles** column lists who may call them.

### Attendance

| Method | Endpoint                        | Roles                     | Description                                   |
|--------|---------------------------------|---------------------------|-----------------------------------------------|
| GET    | `/api/attendance`               | student                   | Paginated list of the caller's records        |
| POST   | `/api/attendance`               | lecturer, admin           | Mark a single attendance record               |
| POST   | `/api/attendance/bulk`          | lecturer, admin           | Mark many students at once                    |
| GET    | `/api/attendance/qr`            | lecturer, admin, student  | Lecturer: active session + scans · Student: open sessions |
| POST   | `/api/attendance/qr`            | lecturer, admin           | Open a QR session (returns token + PNG)       |
| PUT    | `/api/attendance/qr`            | student                   | Scan a QR token to mark attendance            |
| DELETE | `/api/attendance/qr?sessionId=` | lecturer, admin           | Close an active QR session                    |

### Academic structure & people

| Method            | Endpoint                     | Description                        |
|-------------------|------------------------------|------------------------------------|
| GET / POST        | `/api/departments`           | List / create departments          |
| GET / PUT / DELETE| `/api/departments/[id]`      | Read / update / delete department  |
| —                 | `/api/department`, `/api/department/[id]` | Singular alias routes |
| GET / POST        | `/api/courses`               | List / create courses              |
| GET / PUT / DELETE| `/api/courses/[id]`          | Read / update / delete course      |
| GET / POST        | `/api/students`              | List / create students             |
| GET / PUT / DELETE| `/api/students/[id]`         | Read / update / delete student     |
| GET / POST        | `/api/lecturers`             | List / create lecturers            |
| GET / PUT / DELETE| `/api/lecturers/[id]`        | Read / update / delete lecturer    |
| GET / POST        | `/api/enrollments`           | List / create enrollments          |
| GET / POST        | `/api/sessions`              | List / create academic sessions    |

### Misc

| Method     | Endpoint             | Description                                  |
|------------|----------------------|----------------------------------------------|
| GET        | `/api/dashboard`     | Role-aware dashboard stats & assigned courses|
| GET        | `/api/reports`       | Generate report data (filtered/aggregated)   |
| GET        | `/api/notification`  | Current user's notifications                 |
| GET / PUT  | `/api/profile`       | Read / update the signed-in user's profile   |
| —          | `/api/auth/[...nextauth]` | NextAuth handler (sign-in/out, session) |

> The codebase currently ships **both** `/api/department` and
> `/api/departments` (and a singular `/api/notification`). New client code
> should prefer the plural CRUD routes; the singular ones are retained for
> existing callers.

---

## Reporting & Notifications

- **Reports** (`src/lib/report.js`): `generatePDFReport()` builds tabular PDFs
  with `jspdf` + `jspdf-autotable`; `generateExcelReport()` emits `.xlsx` via
  `xlsx`. Admin, lecturer, and student report pages consume these to let users
  download attendance summaries.
- **Notifications** (`src/models/Notification.js`, `/api/notification`): in-app
  messages typed as `warning | info | announcement | reminder`. Low-attendance
  warnings (below the 75% threshold) are the primary automated trigger.
- **Email** (`src/lib/email.js`): Nodemailer transport with ready-made templates
  (`attendanceWarningEmail`, `attendanceReminderEmail`). Requires SMTP env vars.

---

## Deployment

The app is a standard Next.js deployment (Vercel, Railway, Render, or any
Node.js host):

1. Provision a MongoDB database (MongoDB Atlas for cloud) and set
   `MONGODB_URI`.
2. Set `NEXTAUTH_SECRET` (and SMTP vars if email is needed) in the host's
   environment.
3. `npm run build` to verify, then deploy.
4. Optionally run `npm run seed` once against the production database to
   bootstrap demo data.

---

## License

MIT
