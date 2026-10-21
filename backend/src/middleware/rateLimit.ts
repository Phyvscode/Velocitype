import { Request, Response, NextFunction } from 'express';

const MAX_BUCKETS = 10000;

/**
 * In-memory rate limiter (per IP + normalized route or namespace), to protect against
 * brute-force password/OTP guessing, signup spam, and API abuse.
 */
export const rateLimit = (maxRequests: number, windowMs: number, namespace?: string) => {
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Periodically drop expired entries so the map can't grow forever
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, Math.min(windowMs, 60000)).unref();

  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const routeKey = namespace || `${req.baseUrl}${req.path}`.replace(/\/+$/, '').toLowerCase() || '/';
    const key = `${ip}:${routeKey}`;
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      if (hits.size >= MAX_BUCKETS) {
        const oldestKey = hits.keys().next().value;
        if (oldestKey) hits.delete(oldestKey);
      }
      entry = { count: 1, resetAt: now + windowMs };
      hits.set(key, entry);
    } else {
      entry.count += 1;
    }

    const remaining = Math.max(0, maxRequests - entry.count);
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetSeconds.toString());

    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', resetSeconds.toString());
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfterSeconds: resetSeconds,
      });
    }

    return next();
  };
};
