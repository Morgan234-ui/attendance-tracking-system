import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
}

export function attendanceWarningEmail(studentName, courseTitle, percentage) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Attendance Warning</h2>
      <p>Dear ${studentName},</p>
      <p>This is to notify you that your attendance for <strong>${courseTitle}</strong>
      has fallen below the required threshold.</p>
      <p>Current attendance: <strong style="color: #dc2626;">${percentage}%</strong></p>
      <p>Required minimum: <strong>75%</strong></p>
      <p>Please ensure you attend subsequent classes to meet the minimum requirement.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
      <p style="color: #6b7280; font-size: 12px;">
        This is an automated message from the Student Attendance Management System.
      </p>
    </div>
  `;
}

export function attendanceReminderEmail(lecturerName, courseTitle, date) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Attendance Reminder</h2>
      <p>Dear ${lecturerName},</p>
      <p>This is a reminder to take attendance for <strong>${courseTitle}</strong>
      scheduled for <strong>${date}</strong>.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
      <p style="color: #6b7280; font-size: 12px;">
        This is an automated message from the Student Attendance Management System.
      </p>
    </div>
  `;
}