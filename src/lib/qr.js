import QRCode from 'qrcode';
import crypto from 'crypto';

export async function generateQRCode(courseId, lecturerId, expiresInMinutes = 15) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  const payload = JSON.stringify({
    courseId,
    lecturerId,
    token,
    exp: expiresAt.getTime(),
  });

  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: 400,
    margin: 2,
    color: {
      dark: '#1e3a8a',
      light: '#ffffff',
    },
  });

  return {
    token,
    qrDataUrl,
    expiresAt,
  };
}

export function verifyQRToken(token, expectedCourseId) {
  try {
    const payload = JSON.parse(
      Buffer.from(token, 'hex').toString() ||
      JSON.parse(atob(token))
    );

    if (payload.exp < Date.now()) {
      return { valid: false, reason: 'QR code has expired' };
    }

    if (payload.courseId !== expectedCourseId) {
      return { valid: false, reason: 'Invalid course' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: 'Invalid QR code' };
  }
}
