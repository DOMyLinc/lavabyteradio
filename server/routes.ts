import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated } from "./replit_integrations/auth";
import { 
  insertStationSchema, updateStationSchema,
  insertUserStationSchema, updateUserStationSchema,
  insertStationTrackSchema, updateStationTrackSchema,
  insertAdCampaignSchema, updateAdCampaignSchema,
  insertPlaybackHistorySchema
} from "@shared/schema";
import { z } from "zod";

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

  // Create station (protected)
  app.post("/api/stations", isAuthenticated, async (req, res) => {
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

  // Update station (protected)
  app.patch("/api/stations/:id", isAuthenticated, async (req, res) => {
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

  // Delete station (protected)
  app.delete("/api/stations/:id", isAuthenticated, async (req, res) => {
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

  // Create user station (protected)
  app.post("/api/user-stations", isAuthenticated, async (req, res) => {
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

  // Update user station (protected)
  app.patch("/api/user-stations/:id", isAuthenticated, async (req, res) => {
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

  // Delete user station (protected)
  app.delete("/api/user-stations/:id", isAuthenticated, async (req, res) => {
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

  // Create track for a station (protected)
  app.post("/api/user-stations/:stationId/tracks", isAuthenticated, async (req, res) => {
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

  // Update track (protected)
  app.patch("/api/tracks/:id", isAuthenticated, async (req, res) => {
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

  // Delete track (protected)
  app.delete("/api/tracks/:id", isAuthenticated, async (req, res) => {
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

  // Create ad campaign (protected)
  app.post("/api/ad-campaigns", isAuthenticated, async (req, res) => {
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

  // Update ad campaign (protected)
  app.patch("/api/ad-campaigns/:id", isAuthenticated, async (req, res) => {
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

  // Delete ad campaign (protected)
  app.delete("/api/ad-campaigns/:id", isAuthenticated, async (req, res) => {
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

  return httpServer;
}
