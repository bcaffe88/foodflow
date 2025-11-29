import { db } from "./db";
import { users, tenants, driverProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function seedDriver() {
  try {
    // Skip if db not available
    if (!db.select) {
      return;
    }

    // Check if driver already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, "driver@wilsonpizza.com"))
      .limit(1)
      .then((r: any) => r[0]);

    if (existing) {
      console.log("[Seed] Driver already exists");
      return;
    }

    // Get Wilson Pizza tenant (try both slugs for backward compatibility)
    let tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, "wilsonpizza"))
      .limit(1)
      .then((r: any) => r[0]);

    if (!tenant) {
      tenant = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, "wilson-pizza"))
        .limit(1)
        .then((r: any) => r[0]);
    }

    if (!tenant) {
      console.error("[Seed] Wilson Pizza restaurant not found");
      return;
    }

    console.log("[Seed] Found Wilson Pizza restaurant, creating driver...");

    // Hash password
    const hashedPassword = await hash("driver123", 10);

    // Create driver user and link to Wilson Pizza tenant
    const driver = await db
      .insert(users)
      .values({
        email: "driver@wilsonpizza.com",
        password: hashedPassword,
        name: "Motorista Wilson",
        phone: "11988888888",
        role: "driver",
        tenantId: tenant.id,
        isActive: true,
      } as any)
      .returning()
      .then((r: any) => r[0]);

    console.log("[Seed] Driver created:", driver.email, "linked to tenant:", tenant.id);

    // Create driver profile
    const driverProfile = await db
      .insert(driverProfiles)
      .values({
        userId: driver.id,
        vehicleType: "motorcycle",
        vehiclePlate: "ABC-1234",
        status: "available",
        currentLatitude: "-7.9056",
        currentLongitude: "-40.1056",
        rating: "5.00",
        totalDeliveries: 0,
      } as any)
      .returning()
      .then((r: any) => r[0]);

    console.log("[Seed] Driver profile created:", driverProfile.id);
    console.log("[Seed] ✅ Driver fully synced with Wilson Pizza tenant");
  } catch (error) {
    console.error("[Seed] Driver seeding error:", error);
    // Silently fail in development
    if (process.env.NODE_ENV === "development") {
      return;
    }
  }
}
