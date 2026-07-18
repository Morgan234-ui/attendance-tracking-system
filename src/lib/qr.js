import QRCode from 'qrcode';
import crypto from 'crypto';

export async function generateQRCode(courseId, lecturerId, expiresInMinutes = 15) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Encode only the token: the server resolves the session from it, and a
  // short payload keeps the QR coarse (larger modules) so cameras lock on fast.
  const qrDataUrl = await QRCode.toDataURL(token, {
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  return {
    token,
    qrDataUrl,
    expiresAt,
  };
}
