import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for admin access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Radio stations table
export const stations = pgTable("stations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  streamUrl: text("stream_url").notNull(),
  videoStreamUrl: text("video_stream_url"), // Optional video stream URL for stations with visuals
  logoUrl: text("logo_url"),
  genre: text("genre"),
  presetNumber: integer("preset_number"), // 1-5 for preset buttons, null if not preset
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const insertStationSchema = createInsertSchema(stations).omit({
  id: true,
});

export const updateStationSchema = createInsertSchema(stations).omit({
  id: true,
}).partial();

export type InsertStation = z.infer<typeof insertStationSchema>;
export type UpdateStation = z.infer<typeof updateStationSchema>;
export type Station = typeof stations.$inferSelect;

// Station relations
export const stationsRelations = relations(stations, ({ }) => ({}));
