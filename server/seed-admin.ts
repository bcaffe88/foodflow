import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function seedAdminUser() {
  try {
    // Skip if db not available
    if (!db.select) {
      return;
    }
    
    // Check if admin already exists
    const existing = await db.select().from(users).where(eq(users.email, "admin@foodflow.com")).limit(1).then((r: any) => r[0]);
    if (existing) {
      return;
    }

    // Hash password
    const hashedPassword = await hash("Admin123!", 10);

    // Create admin user
    const admin = await db.insert(users).values({
      email: "admin@foodflow.com",
      password: hashedPassword,
      name: "Admin FoodFlow",
      phone: "11999999999",
      role: "platform_admin",
      isActive: true,
    } as any).returning().then((r: any) => r[0]);

  } catch (error) {
    // Silently fail in development
    if (process.env.NODE_ENV === "development") {
      return;
    }
  }
}
