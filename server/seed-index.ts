// Consolidated seed file - runs all database seeds on startup
import { seedAdminUser } from "./seed-admin";
import { seedRestaurantOwner } from "./seed-restaurant";
import { seedWilsonPizza } from "./seed-wilson-pizza";
import { seedDriver } from "./seed-driver";

export async function seedDatabase() {
  try {
    console.log("[Seed] Starting consolidated seed process...");
    
    // 1. Seed Wilson Pizza restaurant first (needed by owner, admin, and driver)
    await seedWilsonPizza();
    
    // 2. Seed restaurant owner for Wilson Pizza
    await seedRestaurantOwner();
    
    // 3. Seed admin user (platform_admin role) linked to Wilson Pizza
    await seedAdminUser();
    
    // 4. Seed driver for Wilson Pizza
    await seedDriver();
    
    console.log("[Seed] ✅ All seeds completed successfully - Owner, Admin, and Driver all linked to Wilson Pizza");
  } catch (error) {
    console.error("[Seed] Error during seeding:", error);
    throw error;
  }
}
