import { 
  type User, type InsertUser, 
  type Station, type InsertStation, type UpdateStation,
  type UserStation, type InsertUserStation, type UpdateUserStation,
  type StationTrack, type InsertStationTrack, type UpdateStationTrack,
  type AdCampaign, type InsertAdCampaign, type UpdateAdCampaign,
  type PlaybackHistory, type InsertPlaybackHistory,
  type Member,
  type AdminUser, type InsertAdminUser, type UpdateAdminUser,
  users, stations, userStations, stationTracks, adCampaigns, playbackHistory, members, adminUsers
} from "@shared/schema";
import { db } from "./db";
import { eq, asc, desc, and, lte, gte, or, isNull } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllStations(): Promise<Station[]>;
  getStation(id: number): Promise<Station | undefined>;
  createStation(station: InsertStation): Promise<Station>;
  updateStation(id: number, station: UpdateStation): Promise<Station | undefined>;
  deleteStation(id: number): Promise<boolean>;

  // User stations (playlist-based)
  getAllUserStations(): Promise<UserStation[]>;
  getUserStation(id: number): Promise<UserStation | undefined>;
  createUserStation(station: InsertUserStation): Promise<UserStation>;
  updateUserStation(id: number, station: UpdateUserStation): Promise<UserStation | undefined>;
  deleteUserStation(id: number): Promise<boolean>;

  // Station tracks
  getTracksByStation(stationId: number): Promise<StationTrack[]>;
  getTrack(id: number): Promise<StationTrack | undefined>;
  createTrack(track: InsertStationTrack): Promise<StationTrack>;
  updateTrack(id: number, track: UpdateStationTrack): Promise<StationTrack | undefined>;
  deleteTrack(id: number): Promise<boolean>;

  // Ad campaigns
  getAllAdCampaigns(): Promise<AdCampaign[]>;
  getActiveAdCampaigns(): Promise<AdCampaign[]>;
  getAdCampaign(id: number): Promise<AdCampaign | undefined>;
  createAdCampaign(campaign: InsertAdCampaign): Promise<AdCampaign>;
  updateAdCampaign(id: number, campaign: UpdateAdCampaign): Promise<AdCampaign | undefined>;
  deleteAdCampaign(id: number): Promise<boolean>;

  // Playback history
  getRecentHistory(limit?: number): Promise<PlaybackHistory[]>;
  addToHistory(entry: InsertPlaybackHistory): Promise<PlaybackHistory>;
  clearHistory(): Promise<void>;

  // Members
  getMember(id: number): Promise<Member | undefined>;
  getMemberByEmail(email: string): Promise<Member | undefined>;
  createMember(data: { email: string; passwordHash: string; displayName?: string; verificationToken?: string; verificationExpires?: Date }): Promise<Member>;
  verifyMember(token: string): Promise<Member | undefined>;
  autoVerifyMember(id: number): Promise<void>;

  // Admin users
  getAdminUserByEmail(email: string): Promise<AdminUser | undefined>;
  getAdminUser(id: number): Promise<AdminUser | undefined>;
  getAllAdminUsers(): Promise<AdminUser[]>;
  createAdminUser(data: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: number, data: UpdateAdminUser): Promise<AdminUser | undefined>;
  deleteAdminUser(id: number): Promise<boolean>;
  updateAdminLastLogin(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllStations(): Promise<Station[]> {
    return db.select().from(stations).orderBy(asc(stations.sortOrder));
  }

  async getStation(id: number): Promise<Station | undefined> {
    const [station] = await db.select().from(stations).where(eq(stations.id, id));
    return station || undefined;
  }

  async createStation(station: InsertStation): Promise<Station> {
    const [created] = await db.insert(stations).values(station).returning();
    return created;
  }

  async updateStation(id: number, stationUpdate: UpdateStation): Promise<Station | undefined> {
    const [updated] = await db
      .update(stations)
      .set(stationUpdate)
      .where(eq(stations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteStation(id: number): Promise<boolean> {
    const result = await db.delete(stations).where(eq(stations.id, id)).returning();
    return result.length > 0;
  }

  // User stations (playlist-based)
  async getAllUserStations(): Promise<UserStation[]> {
    return db.select().from(userStations).orderBy(asc(userStations.sortOrder));
  }

  async getUserStation(id: number): Promise<UserStation | undefined> {
    const [station] = await db.select().from(userStations).where(eq(userStations.id, id));
    return station || undefined;
  }

  async createUserStation(station: InsertUserStation): Promise<UserStation> {
    const [created] = await db.insert(userStations).values(station).returning();
    return created;
  }

  async updateUserStation(id: number, stationUpdate: UpdateUserStation): Promise<UserStation | undefined> {
    const [updated] = await db
      .update(userStations)
      .set(stationUpdate)
      .where(eq(userStations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteUserStation(id: number): Promise<boolean> {
    const result = await db.delete(userStations).where(eq(userStations.id, id)).returning();
    return result.length > 0;
  }

  // Station tracks
  async getTracksByStation(stationId: number): Promise<StationTrack[]> {
    return db.select().from(stationTracks)
      .where(eq(stationTracks.stationId, stationId))
      .orderBy(asc(stationTracks.sortOrder));
  }

  async getTrack(id: number): Promise<StationTrack | undefined> {
    const [track] = await db.select().from(stationTracks).where(eq(stationTracks.id, id));
    return track || undefined;
  }

  async createTrack(track: InsertStationTrack): Promise<StationTrack> {
    const [created] = await db.insert(stationTracks).values(track).returning();
    return created;
  }

  async updateTrack(id: number, trackUpdate: UpdateStationTrack): Promise<StationTrack | undefined> {
    const [updated] = await db
      .update(stationTracks)
      .set(trackUpdate)
      .where(eq(stationTracks.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTrack(id: number): Promise<boolean> {
    const result = await db.delete(stationTracks).where(eq(stationTracks.id, id)).returning();
    return result.length > 0;
  }

  // Ad campaigns
  async getAllAdCampaigns(): Promise<AdCampaign[]> {
    return db.select().from(adCampaigns).orderBy(asc(adCampaigns.createdAt));
  }

  async getActiveAdCampaigns(): Promise<AdCampaign[]> {
    const now = new Date();
    return db.select().from(adCampaigns)
      .where(and(
        eq(adCampaigns.isActive, true),
        or(isNull(adCampaigns.startDate), lte(adCampaigns.startDate, now)),
        or(isNull(adCampaigns.endDate), gte(adCampaigns.endDate, now))
      ));
  }

  async getAdCampaign(id: number): Promise<AdCampaign | undefined> {
    const [campaign] = await db.select().from(adCampaigns).where(eq(adCampaigns.id, id));
    return campaign || undefined;
  }

  async createAdCampaign(campaign: InsertAdCampaign): Promise<AdCampaign> {
    const [created] = await db.insert(adCampaigns).values(campaign).returning();
    return created;
  }

  async updateAdCampaign(id: number, campaignUpdate: UpdateAdCampaign): Promise<AdCampaign | undefined> {
    const [updated] = await db
      .update(adCampaigns)
      .set(campaignUpdate)
      .where(eq(adCampaigns.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAdCampaign(id: number): Promise<boolean> {
    const result = await db.delete(adCampaigns).where(eq(adCampaigns.id, id)).returning();
    return result.length > 0;
  }

  // Playback history
  async getRecentHistory(limit: number = 20): Promise<PlaybackHistory[]> {
    return db.select().from(playbackHistory)
      .orderBy(desc(playbackHistory.playedAt))
      .limit(limit);
  }

  async addToHistory(entry: InsertPlaybackHistory): Promise<PlaybackHistory> {
    const [created] = await db.insert(playbackHistory).values(entry).returning();
    return created;
  }

  async clearHistory(): Promise<void> {
    await db.delete(playbackHistory);
  }

  // Members
  async getMember(id: number): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async getMemberByEmail(email: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.email, email));
    return member || undefined;
  }

  async createMember(data: { email: string; passwordHash: string; displayName?: string; verificationToken?: string; verificationExpires?: Date }): Promise<Member> {
    const [created] = await db.insert(members).values(data).returning();
    return created;
  }

  async verifyMember(token: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.verificationToken, token));
    if (!member || !member.verificationExpires || member.verificationExpires < new Date()) {
      return undefined;
    }
    const [updated] = await db.update(members)
      .set({ isVerified: true, verificationToken: null })
      .where(eq(members.id, member.id))
      .returning();
    return updated;
  }

  async autoVerifyMember(id: number): Promise<void> {
    await db.update(members)
      .set({ isVerified: true })
      .where(eq(members.id, id));
  }

  // Admin users
  async getAdminUserByEmail(email: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return admin || undefined;
  }

  async getAdminUser(id: number): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return admin || undefined;
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    return db.select().from(adminUsers).orderBy(asc(adminUsers.createdAt));
  }

  async createAdminUser(data: InsertAdminUser): Promise<AdminUser> {
    const [created] = await db.insert(adminUsers).values(data).returning();
    return created;
  }

  async updateAdminUser(id: number, data: UpdateAdminUser): Promise<AdminUser | undefined> {
    const [updated] = await db
      .update(adminUsers)
      .set(data)
      .where(eq(adminUsers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAdminUser(id: number): Promise<boolean> {
    const result = await db.delete(adminUsers).where(eq(adminUsers.id, id)).returning();
    return result.length > 0;
  }

  async updateAdminLastLogin(id: number): Promise<void> {
    await db.update(adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminUsers.id, id));
  }
}

export const storage = new DatabaseStorage();
