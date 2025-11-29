import { db } from "./db";
import { users, tenants } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function seedAdminUser() {
  try {
    // Skip if db not available
    if (!db.select) {
      return;
    }
    
    // Check if admin already exists
    const existing = await db.select().from(users).where(eq(users.email, "admin@wilsonpizza.com")).limit(1).then((r: any) => r[0]);
    if (existing) {
      console.log("[Seed] Admin user already exists");
      return;
    }

    // Get Wilson Pizza tenant (try both slugs for backward compatibility)
    let tenant = await db.select().from(tenants).where(eq(tenants.slug, "wilsonpizza")).limit(1).then((r: any) => r[0]);
    
    if (!tenant) {
      // Try alternate slug for backward compatibility
      tenant = await db.select().from(tenants).where(eq(tenants.slug, "wilson-pizza")).limit(1).then((r: any) => r[0]);
    }
    
    if (!tenant) {
      console.error("[Seed] Wilson Pizza restaurant not found - cannot link admin");
      return;
    }

    console.log("[Seed] Found Wilson Pizza restaurant, creating admin user...");

    // Hash password
    const hashedPassword = await hash("admin123", 10);

    // Create admin user linked to Wilson Pizza tenant
    const admin = await db.insert(users).values({
      email: "admin@wilsonpizza.com",
      password: hashedPassword,
      name: "Admin Wilson Pizza",
      phone: "11987654321",
      role: "platform_admin",
      tenantId: tenant.id,
      isActive: true,
    } as any).returning().then((r: any) => r[0]);

    console.log("[Seed] Admin user created and linked to Wilson Pizza tenant:", admin.email);

  } catch (error) {
    console.error("[Seed] Admin user seeding error:", error);
    // Silently fail in development
    if (process.env.NODE_ENV === "development") {
      return;
    }
  }
}
