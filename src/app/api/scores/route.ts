import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { gameRuns, users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { db, ensureSchema } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const gameKey = typeof body?.gameKey === 'string' ? body.gameKey : '';
  const score = Number(body?.score);
  const totalToGuess = Number(body?.totalToGuess);
  const masteryPoints = Number(body?.masteryPoints);
  const difficulty = typeof body?.difficulty === 'string' ? body.difficulty : 'medium';

  if (!gameKey || !Number.isFinite(score) || !Number.isFinite(totalToGuess) || !Number.isFinite(masteryPoints) || masteryPoints < 0) {
    return NextResponse.json({ error: 'Invalid score payload.' }, { status: 400 });
  }

  await ensureSchema();

  await db.insert(gameRuns).values({
    userId: session.sub,
    gameKey,
    score,
    totalToGuess,
    masteryPoints,
    difficulty,
  });

  const [updated] = await db
    .update(users)
    .set({ totalMasteryPoints: sql`${users.totalMasteryPoints} + ${masteryPoints}` })
    .where(eq(users.id, session.sub))
    .returning();

  return NextResponse.json({
    user: updated ? { id: updated.id, username: updated.username, totalMasteryPoints: updated.totalMasteryPoints } : null,
  });
}
