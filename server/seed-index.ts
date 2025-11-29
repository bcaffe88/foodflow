// Consolidated seed file - runs all database seeds on startup
import { seedAdminUser } from "./seed-admin";
import { seedRestaurantOwner } from "./seed-restaurant";
import { seedWilsonPizza } from "./seed-wilson-pizza";

export async function seedDatabase() {
  try {
    console.log("[Seed] Starting consolidated seed process...");
    
    // 1. Seed admin user (platform_admin role)
    await seedAdminUser();
    
    // 2. Seed restaurant owner for Wilson Pizza
    await seedRestaurantOwner();
    
    // 3. Seed Wilson Pizza restaurant with categories & products
    await seedWilsonPizza();
    
    console.log("[Seed] ✅ All seeds completed successfully");
  } catch (error) {
    console.error("[Seed] Error during seeding:", error);
    throw error;
  }
}
