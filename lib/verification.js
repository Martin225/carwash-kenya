import crypto from 'crypto';

export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function generateVerificationLink(baseUrl, token) {
  return `${baseUrl}/verify-email?token=${token}`;
}