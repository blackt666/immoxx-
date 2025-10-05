import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * SECURITY-HARDENED crypto utilities for Bodensee Immobilien
 * Production-ready implementation with OWASP security standards
 * Supports both bcrypt and PBKDF2 password hashing
 */

/**
 * Get PBKDF2 iterations from environment or use secure default
 * OWASP recommends at least 210,000 iterations for PBKDF2-SHA512
 */
function getPbkdf2Iterations(): number {
  const envIterations = process.env.PBKDF2_ITERATIONS;
  if (envIterations) {
    const iterations = parseInt(envIterations, 10);
    if (iterations >= 210000) {
      return iterations;
    }
    console.warn(`⚠️ SECURITY: PBKDF2_ITERATIONS (${iterations}) is below OWASP minimum of 210,000. Using secure default.`);
  }
  return 210000; // OWASP recommended minimum for PBKDF2-SHA512
}

/**
 * DEPRECATED: Insecure base64 encoding - DO NOT USE FOR ENCRYPTION
 * @deprecated This function provides only obfuscation, not encryption. Use proper encryption libraries instead.
 */
export function encrypt(text: string, userPassword?: string): string {
  console.warn('🚨 SECURITY WARNING: encrypt() function uses base64 encoding, NOT encryption. Use proper encryption libraries for sensitive data.');
  
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }
  
  // Base64 encoding - NOT SECURE ENCRYPTION
  return Buffer.from(text).toString('base64');
}

/**
 * DEPRECATED: Insecure base64 decoding - DO NOT USE FOR DECRYPTION
 * @deprecated This function provides only deobfuscation, not decryption. Use proper encryption libraries instead.
 */
export function decrypt(encryptedData: string, userPassword?: string): string {
  console.warn('🚨 SECURITY WARNING: decrypt() function uses base64 decoding, NOT decryption. Use proper encryption libraries for sensitive data.');
  
  if (!encryptedData || typeof encryptedData !== 'string') {
    throw new Error('Invalid input: encryptedData must be a non-empty string');
  }
  
  try {
    return Buffer.from(encryptedData, 'base64').toString('utf8');
  } catch (error) {
    console.warn('⚠️ Base64 decoding error:', (error as Error).message);
    return encryptedData;
  }
}

/**
 * Generate cryptographically secure random string for OAuth state
 */
export function generateSecureState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate secure random nonce
 */
export function generateNonce(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash password securely using crypto.pbkdf2Sync with configurable iterations
 * Format: iterations:salt:hash for migration detection and backward compatibility
 * SECURITY: Uses OWASP-recommended 210,000+ iterations for PBKDF2-SHA512
 */
export function hashPassword(password: string): string {
  const iterations = getPbkdf2Iterations();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `${iterations}:${salt}:${hash}`;
}

/**
 * Verify password against hash with automatic migration support
 * SECURITY: Supports bcrypt, PBKDF2, and legacy hash formats
 * - bcrypt format: $2a$, $2b$, $2y$ prefixes (SECURE - automatically migrated to PBKDF2)
 * - PBKDF2 legacy: salt:hash (1000 iterations - WEAK)
 * - PBKDF2 new: iterations:salt:hash (210,000+ iterations - SECURE)
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    // Check if this is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
    if (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2y$')) {
      console.log('🔐 SECURITY: Verifying bcrypt password hash (will be migrated to PBKDF2 on next login)');
      // Use bcryptjs compareSync for bcrypt hashes
      const isValid = bcrypt.compareSync(password, hashedPassword);
      return isValid;
    }

    // Otherwise, use PBKDF2 verification
    const parts = hashedPassword.split(':');

    if (parts.length === 2) {
      // Legacy format: salt:hash (1000 iterations - WEAK)
      console.warn('⚠️ SECURITY: Using legacy weak password hash format. User should be migrated to strong hash on next login.');
      const [salt, hash] = parts;
      const hashVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      return safeTimeComparison(hash, hashVerify);
    } else if (parts.length === 3) {
      // New format: iterations:salt:hash (configurable iterations - SECURE)
      const [iterationsStr, salt, hash] = parts;
      const iterations = parseInt(iterationsStr, 10);

      if (isNaN(iterations) || iterations < 1000) {
        console.error('🚨 SECURITY: Invalid iterations in password hash');
        return false;
      }

      // Warn if hash uses weak iterations
      if (iterations < 210000) {
        console.warn(`⚠️ SECURITY: Password hash uses weak iterations (${iterations}). User should be migrated to strong hash.`);
      }

      const hashVerify = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
      return safeTimeComparison(hash, hashVerify);
    }

    console.error('🚨 SECURITY: Invalid password hash format');
    return false;
  } catch (error) {
    console.error('🚨 SECURITY: Password verification error:', (error as Error).message);
    return false;
  }
}

/**
 * Check if a password hash is using weak security parameters
 * Returns true if the hash should be upgraded (rehashed) for better security
 */
export function isWeakPasswordHash(hashedPassword: string): boolean {
  try {
    // bcrypt hashes should be migrated to PBKDF2
    if (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2y$')) {
      return true; // bcrypt is considered weak for migration purposes
    }

    const parts = hashedPassword.split(':');

    if (parts.length === 2) {
      // Legacy format with 1000 iterations - WEAK
      return true;
    } else if (parts.length === 3) {
      const [iterationsStr] = parts;
      const iterations = parseInt(iterationsStr, 10);

      if (isNaN(iterations)) {
        return true; // Invalid format is considered weak
      }

      // Consider weak if below OWASP minimum
      return iterations < 210000;
    }

    return true; // Unknown format is considered weak
  } catch (error) {
    console.error('🚨 SECURITY: Error checking password hash strength:', (error as Error).message);
    return true; // Assume weak on error for safety
  }
}

/**
 * Create a secure rehash of an existing password
 * Used for migrating weak hashes to strong hashes during login
 */
export function rehashPassword(password: string, oldHash: string): string | null {
  try {
    // First verify the password against the old hash
    if (!verifyPassword(password, oldHash)) {
      return null; // Password doesn't match, don't rehash
    }
    
    // Create new strong hash
    return hashPassword(password);
  } catch (error) {
    console.error('🚨 SECURITY: Error rehashing password:', (error as Error).message);
    return null;
  }
}

/**
 * Safe time comparison to prevent timing attacks
 */
export function safeTimeComparison(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}