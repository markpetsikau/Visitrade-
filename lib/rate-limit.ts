// ─────────────────────────────────────────────────────────────
// Simple in-memory rate limiter (per server instance).
// Garde-fou pour protéger les endpoints coûteux (IA). Pour une
// production multi-instances, brancher un store partagé (Upstash
// Redis) — l'interface reste la même.
// ─────────────────────────────────────────────────────────────

interface Bucket {
  count: number;
  reset: number;
}
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((b.reset - now) / 1000) };
  }
  b.count++;
  return { ok: true, remaining: limit - b.count, retryAfter: 0 };
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "anon";
}

// Occasionally evict stale buckets to bound memory.
export function sweep() {
  const now = Date.now();
  buckets.forEach((b, k) => {
    if (now > b.reset) buckets.delete(k);
  });
}
