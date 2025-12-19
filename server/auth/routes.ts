import type { Express } from "express";
import { hash, compare } from "bcryptjs";
import { z } from "zod";
import { storage } from "../storage";
import { generateTokens, refreshAccessToken } from "./jwt";
import { authenticate, type AuthRequest } from "./middleware";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(["customer", "driver", "restaurant_owner", "platform_admin"]).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export function registerAuthRoutes(app: Express) {
  // Public registration (customers and drivers)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await hash(data.password, 10);

      // Create tenant automatically for restaurant owners so it's linked to their account
      let tenantId: string | undefined;
      if (data.role === "restaurant_owner") {
        const baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "restaurante";
        const existingSlug = await storage.getTenantBySlug(baseSlug);
        const slug = existingSlug ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

        const tenant = await storage.createTenant({
          name: data.name,
          slug,
          phone: data.phone,
          address: data.address,
          description: data.category,
        } as any);
        tenantId = tenant.id;
      }

      // Create user
      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        role: data.role || "customer",
        tenantId,
        isActive: true,
      });

      // Create profile based on role
      if (user.role === "customer") {
        await storage.createCustomerProfile({
          userId: user.id,
        });
      } else if (user.role === "driver") {
        await storage.createDriverProfile({
          userId: user.id,
          status: "offline",
          totalDeliveries: 0,
        });
      }
      // platform_admin e restaurant_owner não precisam de profiles adicionais

      // Generate tokens
      const tokens = generateTokens(user);

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        ...tokens,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);

      // Find user in database
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await compare(data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ error: "Account is deactivated" });
      }

      // Generate tokens
      const tokens = generateTokens(user);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        },
        ...tokens,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Refresh token
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const data = refreshSchema.parse(req.body);
      
      const newAccessToken = refreshAccessToken(data.refreshToken);
      if (!newAccessToken) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      res.json({ accessToken: newAccessToken });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(401).json({ error: "Token refresh failed" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = req.user.userId || req.user.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found in token" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Logout (client-side token removal, but endpoint for consistency)
  app.post("/api/auth/logout", authenticate, async (req, res) => {
    res.json({ message: "Logged out successfully" });
  });
}
