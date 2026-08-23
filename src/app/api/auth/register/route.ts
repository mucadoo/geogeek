import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { users } from '@/db/schema';
import { createSessionCookie, hashPassword } from '@/lib/auth';
import { db, ensureSchema } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = checkRateLimit(`register:${getClientIp(request)}`, 5, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (username.length < 3 || username.length > 24 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json({ error: 'Username must be 3-24 characters (letters, numbers, underscore only).' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  await ensureSchema();

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).get();
  if (existing) {
    return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const [created] = await db.insert(users).values({ username, passwordHash }).returning();

  await createSessionCookie({ sub: created.id, username: created.username });

  return NextResponse.json({
    user: { id: created.id, username: created.username, totalMasteryPoints: created.totalMasteryPoints },
  });
}
