import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export * from "./models/auth";

// Radio stations table (external streaming stations)
export const stations = pgTable("stations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  description: text("description"),
  streamUrl: text("stream_url").notNull(),
  videoStreamUrl: text("video_stream_url"),
  logoUrl: text("logo_url"),
  genre: text("genre"),
  presetNumber: integer("preset_number"),
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

// User-created radio stations (playlist-based)
export const userStations = pgTable("user_stations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  ownerId: text("owner_id"), // For future user ownership - nullable for now
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  genre: text("genre"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserStationSchema = createInsertSchema(userStations).omit({
  id: true,
  createdAt: true,
});

export const updateUserStationSchema = createInsertSchema(userStations).omit({
  id: true,
  createdAt: true,
}).partial();

export type InsertUserStation = z.infer<typeof insertUserStationSchema>;
export type UpdateUserStation = z.infer<typeof updateUserStationSchema>;
export type UserStation = typeof userStations.$inferSelect;

// Tracks for user stations
export const stationTracks = pgTable("station_tracks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  stationId: integer("station_id").notNull().references(() => userStations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  artist: text("artist"),
  duration: integer("duration"), // Duration in seconds
  mediaUrl: text("media_url").notNull(), // Object storage path
  mediaType: text("media_type").notNull(), // "audio" or "video"
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStationTrackSchema = createInsertSchema(stationTracks).omit({
  id: true,
  createdAt: true,
});

export const updateStationTrackSchema = createInsertSchema(stationTracks).omit({
  id: true,
  stationId: true,
  createdAt: true,
}).partial();

export type InsertStationTrack = z.infer<typeof insertStationTrackSchema>;
export type UpdateStationTrack = z.infer<typeof updateStationTrackSchema>;
export type StationTrack = typeof stationTracks.$inferSelect;

// Ad campaigns for banner ads
export const adCampaigns = pgTable("ad_campaigns", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  targetUrl: text("target_url").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  weight: integer("weight").default(1).notNull(), // Higher weight = more frequent display
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdCampaignSchema = createInsertSchema(adCampaigns).omit({
  id: true,
  createdAt: true,
});

export const updateAdCampaignSchema = createInsertSchema(adCampaigns).omit({
  id: true,
  createdAt: true,
}).partial();

export type InsertAdCampaign = z.infer<typeof insertAdCampaignSchema>;
export type UpdateAdCampaign = z.infer<typeof updateAdCampaignSchema>;
export type AdCampaign = typeof adCampaigns.$inferSelect;

// Playback history for recently played stations/tracks
export const playbackHistory = pgTable("playback_history", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  stationId: integer("station_id"), // External station ID (null if user station)
  userStationId: integer("user_station_id"), // User station ID (null if external)
  trackId: integer("track_id"), // Track ID if playing a specific track
  stationName: text("station_name").notNull(), // Snapshot of station name at play time
  trackTitle: text("track_title"), // Snapshot of track title if applicable
  trackArtist: text("track_artist"), // Snapshot of track artist if applicable
  logoUrl: text("logo_url"), // Snapshot of logo URL
  playedAt: timestamp("played_at").defaultNow().notNull(),
});

export const insertPlaybackHistorySchema = createInsertSchema(playbackHistory).omit({
  id: true,
  playedAt: true,
});

export type InsertPlaybackHistory = z.infer<typeof insertPlaybackHistorySchema>;
export type PlaybackHistory = typeof playbackHistory.$inferSelect;

// Platform members (email/password auth)
export const members = pgTable("members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  isPremium: boolean("is_premium").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  verificationExpires: timestamp("verification_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
  isPremium: true,
  isVerified: true,
});

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

// Admin users for panel access
export const adminUsers = pgTable("admin_users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  role: text("role").notNull().default("admin"), // "super_admin" or "admin"
  permissions: text("permissions").array().notNull().default(sql`ARRAY['stations', 'user_stations', 'tracks', 'ads']::text[]`),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
});

export const updateAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
}).partial();

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type UpdateAdminUser = z.infer<typeof updateAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

// Relations
export const stationsRelations = relations(stations, ({}) => ({}));

export const userStationsRelations = relations(userStations, ({ many }) => ({
  tracks: many(stationTracks),
}));

export const stationTracksRelations = relations(stationTracks, ({ one }) => ({
  station: one(userStations, {
    fields: [stationTracks.stationId],
    references: [userStations.id],
  }),
}));
