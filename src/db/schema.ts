import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  totalMasteryPoints: integer('total_mastery_points').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const gameRuns = sqliteTable('game_runs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  gameKey: text('game_key').notNull(),
  score: integer('score').notNull(),
  totalToGuess: integer('total_to_guess').notNull(),
  masteryPoints: integer('mastery_points').notNull(),
  difficulty: text('difficulty').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export type UserRow = typeof users.$inferSelect;
export type GameRunRow = typeof gameRuns.$inferSelect;
