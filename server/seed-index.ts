// Consolidated seed file - runs all database seeds on startup
import { seedAdminUser } from "./seed-admin";
import { seedRestaurantOwner } from "./seed-restaurant";
import { seedWilsonPizza } from "./seed-wilson-pizza";
import { seedDriver } from "./seed-driver";
import { seedCustomer } from "./seed-customer";

export async function seedDatabase() {
  try {
    console.log("[Seed] Starting consolidated seed process...");
    
    // 1. Seed Wilson Pizza restaurant first (needed by owner, admin, driver, and customer)
    await seedWilsonPizza();
    
    // 2. Seed restaurant owner for Wilson Pizza
    await seedRestaurantOwner();
    
    // 3. Seed admin user (platform_admin role) linked to Wilson Pizza
    await seedAdminUser();
    
    // 4. Seed driver for Wilson Pizza
    await seedDriver();
    
    // 5. Seed customer for Wilson Pizza
    await seedCustomer();
    
    console.log("[Seed] ✅ All seeds completed successfully - Owner, Admin, Driver, and Customer all linked to Wilson Pizza");
  } catch (error) {
    console.error("[Seed] Error during seeding:", error);
    throw error;
  }
}
