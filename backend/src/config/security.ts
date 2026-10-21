import crypto from 'crypto';

let ephemeralDevSecret: string | null = null;

/**
 * Returns the JWT signing secret from environment variables.
 * Never falls back to a predictable hardcoded string.
 */
export const getJwtSecret = (): string => {
  const envSecret = process.env.JWT_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable must be set and at least 16 characters in production.');
  }

  if (!ephemeralDevSecret) {
    ephemeralDevSecret = envSecret || crypto.randomBytes(32).toString('hex');
  }
  return ephemeralDevSecret;
};

/**
 * Returns the list of allowed CORS origins from environment variables.
 */
export const getAllowedOrigins = (): string[] => {
  const raw = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '';
  const configured = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  // Safe local defaults for development
  return [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:3000',
  ];
};
