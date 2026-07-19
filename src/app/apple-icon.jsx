import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Apple touch icon — rendered to PNG at build/request time.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
          borderRadius: 40,
        }}
      >
        <svg width="112" height="112" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    ),
    { ...size }
  );
}
