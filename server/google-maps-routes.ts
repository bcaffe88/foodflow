// Google Maps API Routes to add to server/routes.ts
// These should be added after the WhatsApp integration routes

export function registerGoogleMapsRoutes() {
  return `
  // ============================================================================
  // GOOGLE MAPS & DELIVERY OPTIMIZATION ROUTES
  // ============================================================================

  // Geocode address to coordinates
  app.post("/api/maps/geocode", async (req, res) => {
    try {
      const { address } = req.body;
      
      if (!address) {
        return res.status(400).json({ error: "Address required" });
      }

      const result = await mapsService?.geocodeAddress(address);
      
      if (!result) {
        return res.status(404).json({ error: "Address not found" });
      }

      res.json(result);
    } catch (error) {
      console.error(\`[API] Geocoding error:\`, error);
      res.status(500).json({ error: "Geocoding failed" });
    }
  });

  // Reverse geocode coordinates
  app.post("/api/maps/reverse-geocode", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Coordinates required" });
      }

      const result = await mapsService?.reverseGeocodeCoordinates(latitude, longitude);
      
      if (!result) {
        return res.status(404).json({ error: "Address not found" });
      }

      res.json(result);
    } catch (error) {
      console.error(\`[API] Reverse geocoding error:\`, error);
      res.status(500).json({ error: "Reverse geocoding failed" });
    }
  });

  // Get directions between two points
  app.post("/api/maps/directions", async (req, res) => {
    try {
      const { startLat, startLng, endLat, endLng, mode = 'driving' } = req.body;
      
      if (!startLat || !startLng || !endLat || !endLng) {
        return res.status(400).json({ error: "Coordinates required" });
      }

      const result = await mapsService?.getDirections(
        startLat, startLng, endLat, endLng, mode
      );
      
      if (!result) {
        return res.status(500).json({ error: "Could not calculate directions" });
      }

      res.json(result);
    } catch (error) {
      console.error(\`[API] Directions error:\`, error);
      res.status(500).json({ error: "Directions failed" });
    }
  });

  // Estimate delivery time and cost
  app.post("/api/maps/estimate-delivery", async (req, res) => {
    try {
      const { restaurantLat, restaurantLng, customerLat, customerLng, prepTime = 15 } = req.body;
      
      if (!restaurantLat || !restaurantLng || !customerLat || !customerLng) {
        return res.status(400).json({ error: "Coordinates required" });
      }

      const timeResult = await mapsService?.estimateDeliveryTime(
        restaurantLat, restaurantLng, customerLat, customerLng, prepTime
      );

      const fee = mapsService?.calculateDeliveryFee(timeResult?.distance || 0);

      res.json({
        eta: new Date(Date.now() + (timeResult?.estimatedMinutes || 45) * 60000).toISOString(),
        estimatedMinutes: timeResult?.estimatedMinutes || 45,
        distance: timeResult?.distance || 0,
        deliveryFee: fee || 5.0
      });
    } catch (error) {
      console.error(\`[API] Estimate delivery error:\`, error);
      res.status(500).json({ error: "Estimation failed" });
    }
  });

  // Find nearest drivers
  app.post("/api/delivery/nearest-drivers",
    authenticate,
    async (req: AuthRequest, res) => {
      try {
        const { latitude, longitude, limit = 5 } = req.body;
        
        if (!latitude || !longitude) {
          return res.status(400).json({ error: "Coordinates required" });
        }

        const drivers = await deliveryOptimizer?.findNearestDrivers(
          latitude, longitude, req.user!.tenantId, limit
        );

        res.json(drivers || []);
      } catch (error) {
        console.error(\`[API] Nearest drivers error:\`, error);
        res.status(500).json({ error: "Could not find drivers" });
      }
    }
  );

  // Optimize route for driver
  app.post("/api/delivery/optimize-route",
    authenticate,
    requireRole("driver"),
    async (req: AuthRequest, res) => {
      try {
        const { driverLat, driverLng, orders } = req.body;
        
        if (!driverLat || !driverLng || !orders || orders.length === 0) {
          return res.status(400).json({ error: "Invalid route data" });
        }

        const optimizedRoutes = await deliveryOptimizer?.optimizeRoute(
          req.user!.id,
          driverLat, driverLng,
          orders
        );

        res.json(optimizedRoutes || []);
      } catch (error) {
        console.error(\`[API] Route optimization error:\`, error);
        res.status(500).json({ error: "Route optimization failed" });
      }
    }
  );

  // Calculate delivery fee
  app.post("/api/delivery/calculate-fee", async (req, res) => {
    try {
      const { distance, baseRate = 5.0 } = req.body;
      
      if (distance === undefined) {
        return res.status(400).json({ error: "Distance required" });
      }

      const fee = mapsService?.calculateDeliveryFee(distance, baseRate) || (baseRate + (distance / 1000) * 0.5);

      res.json({ fee, distance });
    } catch (error) {
      console.error(\`[API] Fee calculation error:\`, error);
      res.status(500).json({ error: "Fee calculation failed" });
    }
  });
`;
}
