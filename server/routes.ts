import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated } from "./replit_integrations/auth";
import { 
  insertStationSchema, updateStationSchema,
  insertUserStationSchema, updateUserStationSchema,
  insertStationTrackSchema, updateStationTrackSchema,
  insertAdCampaignSchema, updateAdCampaignSchema,
  insertPlaybackHistorySchema,
  insertAdminUserSchema, updateAdminUserSchema,
  type AdminUser
} from "@shared/schema";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    adminId?: number;
    memberId?: number;
  }
}

function isAdminAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.adminId) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  next();
}

function isMemberAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.memberId) {
    return res.status(401).json({ error: "Member authentication required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get all stations
  app.get("/api/stations", async (req, res) => {
    try {
      const stations = await storage.getAllStations();
      res.json(stations);
    } catch (error) {
      console.error("Failed to fetch stations:", error);
      res.status(500).json({ error: "Failed to fetch stations" });
    }
  });

  // Get single station
  app.get("/api/stations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid station ID" });
      }
      
      const station = await storage.getStation(id);
      if (!station) {
        return res.status(404).json({ error: "Station not found" });
      }
      res.json(station);
    } catch (error) {
      console.error("Failed to fetch station:", error);
      res.status(500).json({ error: "Failed to fetch station" });
    }
  });

  // Create station (protected - admin only)
  app.post("/api/stations", isAdminAuthenticated, async (req, res) => {
    try {
      const parsed = insertStationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid station data", details: parsed.error.errors });
      }
      
      const station = await storage.createStation(parsed.data);
      res.status(201).json(station);
    } catch (error) {
      console.error("Failed to create station:", error);
      res.status(500).json({ error: "Failed to create station" });
    }
  });

  // Update station (protected - admin only)
  app.patch("/api/stations/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid station ID" });
      }
      
      const parsed = updateStationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid station data", details: parsed.error.errors });
      }
      
      const station = await storage.updateStation(id, parsed.data);
      if (!station) {
        return res.status(404).json({ error: "Station not found" });
      }
      res.json(station);
    } catch (error) {
      console.error("Failed to update station:", error);
      res.status(500).json({ error: "Failed to update station" });
    }
  });

  // Delete station (protected - admin only)
  app.delete("/api/stations/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid station ID" });
      }
      
      const deleted = await storage.deleteStation(id);
      if (!deleted) {
        return res.status(404).json({ error: "Station not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete station:", error);
      res.status(500).json({ error: "Failed to delete station" });
    }
  });

  // =====================
  // USER STATIONS ROUTES
  // =====================

  // Get all user stations
  app.get("/api/user-stations", async (req, res) => {
    try {
      const stations = await storage.getAllUserStations();
      res.json(stations);
    } catch (error) {
      console.error("Failed to fetch user stations:", error);
      res.status(500).json({ error: "Failed to fetch user stations" });
    }
  });

  // Get approved user stations (for admin to select when creating external stations)
  app.get("/api/admin/approved-user-stations", isAdminAuthenticated, async (req, res) => {
    try {
      const stations = await storage.getPublicUserStations();
      res.json(stations);
    } catch (error) {
      console.error("Failed to fetch approved user stations:", error);
      res.status(500).json({ error: "Failed to fetch approved user stations" });
    }
  });

  // Get single user station
  app.get("/api/user-stations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid station ID" });
      }
      
      const station = await storage.getUserStation(id);
      if (!station) {
        return res.status(404).json({ error: "User station not found" });
      }
      res.json(station);
    } catch (error) {
      console.error("Failed to fetch user station:", error);
      res.status(500).json({ error: "Failed to fetch user station" });
    }
  });

  // Create user station (protected - admin only)
  app.post("/api/user-stations", isAdminAuthenticated, async (req, res) => {
    try {
      const parsed = insertUserStationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid station data", details: parsed.error.errors });
      }
      
      const station = await storage.createUserStation(parsed.data);
      res.status(201).json(station);
    } catch (error) {
      console.error("Failed to create user station:", error);
      res.status(500).json({ error: "Failed to create user station" });
    }
  });

  // Update user station (protected - admin only)
  app.patch("/api/user-stations/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid station ID" });
      }
      
      const parsed = updateUserStationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid station data", details: parsed.error.errors });
      }
      
      const station = await storage.updateUserStation(id, parsed.data);
      if (!station) {
        return res.status(404).json({ error: "User station not found" });
      }
      res.json(station);
    } catch (error) {
      console.error("Failed to update user station:", error);
      res.status(500).json({ error: "Failed to update user station" });
    }
  });

  // Delete user station (protected - admin only)
  app.delete("/api/user-stations/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid station ID" });
      }
      
      const deleted = await storage.deleteUserStation(id);
      if (!deleted) {
        return res.status(404).json({ error: "User station not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete user station:", error);
      res.status(500).json({ error: "Failed to delete user station" });
    }
  });

  // =====================
  // STATION TRACKS ROUTES
  // =====================

  // Get tracks for a station
  app.get("/api/user-stations/:stationId/tracks", async (req, res) => {
    try {
      const stationId = parseInt(req.params.stationId);
      if (isNaN(stationId)) {
        return res.status(400).json({ error: "Invalid station ID" });
      }
      
      const tracks = await storage.getTracksByStation(stationId);
      res.json(tracks);
    } catch (error) {
      console.error("Failed to fetch tracks:", error);
      res.status(500).json({ error: "Failed to fetch tracks" });
    }
  });

  // Get single track
  app.get("/api/tracks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid track ID" });
      }
      
      const track = await storage.getTrack(id);
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }
      res.json(track);
    } catch (error) {
      console.error("Failed to fetch track:", error);
      res.status(500).json({ error: "Failed to fetch track" });
    }
  });

  // Create track for a station (protected - admin only)
  app.post("/api/user-stations/:stationId/tracks", isAdminAuthenticated, async (req, res) => {
    try {
      const stationId = parseInt(req.params.stationId);
      if (isNaN(stationId)) {
        return res.status(400).json({ error: "Invalid station ID" });
      }

      // Verify station exists
      const station = await storage.getUserStation(stationId);
      if (!station) {
        return res.status(404).json({ error: "User station not found" });
      }
      
      const parsed = insertStationTrackSchema.safeParse({ ...req.body, stationId });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid track data", details: parsed.error.errors });
      }
      
      const track = await storage.createTrack(parsed.data);
      res.status(201).json(track);
    } catch (error) {
      console.error("Failed to create track:", error);
      res.status(500).json({ error: "Failed to create track" });
    }
  });

  // Update track (protected - admin only)
  app.patch("/api/tracks/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid track ID" });
      }
      
      const parsed = updateStationTrackSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid track data", details: parsed.error.errors });
      }
      
      const track = await storage.updateTrack(id, parsed.data);
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }
      res.json(track);
    } catch (error) {
      console.error("Failed to update track:", error);
      res.status(500).json({ error: "Failed to update track" });
    }
  });

  // Delete track (protected - admin only)
  app.delete("/api/tracks/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid track ID" });
      }
      
      const deleted = await storage.deleteTrack(id);
      if (!deleted) {
        return res.status(404).json({ error: "Track not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete track:", error);
      res.status(500).json({ error: "Failed to delete track" });
    }
  });

  // =====================
  // AD CAMPAIGNS ROUTES
  // =====================

  // Get all ad campaigns
  app.get("/api/ad-campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getAllAdCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Failed to fetch ad campaigns:", error);
      res.status(500).json({ error: "Failed to fetch ad campaigns" });
    }
  });

  // Get active ad campaigns (for display)
  app.get("/api/ad-campaigns/active", async (req, res) => {
    try {
      const campaigns = await storage.getActiveAdCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Failed to fetch active ad campaigns:", error);
      res.status(500).json({ error: "Failed to fetch active ad campaigns" });
    }
  });

  // Get single ad campaign
  app.get("/api/ad-campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }
      
      const campaign = await storage.getAdCampaign(id);
      if (!campaign) {
        return res.status(404).json({ error: "Ad campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Failed to fetch ad campaign:", error);
      res.status(500).json({ error: "Failed to fetch ad campaign" });
    }
  });

  // Create ad campaign (protected - admin only)
  app.post("/api/ad-campaigns", isAdminAuthenticated, async (req, res) => {
    try {
      const parsed = insertAdCampaignSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid campaign data", details: parsed.error.errors });
      }
      
      const campaign = await storage.createAdCampaign(parsed.data);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Failed to create ad campaign:", error);
      res.status(500).json({ error: "Failed to create ad campaign" });
    }
  });

  // Update ad campaign (protected - admin only)
  app.patch("/api/ad-campaigns/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }
      
      const parsed = updateAdCampaignSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid campaign data", details: parsed.error.errors });
      }
      
      const campaign = await storage.updateAdCampaign(id, parsed.data);
      if (!campaign) {
        return res.status(404).json({ error: "Ad campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Failed to update ad campaign:", error);
      res.status(500).json({ error: "Failed to update ad campaign" });
    }
  });

  // Delete ad campaign (protected - admin only)
  app.delete("/api/ad-campaigns/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid campaign ID" });
      }
      
      const deleted = await storage.deleteAdCampaign(id);
      if (!deleted) {
        return res.status(404).json({ error: "Ad campaign not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete ad campaign:", error);
      res.status(500).json({ error: "Failed to delete ad campaign" });
    }
  });

  // =====================
  // PLAYBACK HISTORY ROUTES
  // =====================

  // Get recent playback history
  app.get("/api/history", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const history = await storage.getRecentHistory(limit);
      res.json(history);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      res.status(500).json({ error: "Failed to fetch playback history" });
    }
  });

  // Add to playback history
  app.post("/api/history", async (req, res) => {
    try {
      const parsed = insertPlaybackHistorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid history data", details: parsed.error.errors });
      }
      
      const entry = await storage.addToHistory(parsed.data);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Failed to add to history:", error);
      res.status(500).json({ error: "Failed to add to playback history" });
    }
  });

  // Clear playback history
  app.delete("/api/history", async (req, res) => {
    try {
      await storage.clearHistory();
      res.status(204).send();
    } catch (error) {
      console.error("Failed to clear history:", error);
      res.status(500).json({ error: "Failed to clear playback history" });
    }
  });

  // =====================
  // MEMBER AUTH ROUTES
  // =====================

  // Register new member (auto-verified for now)
  app.post("/api/members/register", async (req, res) => {
    try {
      const { email, password, displayName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      // Check if email already exists
      const existing = await storage.getMemberByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Simple password hash (for testing - use bcrypt in production)
      const passwordHash = Buffer.from(password).toString("base64");

      const member = await storage.createMember({
        email,
        passwordHash,
        displayName: displayName || email.split("@")[0],
      });
      
      // Auto-verify the member immediately
      await storage.autoVerifyMember(member.id);

      // Create session immediately after registration
      req.session.memberId = member.id;

      res.status(201).json({ 
        message: "Account created successfully!",
        member: {
          id: member.id,
          email: member.email,
          displayName: member.displayName,
          isPremium: member.isPremium,
          isVerified: true
        }
      });
    } catch (error) {
      console.error("Failed to register member:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // Login member
  app.post("/api/members/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const member = await storage.getMemberByEmail(email);
      if (!member) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Simple password check (for testing)
      const passwordHash = Buffer.from(password).toString("base64");
      if (member.passwordHash !== passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Create session
      req.session.memberId = member.id;

      res.json({ 
        message: "Login successful",
        member: {
          id: member.id,
          email: member.email,
          displayName: member.displayName,
          role: member.role,
          isPremium: member.isPremium,
          isVerified: member.isVerified
        }
      });
    } catch (error) {
      console.error("Failed to login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get current member session
  app.get("/api/members/me", async (req, res) => {
    try {
      if (!req.session?.memberId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const member = await storage.getMember(req.session.memberId);
      if (!member) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: "Session invalid" });
      }

      res.json({
        id: member.id,
        email: member.email,
        displayName: member.displayName,
        role: member.role,
        isPremium: member.isPremium,
        isVerified: member.isVerified
      });
    } catch (error) {
      console.error("Failed to get member session:", error);
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // Logout member
  app.post("/api/members/logout", (req, res) => {
    req.session.destroy(() => {});
    res.json({ message: "Logged out successfully" });
  });

  // Verify email
  app.get("/api/members/verify", async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Invalid verification token" });
      }

      const member = await storage.verifyMember(token);
      if (!member) {
        return res.status(400).json({ error: "Invalid or expired verification token" });
      }

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Failed to verify email:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // =====================
  // ADMIN AUTH ROUTES
  // =====================

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const admin = await storage.getAdminUserByEmail(email);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const passwordHash = Buffer.from(password).toString("base64");
      if (admin.passwordHash !== passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      req.session.adminId = admin.id;
      await storage.updateAdminLastLogin(admin.id);

      res.json({ 
        id: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
        permissions: admin.permissions
      });
    } catch (error) {
      console.error("Admin login failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current admin session
  app.get("/api/admin/me", async (req, res) => {
    try {
      if (!req.session?.adminId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const admin = await storage.getAdminUser(req.session.adminId);
      if (!admin || !admin.isActive) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: "Session invalid" });
      }

      res.json({ 
        id: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
        permissions: admin.permissions
      });
    } catch (error) {
      console.error("Failed to get admin session:", error);
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // =====================
  // ADMIN USERS MANAGEMENT (super_admin only)
  // =====================

  // Get all admin users
  app.get("/api/admin/users", isAdminAuthenticated, async (req, res) => {
    try {
      const currentAdmin = await storage.getAdminUser(req.session.adminId!);
      if (!currentAdmin || currentAdmin.role !== "super_admin") {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const admins = await storage.getAllAdminUsers();
      res.json(admins.map(a => ({
        id: a.id,
        email: a.email,
        displayName: a.displayName,
        role: a.role,
        permissions: a.permissions,
        isActive: a.isActive,
        createdAt: a.createdAt,
        lastLoginAt: a.lastLoginAt
      })));
    } catch (error) {
      console.error("Failed to get admin users:", error);
      res.status(500).json({ error: "Failed to get admin users" });
    }
  });

  // Create admin user
  app.post("/api/admin/users", isAdminAuthenticated, async (req, res) => {
    try {
      const currentAdmin = await storage.getAdminUser(req.session.adminId!);
      if (!currentAdmin || currentAdmin.role !== "super_admin") {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const { email, password, displayName, role, permissions } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const existing = await storage.getAdminUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const passwordHash = Buffer.from(password).toString("base64");
      const admin = await storage.createAdminUser({
        email,
        passwordHash,
        displayName: displayName || email.split("@")[0],
        role: role || "admin",
        permissions: permissions || ["stations", "user_stations", "tracks", "ads"],
        isActive: true
      });

      res.status(201).json({
        id: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
        permissions: admin.permissions
      });
    } catch (error) {
      console.error("Failed to create admin user:", error);
      res.status(500).json({ error: "Failed to create admin user" });
    }
  });

  // Update admin user
  app.patch("/api/admin/users/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const currentAdmin = await storage.getAdminUser(req.session.adminId!);
      if (!currentAdmin || currentAdmin.role !== "super_admin") {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const { password, ...updateData } = req.body;
      if (password) {
        (updateData as any).passwordHash = Buffer.from(password).toString("base64");
      }

      const admin = await storage.updateAdminUser(id, updateData);
      if (!admin) {
        return res.status(404).json({ error: "Admin user not found" });
      }

      res.json({
        id: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
        permissions: admin.permissions,
        isActive: admin.isActive
      });
    } catch (error) {
      console.error("Failed to update admin user:", error);
      res.status(500).json({ error: "Failed to update admin user" });
    }
  });

  // Delete admin user
  app.delete("/api/admin/users/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const currentAdmin = await storage.getAdminUser(req.session.adminId!);
      if (!currentAdmin || currentAdmin.role !== "super_admin") {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      if (id === req.session.adminId) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      const deleted = await storage.deleteAdminUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "Admin user not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete admin user:", error);
      res.status(500).json({ error: "Failed to delete admin user" });
    }
  });

  // =====================
  // MEMBER DIAL (saved stations)
  // =====================

  // Get member's dial
  app.get("/api/members/dial", isMemberAuthenticated, async (req, res) => {
    try {
      const dial = await storage.getMemberDial(req.session.memberId!);
      res.json(dial);
    } catch (error) {
      console.error("Failed to get dial:", error);
      res.status(500).json({ error: "Failed to get dial" });
    }
  });

  // Add station to dial
  app.post("/api/members/dial", isMemberAuthenticated, async (req, res) => {
    try {
      const { stationId, userStationId, presetNumber } = req.body;
      
      if (!stationId && !userStationId) {
        return res.status(400).json({ error: "Station ID required" });
      }

      const exists = await storage.isStationInDial(req.session.memberId!, stationId, userStationId);
      if (exists) {
        return res.status(400).json({ error: "Station already in dial" });
      }

      const entry = await storage.addToMemberDial({
        memberId: req.session.memberId!,
        stationId: stationId || null,
        userStationId: userStationId || null,
        presetNumber: presetNumber || null,
        sortOrder: 0
      });
      res.status(201).json(entry);
    } catch (error) {
      console.error("Failed to add to dial:", error);
      res.status(500).json({ error: "Failed to add to dial" });
    }
  });

  // Remove station from dial
  app.delete("/api/members/dial/:id", isMemberAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const deleted = await storage.removeFromMemberDial(req.session.memberId!, id);
      if (!deleted) {
        return res.status(404).json({ error: "Entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to remove from dial:", error);
      res.status(500).json({ error: "Failed to remove from dial" });
    }
  });

  // =====================
  // PRODUCER ROUTES
  // =====================

  // Get producer's stations
  app.get("/api/producer/stations", isMemberAuthenticated, async (req, res) => {
    try {
      const member = await storage.getMember(req.session.memberId!);
      if (!member || member.role !== "producer") {
        return res.status(403).json({ error: "Producer access required" });
      }

      const stations = await storage.getProducerStations(member.id);
      res.json(stations);
    } catch (error) {
      console.error("Failed to get producer stations:", error);
      res.status(500).json({ error: "Failed to get stations" });
    }
  });

  // Create producer station
  app.post("/api/producer/stations", isMemberAuthenticated, async (req, res) => {
    try {
      const member = await storage.getMember(req.session.memberId!);
      if (!member || member.role !== "producer") {
        return res.status(403).json({ error: "Producer access required" });
      }

      const { name, description, logoUrl, genre } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Station name required" });
      }

      const station = await storage.createUserStation({
        producerId: member.id,
        name,
        description,
        logoUrl,
        genre,
        isActive: true,
        sortOrder: 0
      });
      res.status(201).json(station);
    } catch (error) {
      console.error("Failed to create station:", error);
      res.status(500).json({ error: "Failed to create station" });
    }
  });

  // Update producer station
  app.patch("/api/producer/stations/:id", isMemberAuthenticated, async (req, res) => {
    try {
      const member = await storage.getMember(req.session.memberId!);
      if (!member || member.role !== "producer") {
        return res.status(403).json({ error: "Producer access required" });
      }

      const id = parseInt(req.params.id);
      const station = await storage.getUserStation(id);
      if (!station || station.producerId !== member.id) {
        return res.status(404).json({ error: "Station not found" });
      }

      const updated = await storage.updateUserStation(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Failed to update station:", error);
      res.status(500).json({ error: "Failed to update station" });
    }
  });

  // Delete producer station
  app.delete("/api/producer/stations/:id", isMemberAuthenticated, async (req, res) => {
    try {
      const member = await storage.getMember(req.session.memberId!);
      if (!member || member.role !== "producer") {
        return res.status(403).json({ error: "Producer access required" });
      }

      const id = parseInt(req.params.id);
      const station = await storage.getUserStation(id);
      if (!station || station.producerId !== member.id) {
        return res.status(404).json({ error: "Station not found" });
      }

      await storage.deleteUserStation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete station:", error);
      res.status(500).json({ error: "Failed to delete station" });
    }
  });

  // Get tracks for producer station
  app.get("/api/producer/stations/:id/tracks", isMemberAuthenticated, async (req, res) => {
    try {
      const member = await storage.getMember(req.session.memberId!);
      if (!member || member.role !== "producer") {
        return res.status(403).json({ error: "Producer access required" });
      }

      const id = parseInt(req.params.id);
      const station = await storage.getUserStation(id);
      if (!station || station.producerId !== member.id) {
        return res.status(404).json({ error: "Station not found" });
      }

      const tracks = await storage.getTracksByStation(id);
      res.json(tracks);
    } catch (error) {
      console.error("Failed to get tracks:", error);
      res.status(500).json({ error: "Failed to get tracks" });
    }
  });

  // Add track to producer station
  app.post("/api/producer/stations/:id/tracks", isMemberAuthenticated, async (req, res) => {
    try {
      const member = await storage.getMember(req.session.memberId!);
      if (!member || member.role !== "producer") {
        return res.status(403).json({ error: "Producer access required" });
      }

      const stationId = parseInt(req.params.id);
      const station = await storage.getUserStation(stationId);
      if (!station || station.producerId !== member.id) {
        return res.status(404).json({ error: "Station not found" });
      }

      const { title, artist, mediaUrl, mediaType, duration } = req.body;
      if (!title || !mediaUrl || !mediaType) {
        return res.status(400).json({ error: "Title, media URL and type required" });
      }

      const track = await storage.createTrack({
        stationId,
        title,
        artist,
        mediaUrl,
        mediaType,
        duration,
        sortOrder: 0
      });
      res.status(201).json(track);
    } catch (error) {
      console.error("Failed to add track:", error);
      res.status(500).json({ error: "Failed to add track" });
    }
  });

  // Submit station for approval
  app.post("/api/producer/stations/:id/submit", isMemberAuthenticated, async (req, res) => {
    try {
      const member = await storage.getMember(req.session.memberId!);
      if (!member || member.role !== "producer") {
        return res.status(403).json({ error: "Producer access required" });
      }

      const stationId = parseInt(req.params.id);
      const station = await storage.getUserStation(stationId);
      if (!station || station.producerId !== member.id) {
        return res.status(404).json({ error: "Station not found" });
      }

      const existing = await storage.getApprovalRequestByStation(stationId);
      if (existing && existing.status === "pending") {
        return res.status(400).json({ error: "Approval request already pending" });
      }

      const request = await storage.createApprovalRequest({
        userStationId: stationId,
        producerId: member.id
      });
      res.status(201).json(request);
    } catch (error) {
      console.error("Failed to submit for approval:", error);
      res.status(500).json({ error: "Failed to submit" });
    }
  });

  // =====================
  // APPROVAL REQUESTS (Admin)
  // =====================

  // Get all approval requests
  app.get("/api/admin/approvals", isAdminAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const requests = await storage.getApprovalRequests(status);
      res.json(requests);
    } catch (error) {
      console.error("Failed to get approval requests:", error);
      res.status(500).json({ error: "Failed to get requests" });
    }
  });

  // Review approval request
  app.post("/api/admin/approvals/:id/review", isAdminAuthenticated, async (req, res) => {
    try {
      const currentAdmin = await storage.getAdminUser(req.session.adminId!);
      if (!currentAdmin || currentAdmin.role !== "super_admin") {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const id = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Valid status required (approved/rejected)" });
      }

      const updated = await storage.reviewApprovalRequest(id, status, currentAdmin.id, notes);
      if (!updated) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Failed to review request:", error);
      res.status(500).json({ error: "Failed to review" });
    }
  });

  // =====================
  // PUBLIC STATIONS (includes approved producer stations)
  // =====================

  // Get public user stations (approved by admin)
  app.get("/api/public/user-stations", async (req, res) => {
    try {
      const stations = await storage.getPublicUserStations();
      res.json(stations);
    } catch (error) {
      console.error("Failed to get public stations:", error);
      res.status(500).json({ error: "Failed to get stations" });
    }
  });

  // =====================
  // MEMBER UPGRADE (Admin only)
  // =====================

  // Upgrade member to producer
  app.post("/api/admin/members/:id/upgrade", isAdminAuthenticated, async (req, res) => {
    try {
      const currentAdmin = await storage.getAdminUser(req.session.adminId!);
      if (!currentAdmin || currentAdmin.role !== "super_admin") {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const id = parseInt(req.params.id);
      const member = await storage.upgradeToProducer(id);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json({ message: "Member upgraded to producer", member });
    } catch (error) {
      console.error("Failed to upgrade member:", error);
      res.status(500).json({ error: "Failed to upgrade" });
    }
  });

  // =====================
  // MEMBER UPGRADE REQUESTS
  // =====================

  // Member: Create upgrade request
  app.post("/api/members/upgrade-request", isMemberAuthenticated, async (req, res) => {
    try {
      const memberId = req.session.memberId!;
      const member = await storage.getMember(memberId);
      
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      if (member.role === "producer") {
        return res.status(400).json({ error: "You are already a producer" });
      }

      // Check if there's already a pending or approved request
      const existing = await storage.getMemberUpgradeRequestByMember(memberId);
      if (existing && existing.status === "pending") {
        return res.status(400).json({ error: "You already have a pending upgrade request" });
      }
      if (existing && existing.status === "approved") {
        return res.status(400).json({ error: "Your upgrade request was already approved" });
      }

      const { justification } = req.body;
      const request = await storage.createMemberUpgradeRequest({
        memberId,
        justification: justification || null
      });

      res.status(201).json(request);
    } catch (error) {
      console.error("Failed to create upgrade request:", error);
      res.status(500).json({ error: "Failed to submit request" });
    }
  });

  // Member: Get own upgrade request status
  app.get("/api/members/upgrade-request", isMemberAuthenticated, async (req, res) => {
    try {
      const memberId = req.session.memberId!;
      const request = await storage.getMemberUpgradeRequestByMember(memberId);
      res.json(request || null);
    } catch (error) {
      console.error("Failed to get upgrade request:", error);
      res.status(500).json({ error: "Failed to get request status" });
    }
  });

  // Admin: Get all upgrade requests
  app.get("/api/admin/upgrade-requests", isAdminAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const requests = await storage.getMemberUpgradeRequests(status);
      res.json(requests);
    } catch (error) {
      console.error("Failed to get upgrade requests:", error);
      res.status(500).json({ error: "Failed to get requests" });
    }
  });

  // Admin: Review upgrade request
  app.post("/api/admin/upgrade-requests/:id/review", isAdminAuthenticated, async (req, res) => {
    try {
      const currentAdmin = await storage.getAdminUser(req.session.adminId!);
      if (!currentAdmin || currentAdmin.role !== "super_admin") {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const id = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Valid status required (approved/rejected)" });
      }

      // Check if request exists and is still pending
      const existingRequest = await storage.getMemberUpgradeRequest(id);
      if (!existingRequest) {
        return res.status(404).json({ error: "Request not found" });
      }
      if (existingRequest.status !== "pending") {
        return res.status(400).json({ error: "This request has already been reviewed" });
      }

      const updated = await storage.reviewMemberUpgradeRequest(id, status, currentAdmin.id, notes);
      res.json(updated);
    } catch (error) {
      console.error("Failed to review upgrade request:", error);
      res.status(500).json({ error: "Failed to review" });
    }
  });

  return httpServer;
}
