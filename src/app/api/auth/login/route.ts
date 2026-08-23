import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { users } from '@/db/schema';
import { createSessionCookie, verifyPassword } from '@/lib/auth';
import { db, ensureSchema } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const { allowed, retryAfterSeconds } = checkRateLimit(`login:${getClientIp(request)}`, 10, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
  }

  await ensureSchema();

  const user = await db.select().from(users).where(eq(users.username, username)).get();
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
  }

  await createSessionCookie({ sub: user.id, username: user.username });

  return NextResponse.json({
    user: { id: user.id, username: user.username, totalMasteryPoints: user.totalMasteryPoints },
  });
}
