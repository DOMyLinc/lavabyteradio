import { db } from "./db";
import { stations, adminUsers } from "@shared/schema";
import { sql } from "drizzle-orm";

const testStations = [
  {
    name: "Lava Hits FM",
    description: "The hottest hits from around the world, streaming 24/7",
    streamUrl: "https://stream.zeno.fm/s1zfx0byp8zuv",
    logoUrl: "",
    genre: "Pop",
    presetNumber: 1,
    isActive: true,
    sortOrder: 0,
  },
  {
    name: "Volcanic Rock",
    description: "Classic and modern rock to fuel your fire",
    streamUrl: "https://stream.zeno.fm/nnex0gh6d18uv",
    logoUrl: "",
    genre: "Rock",
    presetNumber: 2,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: "Molten Jazz",
    description: "Smooth jazz vibes to melt your stress away",
    streamUrl: "https://stream.zeno.fm/tphneh1y7w8uv",
    logoUrl: "",
    genre: "Jazz",
    presetNumber: 3,
    isActive: true,
    sortOrder: 2,
  },
  {
    name: "Lava Lounge",
    description: "Chill electronic beats for relaxation",
    streamUrl: "https://stream.zeno.fm/4d612hmg9r8uv",
    logoUrl: "",
    genre: "Electronic",
    presetNumber: 4,
    isActive: true,
    sortOrder: 3,
  },
  {
    name: "Magma Classics",
    description: "Timeless classical compositions for the soul",
    streamUrl: "https://stream.zeno.fm/xfvcfh0gkzzuv",
    logoUrl: "",
    genre: "Classical",
    presetNumber: 5,
    isActive: true,
    sortOrder: 4,
  },
];

export async function seedStations() {
  try {
    const existingStations = await db.select().from(stations);
    
    if (existingStations.length === 0) {
      console.log("Seeding test stations...");
      await db.insert(stations).values(testStations);
      console.log("Seeded 5 test stations successfully!");
    } else {
      console.log(`Database already has ${existingStations.length} stations. Skipping seed.`);
    }
  } catch (error) {
    console.error("Failed to seed stations:", error);
    throw error;
  }
}

export async function seedAdminUser() {
  try {
    const existingAdmins = await db.select().from(adminUsers);
    
    if (existingAdmins.length === 0) {
      console.log("Seeding initial super admin user...");
      // Password: CallOfDutyo7 (base64 encoded)
      const passwordHash = Buffer.from("CallOfDutyo7").toString("base64");
      await db.insert(adminUsers).values({
        email: "radray@gmail.com",
        passwordHash,
        displayName: "RadRay",
        role: "super_admin",
        permissions: ["stations", "user_stations", "tracks", "ads", "admin_users"],
        isActive: true,
      });
      console.log("Seeded super admin user successfully!");
    } else {
      console.log(`Database already has ${existingAdmins.length} admin users. Skipping seed.`);
    }
  } catch (error) {
    console.error("Failed to seed admin user:", error);
    throw error;
  }
}
