import crypto from 'crypto';

/**
 * Genera el hash SHA256 de un valor sensible sin exponerlo directamente.
 */
export function encryptSHA256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}