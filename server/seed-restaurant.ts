import { db } from "./db";
import { users, tenants } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function seedRestaurantOwner() {
  try {
    // Skip if db not available
    if (!db.select) {
      return;
    }
    
    // Check if restaurant owner already exists
    const existing = await db.select().from(users).where(eq(users.email, "wilson@wilsonpizza.com")).limit(1).then((r: any) => r[0]);
    if (existing) {
      console.log("[Seed] Restaurant owner already exists");
      return;
    }

    // Get the tenant - try both slugs for backward compatibility
    let tenant = await db.select().from(tenants).where(eq(tenants.slug, "wilsonpizza")).limit(1).then((r: any) => r[0]);
    
    if (!tenant) {
      // Try alternate slug for backward compatibility
      tenant = await db.select().from(tenants).where(eq(tenants.slug, "wilson-pizza")).limit(1).then((r: any) => r[0]);
    }
    
    if (!tenant) {
      console.error("[Seed] Wilson Pizza restaurant not found");
      return;
    }
    
    console.log("[Seed] Found Wilson Pizza restaurant with slug:", tenant.slug);

    // Hash password
    const hashedPassword = await hash("wilson123", 10);

    // Create restaurant owner user and link to Wilson Pizza tenant
    const owner = await db.insert(users).values({
      email: "wilson@wilsonpizza.com",
      password: hashedPassword,
      name: "Wilson",
      phone: "11999999999",
      role: "restaurant_owner",
      tenantId: tenant.id,
      isActive: true,
    } as any).returning().then((r: any) => r[0]);

    console.log("[Seed] Restaurant owner created and linked to Wilson Pizza tenant:", owner.email);
  } catch (error) {
    console.error("[Seed] Restaurant owner seeding error:", error);
    // Silently fail in development
    if (process.env.NODE_ENV === "development") {
      return;
    }
  }
}
