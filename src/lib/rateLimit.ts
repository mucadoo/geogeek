import 'server-only';

// In-memory fixed-window rate limiter. Good enough to blunt naive
// password-guessing/spam scripts on a single-instance deployment; it does
// NOT coordinate across multiple serverless instances. If this app ever
// scales to multi-instance hosting, swap this for a shared store (e.g.
// Upstash Redis) — the call sites below don't need to change.
const hits = new Map<string, { count: number; resetAt: number }>();

// Bound memory: forget entries once they'd have expired anyway.
function sweep(now: number) {
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }
}

let lastSweep = 0;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/** `key` should already include the route/action, e.g. `login:203.0.113.4`. */
export function checkRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    sweep(now);
    lastSweep = now;
  }

  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Best-effort client IP from standard proxy headers (Vercel/most hosts set x-forwarded-for). */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
