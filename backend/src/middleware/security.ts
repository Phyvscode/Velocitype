import { Request, Response, NextFunction } from 'express';

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively strips MongoDB operator keys (starting with `$` or containing `.`)
 * and prototype-pollution keys from any incoming object or array.
 */
function deepSanitize(value: unknown, depth = 0): unknown {
  if (depth > 10 || value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepSanitize(item, depth + 1));
  }

  if (typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k.startsWith('$') || k.includes('.') || DANGEROUS_KEYS.has(k)) {
        continue;
      }
      clean[k] = deepSanitize(v, depth + 1);
    }
    return clean;
  }

  return value;
}

/**
 * Middleware: Sanitizes req.body, req.query, and req.params against NoSQL injection
 * and prototype pollution.
 */
export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    const sanitizedQuery = deepSanitize(req.query) as Record<string, any>;
    for (const key of Object.keys(req.query)) {
      delete (req.query as Record<string, any>)[key];
    }
    Object.assign(req.query, sanitizedQuery);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = deepSanitize(req.params) as Record<string, string>;
  }
  next();
};

/**
 * Middleware: Enforces HTTPS in production and sets Strict-Transport-Security.
 */
export const enforceHttps = (req: Request, res: Response, next: NextFunction): Response | void => {
  if (process.env.NODE_ENV === 'production') {
    const proto = req.headers['x-forwarded-proto'];
    const isHttps = req.secure || proto === 'https';
    if (!isHttps) {
      return res.status(403).json({
        message: 'HTTPS is required in production.',
      });
    }
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
};

/**
 * Middleware: Adds explicit security headers to every API response.
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-store');
  next();
};
