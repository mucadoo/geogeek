import { eq } from 'drizzle-orm';

import { users } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { db, ensureSchema } from '@/lib/db';

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  await ensureSchema();
  const user = await db.select().from(users).where(eq(users.id, session.sub)).get();
  if (!user) return null;

  return { id: user.id, username: user.username, totalMasteryPoints: user.totalMasteryPoints };
}
