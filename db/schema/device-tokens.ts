import { pgTable, serial, integer, varchar, text, jsonb, boolean, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from '../../shared/schema';

export const deviceTokens = pgTable('device_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 20 }).notNull(),
  token: text('token').notNull(),
  deviceInfo: jsonb('device_info').default({}),
  isActive: boolean('is_active').default(true),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Garantir token único por usuário e plataforma
  userPlatformUnique: unique().on(table.userId, table.platform),
  // Índices para performance
  userIdIdx: index('idx_device_tokens_user_id').on(table.userId),
  platformIdx: index('idx_device_tokens_platform').on(table.platform),
  isActiveIdx: index('idx_device_tokens_is_active').on(table.isActive),
}));

// Tipos TypeScript
export type DeviceToken = typeof deviceTokens.$inferSelect;
export type InsertDeviceToken = typeof deviceTokens.$inferInsert;

// Enum para plataformas
export const DevicePlatform = {
  IOS: 'ios',
  ANDROID: 'android',
  WEB: 'web',
} as const;

export type DevicePlatformType = typeof DevicePlatform[keyof typeof DevicePlatform];