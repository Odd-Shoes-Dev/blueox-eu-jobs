import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Random, URL-safe token for email verification / password reset links. */
export function generateToken(): string {
  return [...Array(32)]
    .map(() => Math.floor(Math.random() * 36).toString(36))
    .join('');
}
