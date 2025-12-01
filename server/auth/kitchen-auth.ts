import type { Express } from "express";
import { hash, compare } from "bcryptjs";
import { z } from "zod";
import { storage } from "../storage";
import { generateTokens } from "./jwt";

const kitchenLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const kitchenStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
});

export function registerKitchenAuthRoutes(app: Express) {
  // Kitchen staff login with tenant ID
  app.post("/api/kitchen/auth/login", async (req, res) => {
    try {
      const data = kitchenLoginSchema.parse(req.body);
      const { tenantId } = req.body;

      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID required" });
      }

      const staff = await storage.getKitchenStaffByEmail(data.email, tenantId);
      if (!staff) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await compare(data.password, staff.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!staff.isActive) {
        return res.status(403).json({ error: "Account is deactivated" });
      }

      const tokens = generateTokens({
        id: staff.id,
        email: staff.email,
        role: "kitchen_staff",
        tenantId: staff.tenantId,
      });

      res.json({
        staff: {
          id: staff.id,
          email: staff.email,
          name: staff.name,
          tenantId: staff.tenantId,
        },
        ...tokens,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Kitchen login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Kitchen staff auto-login (no tenant ID needed - auto-syncs with restaurant)
  app.post("/api/auth/kitchen-login", async (req, res) => {
    try {
      const data = kitchenLoginSchema.parse(req.body);

      // Find kitchen staff by email only (no tenantId needed)
      const staff = await storage.getKitchenStaffByEmailOnly(data.email);
      if (!staff) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await compare(data.password, staff.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!staff.isActive) {
        return res.status(403).json({ error: "Account is deactivated" });
      }

      const tokens = generateTokens({
        id: staff.id,
        email: staff.email,
        role: "kitchen_staff",
        tenantId: staff.tenantId,
      });

      res.json({
        staff: {
          id: staff.id,
          email: staff.email,
          name: staff.name,
          tenantId: staff.tenantId,
        },
        ...tokens,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Kitchen auto-login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

}
