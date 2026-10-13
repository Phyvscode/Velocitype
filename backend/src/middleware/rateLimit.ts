import { Request, Response, NextFunction } from 'express';

/**
 * Minimal in-memory rate limiter (per IP + route), to slow down password
 * guessing / OTP brute forcing / signup spam without adding a dependency.
 */
export const rateLimit = (maxRequests: number, windowMs: number) => {
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Periodically drop expired entries so the map can't grow forever
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs).unref();

  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000).toString());
      return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
    }
    return next();
  };
};
