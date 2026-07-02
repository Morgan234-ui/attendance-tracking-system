export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  return password.length >= 6;
}

export function validateMatricNumber(matric) {
  const re = /^[A-Z]{2,3}\/\d{2}\/\d{4,5}$/;
  return re.test(matric.toUpperCase());
}

export function validateStaffId(staffId) {
  const re = /^STF-\d{4,6}$/;
  return re.test(staffId.toUpperCase());
}

export function validateCourseCode(code) {
  const re = /^[A-Z]{3}\s?\d{3}$/;
  return re.test(code.toUpperCase());
}

export function validateRequired(value) {
  return value !== null && value !== undefined && value.toString().trim() !== '';
}

export function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
}
