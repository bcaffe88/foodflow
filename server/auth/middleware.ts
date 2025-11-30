import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "./jwt";

export interface AuthRequest extends Request {
  user?: {
    userId?: string;
    id?: string;
    email: string;
    role: string;
    tenantId?: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = {
    userId: payload.userId || payload.id,
    id: payload.id || payload.userId,
    email: payload.email,
    role: payload.role,
    tenantId: payload.tenantId,
  };
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

export function requireTenantAccess(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Platform admin can access all tenants
  if (req.user.role === "platform_admin") {
    return next();
  }

  // Restaurant owner must have a tenant
  if (req.user.role === "restaurant_owner" && !req.user.tenantId) {
    return res.status(403).json({ error: "No restaurant associated with this account" });
  }

  next();
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload) {
      req.user = {
        userId: payload.userId || payload.id,
        id: payload.id || payload.userId,
        email: payload.email,
        role: payload.role,
        tenantId: payload.tenantId,
      };
    }
  }

  next();
}
