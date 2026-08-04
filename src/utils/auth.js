// Password hashing helpers.
//
// IMPORTANT: This only stops passwords from being stored/displayed as plaintext.
// It does NOT make the database secure — this app has no server and no Firestore
// Security Rules, so anyone with the Firebase config (visible in the built JS bundle)
// can still read/write the database directly, bypassing this check entirely.
// Real protection requires Firebase Authentication + Firestore Security Rules
// deployed from the Firebase Console (see README "Security" section).
import bcrypt from 'bcryptjs';

const BCRYPT_PREFIX = /^\$2[aby]?\$/;

export const isHashed = (value) => typeof value === 'string' && BCRYPT_PREFIX.test(value);

export const hashPassword = (plainText) => bcrypt.hashSync(plainText, 10);

// Accepts both already-hashed passwords and legacy plaintext ones so existing
// accounts keep working; callers should re-hash and persist after a successful
// legacy-plaintext login (see App.jsx handleLogin).
export const verifyPassword = (plainText, stored) => {
  if (isHashed(stored)) return bcrypt.compareSync(plainText, stored);
  return plainText === stored;
};
