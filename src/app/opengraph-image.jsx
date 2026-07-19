import { ImageResponse } from 'next/og';

export const alt = 'USAMS — Uniport Student Attendance Management System';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Social share card (Open Graph + Twitter), rendered to PNG.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #1d4ed8 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: 'rgba(255,255,255,0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="60" height="60" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 14L52 22L32 30L12 22L32 14Z" fill="#ffffff" />
              <path
                d="M20 26.5V35C20 38.3 25.4 41 32 41C38.6 41 44 38.3 44 35V26.5"
                stroke="#ffffff"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M52 22V32" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
              <path
                d="M25.5 45.5L30 50L39 40.5"
                stroke="#bbf7d0"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em' }}>USAMS</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Student Attendance
          </span>
          <span style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Management System
          </span>
          <span style={{ fontSize: 32, color: 'rgba(255,255,255,0.82)', marginTop: 12 }}>
            QR-code attendance, reporting, and analytics for universities.
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
