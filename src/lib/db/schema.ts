import { pgTable, text, timestamp, integer, uuid, boolean, jsonb } from 'drizzle-orm/pg-core';

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verificationToken = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
});

// Your custom tables can remain as-is
export const channels = pgTable('channel', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelLink: text('channel_link').unique().notNull(),
  channelName: text('channel_name').notNull(),
  channelAlias: text('channel_alias').unique().notNull(),
  vid: text('vid').notNull(),
  description: text('description').notNull(),
  subscriptionCount: integer('subscription_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }), // Change to text reference
});

export const channelClicks = pgTable('channel_click', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }), // Change to text reference
  clickedAt: timestamp('clicked_at').defaultNow().notNull(),
});

export const youtubeChannelCache = pgTable('youtube_channel_cache', {
  videoId: text('video_id').primaryKey(),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const channelHistory = pgTable('channel_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  period: text('period').notNull(), // 'weekly' or 'monthly'
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  subscriptionCount: integer('subscription_count').notNull(),
  clickCount: integer('click_count').notNull(),
  subscriptionGrowth: integer('subscription_growth').notNull(), // Change from previous period
  clickGrowth: integer('click_growth').notNull(), // Change from previous period
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof user.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type ChannelClick = typeof channelClicks.$inferSelect;
export type ChannelHistory = typeof channelHistory.$inferSelect;