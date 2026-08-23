import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { games } from '@/config/gamesList';
import { gameRuns, users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { db, ensureSchema } from '@/lib/db';

// gameKey -> max legitimate item count for that quiz. Every client sets
// `totalToGuess` to the length of its filtered region/country list at game
// start, and it never grows mid-game — so this is a hard ceiling, not an
// estimate. Daily Challenge isn't in the games list (it's a fixed-size daily
// pick), so it's added separately.
const MAX_ITEMS_BY_GAME_KEY: Record<string, number> = Object.fromEntries(games.map((g) => [g.id, g.count]));
MAX_ITEMS_BY_GAME_KEY['daily-challenge'] = 15;

// masteryPoints = round(score * multiplier * 10); multiplier is the product
// of the input/mode/settings bonuses in gameConstants.ts and tops out at
// input(1.5) * mode(1.5) * strictMatching(1.2) * noMapHints(1.5) *
// hideBorders(1.25) ≈ 5.06 — so 51 pts/correct answer is a hard, generous
// ceiling that only fabricated payloads can exceed.
const MAX_POINTS_PER_CORRECT_ANSWER = 51;

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

  const maxItems = MAX_ITEMS_BY_GAME_KEY[gameKey];
  const isValidPayload =
    maxItems !== undefined &&
    Number.isInteger(score) && Number.isInteger(totalToGuess) && Number.isInteger(masteryPoints) &&
    score >= 0 && totalToGuess > 0 && totalToGuess <= maxItems &&
    score <= totalToGuess &&
    masteryPoints >= 0 && masteryPoints <= score * MAX_POINTS_PER_CORRECT_ANSWER;

  if (!isValidPayload) {
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
