import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, isHashed } from './auth';

describe('isHashed', () => {
  it('recognizes bcrypt hashes', () => {
    expect(isHashed(hashPassword('secret123'))).toBe(true);
    expect(isHashed('$2a$10$abcdefghijklmnopqrstuv')).toBe(true);
    expect(isHashed('$2b$10$abcdefghijklmnopqrstuv')).toBe(true);
  });

  it('rejects plaintext and non-string values', () => {
    expect(isHashed('123')).toBe(false);
    expect(isHashed('plaintext-password')).toBe(false);
    expect(isHashed(undefined)).toBe(false);
    expect(isHashed(null)).toBe(false);
    expect(isHashed(12345)).toBe(false);
  });
});

describe('hashPassword / verifyPassword', () => {
  it('hashes a password into a bcrypt hash distinct from the original', () => {
    const hash = hashPassword('mypassword');
    expect(hash).not.toBe('mypassword');
    expect(isHashed(hash)).toBe(true);
  });

  it('verifies a correct password against its hash', () => {
    const hash = hashPassword('correct-horse-battery-staple');
    expect(verifyPassword('correct-horse-battery-staple', hash)).toBe(true);
  });

  it('rejects an incorrect password against a hash', () => {
    const hash = hashPassword('correct-horse-battery-staple');
    expect(verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('still supports legacy plaintext comparison for un-migrated accounts', () => {
    expect(verifyPassword('123', '123')).toBe(true);
    expect(verifyPassword('123', '456')).toBe(false);
  });
});
