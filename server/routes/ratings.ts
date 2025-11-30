import type { Express } from "express";
import { authenticate, requireTenantAccess, type AuthRequest } from "../auth/middleware";
import { IStorage } from "../storage";

interface RatingData {
  id: string;
  tenantId: string;
  orderId: string;
  customerId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export function registerRatingRoutes(app: Express, storage: IStorage) {
  // Submit rating for order
  app.post("/api/orders/:orderId/rating",
    authenticate,
    async (req: AuthRequest, res) => {
      try {
        const { orderId } = req.params;
        const { rating, comment } = req.body;
        const customerId = req.user!.id || req.user!.userId!;

        if (!rating || rating < 1 || rating > 5) {
          return res.status(400).json({ error: "Rating must be between 1 and 5" });
        }

        const order = await storage.getOrder(orderId);
        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }

        const ratingData: RatingData = {
          id: `rating_${Date.now()}`,
          tenantId: order.tenantId,
          orderId,
          customerId,
          rating,
          comment: comment || "",
          createdAt: new Date().toISOString(),
        };

        if (storage.createRating) {
          await storage.createRating(ratingData);
        }

        res.json(ratingData);
      } catch (error) {
        console.error("Submit rating error:", error);
        res.status(500).json({ error: "Failed to submit rating" });
      }
    }
  );

  // Get ratings for restaurant
  app.get("/api/restaurant/ratings",
    authenticate,
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const tenantId = req.user!.tenantId!;
        const ratings = await storage.getRatings?.() || [];
        const restaurantRatings = ratings.filter((r: any) => r.tenantId === tenantId);

        // Calculate average
        const avgRating = restaurantRatings.length > 0
          ? restaurantRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / restaurantRatings.length
          : 0;

        res.json({
          ratings: restaurantRatings,
          average: Math.round(avgRating * 10) / 10,
          total: restaurantRatings.length,
          distribution: calculateDistribution(restaurantRatings),
        });
      } catch (error) {
        console.error("Get ratings error:", error);
        res.status(500).json({ error: "Failed to fetch ratings" });
      }
    }
  );

  // Get ratings for specific order
  app.get("/api/orders/:orderId/ratings",
    async (req: AuthRequest, res) => {
      try {
        const { orderId } = req.params;
        const ratings = await storage.getRatings?.() || [];
        const orderRating = ratings.find((r: any) => r.orderId === orderId);

        if (!orderRating) {
          return res.json({ rating: null });
        }

        res.json(orderRating);
      } catch (error) {
        console.error("Get order rating error:", error);
        res.status(500).json({ error: "Failed to fetch rating" });
      }
    }
  );
}

function calculateDistribution(ratings: RatingData[]): Record<number, number> {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  ratings.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      distribution[r.rating]++;
    }
  });

  return distribution;
}
