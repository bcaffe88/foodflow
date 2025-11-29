import { db } from "./db";
import { users, tenants, customerProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function seedCustomer() {
  try {
    // Skip if db not available
    if (!db.select) {
      return;
    }

    // Check if customer already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, "customer@example.com"))
      .limit(1)
      .then((r: any) => r[0]);

    if (existing) {
      console.log("[Seed] Customer already exists");
      return;
    }

    // Get Wilson Pizza tenant
    let tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, "wilson-pizza"))
      .limit(1)
      .then((r: any) => r[0]);

    if (!tenant) {
      tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, "wilsonpizza"))
        .limit(1)
        .then((r: any) => r[0]);
    }

    if (!tenant) {
      console.error("[Seed] Wilson Pizza restaurant not found");
      return;
    }

    console.log("[Seed] Found Wilson Pizza restaurant, creating customer...");

    // Hash password
    const hashedPassword = await hash("password", 10);

    // Create customer user
    const [customer] = await db
      .insert(users)
      .values({
        email: "customer@example.com",
        password: hashedPassword,
        name: "João Cliente",
        phone: "11988776655",
        role: "customer",
        tenantId: tenant.id,
        isActive: true,
      } as any)
      .returning();
    
    if (!customer) {
      console.error("[Seed] Failed to create customer");
      return;
    }

    console.log("[Seed] Customer created:", customer.email);

    // Create customer profile
    const [customerProfile] = await db
      .insert(customerProfiles)
      .values({
        userId: customer.id,
        defaultDeliveryAddress: "Rua Qualquer Coisa, 123",
      } as any)
      .returning();

    console.log("[Seed] Customer profile created:", customerProfile.id);
    console.log("[Seed] ✅ Customer fully synced with Wilson Pizza tenant");
  } catch (error) {
    console.error("[Seed] Customer seeding error:", error);
    // Silently fail in development
    if (process.env.NODE_ENV === "development") {
      return;
    }
  }
}
