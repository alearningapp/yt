import { pgTable, text, timestamp, integer, uuid, boolean } from 'drizzle-orm/pg-core';

// MUST be named 'user' (singular)
export const user = pgTable('user', {
  id: text('id').primaryKey(), // BetterAuth expects text ID, not UUID
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  emailVerified: boolean('emailVerified').default(false), // boolean, not timestamp
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  // BetterAuth may also expect these fields:
  password: text('password'),
  role: text('role').default('user'),
});

// MUST be named 'account' (singular)
export const account = pgTable('account', {
  id: text('id').primaryKey(), // text ID
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }), // text reference
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refreshToken: text('refreshToken'),
  accessToken: text('accessToken'),
  expiresAt: integer('expiresAt'),
  tokenType: text('tokenType'),
  scope: text('scope'),
  idToken: text('idToken'),
  sessionState: text('sessionState'),
});

// MUST be named 'session' (singular)
export const session = pgTable('session', {
  id: text('id').primaryKey(), // text ID
  sessionToken: text('sessionToken').notNull().unique(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }), // text reference
  expires: timestamp('expires').notNull(),
});

export const verificationToken = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
});

// Your custom tables can remain as-is
export const channels = pgTable('channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelLink: text('channel_link').notNull(),
  channelName: text('channel_name').notNull(),
  description: text('description').notNull(),
  subscriptionCount: integer('subscription_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }), // Change to text reference
});

export const channelClicks = pgTable('channel_clicks', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }), // Change to text reference
  clickedAt: timestamp('clicked_at').defaultNow().notNull(),
});

export type User = typeof user.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type ChannelClick = typeof channelClicks.$inferSelect;