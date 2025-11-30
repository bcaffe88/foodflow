import type { Express } from "express";
import { authenticate, requireRole, type AuthRequest } from "../auth/middleware";
import { IStorage } from "../storage";

interface DriverLocationData {
  driverId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

// In-memory store for real-time driver locations
const driverLocations = new Map<string, DriverLocationData>();

export function registerDriverGPSRoutes(app: Express, storage: IStorage) {
  // Update driver location
  app.post("/api/driver/location",
    authenticate,
    requireRole("driver"),
    async (req: AuthRequest, res) => {
      try {
        const driverId = req.user!.id || req.user!.userId!;
        const { latitude, longitude, accuracy } = req.body;

        const locationData: DriverLocationData = {
          driverId,
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString(),
        };

        driverLocations.set(driverId, locationData);

        // TODO: Broadcast to WebSocket subscribers
        console.log(`[GPS] Driver ${driverId} at ${latitude}, ${longitude}`);

        res.json({ success: true, location: locationData });
      } catch (error) {
        console.error("GPS location error:", error);
        res.status(500).json({ error: "Failed to update location" });
      }
    }
  );

  // Get driver location (for dispatch/tracking)
  app.get("/api/driver/location/:driverId",
    authenticate,
    async (req: AuthRequest, res) => {
      try {
        const { driverId } = req.params;
        const location = driverLocations.get(driverId);

        if (!location) {
          return res.status(404).json({ error: "Driver location not found" });
        }

        res.json(location);
      } catch (error) {
        console.error("Get location error:", error);
        res.status(500).json({ error: "Failed to get location" });
      }
    }
  );

  // Get all active drivers (for dispatch)
  app.get("/api/dispatch/active-drivers",
    authenticate,
    async (req: AuthRequest, res) => {
      try {
        const drivers = Array.from(driverLocations.values());
        res.json(drivers);
      } catch (error) {
        console.error("Get active drivers error:", error);
        res.status(500).json({ error: "Failed to get active drivers" });
      }
    }
  );

  // Auto-assign order to nearest driver
  app.post("/api/dispatch/auto-assign",
    authenticate,
    async (req: AuthRequest, res) => {
      try {
        const { orderId, latitude, longitude } = req.body;

        // Find nearest driver
        let nearestDriver = null;
        let minDistance = Infinity;

        driverLocations.forEach((location) => {
          const distance = calculateDistance(
            latitude, longitude,
            location.latitude, location.longitude
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestDriver = location;
          }
        });

        if (!nearestDriver) {
          return res.status(404).json({ error: "No drivers available" });
        }

        // TODO: Create assignment in database
        console.log(`[Dispatch] Assigned order ${orderId} to driver ${nearestDriver.driverId}`);

        res.json({
          success: true,
          assignedDriver: nearestDriver,
          distance: minDistance,
        });
      } catch (error) {
        console.error("Auto-assign error:", error);
        res.status(500).json({ error: "Failed to assign order" });
      }
    }
  );

  // Get assigned orders for driver
  app.get("/api/driver/assigned-orders",
    authenticate,
    requireRole("driver"),
    async (req: AuthRequest, res) => {
      try {
        const driverId = req.user!.id!;
        
        // TODO: Get from database
        res.json([]);
      } catch (error) {
        console.error("Get assigned orders error:", error);
        res.status(500).json({ error: "Failed to get assigned orders" });
      }
    }
  );
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
