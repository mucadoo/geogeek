import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { gameRuns, users } from '@/db/schema';
import { clearSessionCookie, createSessionCookie, getSession } from '@/lib/auth';
import { getCurrentUser } from '@/lib/currentUser';
import { db, ensureSchema } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const runs = await db
    .select()
    .from(gameRuns)
    .where(eq(gameRuns.userId, user.id))
    .orderBy(desc(gameRuns.createdAt))
    .limit(20);

  // Normalize to unix seconds (matches the raw-SQL leaderboard endpoint)
  // instead of letting Drizzle's Date objects serialize to ISO strings.
  const serializedRuns = runs.map((run) => ({
    ...run,
    createdAt: Math.floor(run.createdAt.getTime() / 1000),
  }));

  return NextResponse.json({ user, runs: serializedRuns });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  if (username.length < 3 || username.length > 24 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json({ error: 'Username must be 3-24 characters (letters, numbers, underscore only).' }, { status: 400 });
  }

  await ensureSchema();

  const clash = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).get();
  if (clash && clash.id !== session.sub) {
    return NextResponse.json({ error: 'Username already taken.' }, { status: 409 });
  }

  const [updated] = await db.update(users).set({ username }).where(eq(users.id, session.sub)).returning();
  await createSessionCookie({ sub: updated.id, username: updated.username });

  return NextResponse.json({
    user: { id: updated.id, username: updated.username, totalMasteryPoints: updated.totalMasteryPoints },
  });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  await ensureSchema();
  // Delete explicitly rather than relying on the ON DELETE CASCADE FK,
  // since SQLite/libSQL only enforces foreign keys when PRAGMA foreign_keys
  // is turned on for the connection.
  await db.delete(gameRuns).where(eq(gameRuns.userId, session.sub));
  await db.delete(users).where(eq(users.id, session.sub));
  await clearSessionCookie();

  return NextResponse.json({ success: true });
}
