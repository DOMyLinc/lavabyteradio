import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStationSchema, updateStationSchema } from "@shared/schema";
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

  // Create station
  app.post("/api/stations", async (req, res) => {
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

  // Update station
  app.patch("/api/stations/:id", async (req, res) => {
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

  // Delete station
  app.delete("/api/stations/:id", async (req, res) => {
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

  return httpServer;
}
