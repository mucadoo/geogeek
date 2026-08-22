import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db, ensureSchema } from '@/lib/db';

interface LeaderboardRow {
  username: string;
  masteryPoints: number;
  score: number;
  totalToGuess: number;
  difficulty: string;
  createdAt: number;
}

export async function GET(request: Request, { params }: { params: Promise<{ gameKey: string }> }) {
  const { gameKey } = await params;

  await ensureSchema();

  // Best run per user for this game, joined to the run's own score/difficulty/date.
  const rows = await db.all<LeaderboardRow>(sql`
    SELECT u.username as username,
           best.masteryPoints as masteryPoints,
           gr.score as score,
           gr.total_to_guess as totalToGuess,
           gr.difficulty as difficulty,
           gr.created_at as createdAt
    FROM (
      SELECT user_id, MAX(mastery_points) as masteryPoints
      FROM game_runs
      WHERE game_key = ${gameKey}
      GROUP BY user_id
    ) best
    JOIN game_runs gr ON gr.user_id = best.user_id AND gr.mastery_points = best.masteryPoints AND gr.game_key = ${gameKey}
    JOIN users u ON u.id = best.user_id
    GROUP BY best.user_id
    ORDER BY best.masteryPoints DESC
    LIMIT 50
  `);

  return NextResponse.json({ gameKey, entries: rows });
}
