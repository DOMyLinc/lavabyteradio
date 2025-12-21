import { 
  type User, type InsertUser, 
  type Station, type InsertStation, type UpdateStation,
  users, stations 
} from "@shared/schema";
import { db } from "./db";
import { eq, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllStations(): Promise<Station[]>;
  getStation(id: number): Promise<Station | undefined>;
  createStation(station: InsertStation): Promise<Station>;
  updateStation(id: number, station: UpdateStation): Promise<Station | undefined>;
  deleteStation(id: number): Promise<boolean>;
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
}

export const storage = new DatabaseStorage();
