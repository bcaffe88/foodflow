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
  // Kitchen staff login
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

  // Create kitchen staff (by restaurant owner)
  app.post("/api/restaurant/kitchen-staff", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const data = kitchenStaffSchema.parse(req.body);
      const { tenantId } = req.body;

      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID required" });
      }

      const existing = await storage.getKitchenStaffByEmail(data.email, tenantId);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await hash(data.password, 10);
      const staff = await storage.createKitchenStaff({
        tenantId,
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        isActive: true,
      });

      res.status(201).json({
        id: staff.id,
        email: staff.email,
        name: staff.name,
        tenantId: staff.tenantId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Create kitchen staff error:", error);
      res.status(500).json({ error: "Failed to create staff" });
    }
  });

  // Get kitchen staff by tenant
  app.get("/api/restaurant/kitchen-staff", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { tenantId } = req.query;
      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID required" });
      }

      const staff = await storage.getKitchenStaffByTenant(tenantId as string);
      res.json(staff);
    } catch (error) {
      console.error("Get kitchen staff error:", error);
      res.status(500).json({ error: "Failed to get staff" });
    }
  });

  // Delete kitchen staff
  app.delete("/api/restaurant/kitchen-staff/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required" });
      }

      await storage.deleteKitchenStaff(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete kitchen staff error:", error);
      res.status(500).json({ error: "Failed to delete staff" });
    }
  });
}
