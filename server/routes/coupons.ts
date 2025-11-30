import type { Express } from "express";
import { authenticate, requireRole, requireTenantAccess, type AuthRequest } from "../auth/middleware";
import { IStorage } from "../storage";

interface CouponData {
  id: string;
  tenantId: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses: number;
  currentUses: number;
  minOrderAmount: number;
  expiryDate: string;
  active: boolean;
  createdAt: string;
}

export function registerCouponRoutes(app: Express, storage: IStorage) {
  // Get all coupons for restaurant
  app.get("/api/restaurant/coupons",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const tenantId = req.user!.tenantId!;
        const coupons = await storage.getCoupons?.() || [];
        const restaurantCoupons = coupons.filter((c: any) => c.tenantId === tenantId);
        res.json(restaurantCoupons);
      } catch (error) {
        console.error("Get coupons error:", error);
        res.status(500).json({ error: "Failed to fetch coupons" });
      }
    }
  );

  // Create new coupon
  app.post("/api/restaurant/coupons",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const tenantId = req.user!.tenantId!;
        const { code, description, discountType, discountValue, maxUses, minOrderAmount, expiryDate } = req.body;

        if (!code || !discountType || !discountValue) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        const coupon: CouponData = {
          id: `coupon_${Date.now()}`,
          tenantId,
          code: code.toUpperCase(),
          description,
          discountType,
          discountValue,
          maxUses: maxUses || 999,
          currentUses: 0,
          minOrderAmount: minOrderAmount || 0,
          expiryDate,
          active: true,
          createdAt: new Date().toISOString(),
        };

        if (storage.createCoupon) {
          await storage.createCoupon(coupon);
        }

        res.json(coupon);
      } catch (error) {
        console.error("Create coupon error:", error);
        res.status(500).json({ error: "Failed to create coupon" });
      }
    }
  );

  // Validate coupon (for checkout)
  app.post("/api/coupons/validate",
    authenticate,
    async (req: AuthRequest, res) => {
      try {
        const { code, orderAmount, tenantId } = req.body;

        if (!code || !tenantId) {
          return res.status(400).json({ valid: false, error: "Missing fields" });
        }

        const coupons = await storage.getCoupons?.() || [];
        const coupon = coupons.find((c: any) =>
          c.code === code.toUpperCase() &&
          c.tenantId === tenantId &&
          c.active &&
          c.currentUses < c.maxUses &&
          new Date(c.expiryDate) > new Date() &&
          orderAmount >= c.minOrderAmount
        );

        if (!coupon) {
          return res.json({ valid: false, error: "Coupon not found or expired" });
        }

        let discount = 0;
        if (coupon.discountType === "percentage") {
          discount = (orderAmount * coupon.discountValue) / 100;
        } else {
          discount = coupon.discountValue;
        }

        res.json({
          valid: true,
          coupon,
          discount: Math.min(discount, orderAmount),
          newTotal: Math.max(0, orderAmount - discount),
        });
      } catch (error) {
        console.error("Validate coupon error:", error);
        res.status(500).json({ valid: false, error: "Validation failed" });
      }
    }
  );

  // Apply coupon (increment uses)
  app.post("/api/coupons/apply",
    authenticate,
    async (req: AuthRequest, res) => {
      try {
        const { couponId } = req.body;

        const coupons = await storage.getCoupons?.() || [];
        const coupon = coupons.find((c: any) => c.id === couponId);

        if (!coupon) {
          return res.status(404).json({ error: "Coupon not found" });
        }

        if (storage.updateCoupon) {
          const updated = await storage.updateCoupon(couponId, {
            currentUses: coupon.currentUses + 1,
          });
          res.json(updated);
        } else {
          res.json(coupon);
        }
      } catch (error) {
        console.error("Apply coupon error:", error);
        res.status(500).json({ error: "Failed to apply coupon" });
      }
    }
  );

  // Deactivate coupon
  app.delete("/api/restaurant/coupons/:id",
    authenticate,
    requireRole("restaurant_owner"),
    requireTenantAccess,
    async (req: AuthRequest, res) => {
      try {
        const { id } = req.params;

        if (storage.updateCoupon) {
          await storage.updateCoupon(id, { active: false });
        }

        res.json({ success: true });
      } catch (error) {
        console.error("Delete coupon error:", error);
        res.status(500).json({ error: "Failed to delete coupon" });
      }
    }
  );
}
