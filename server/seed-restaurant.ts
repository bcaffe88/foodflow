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

    // First, create or get the tenant (restaurant)
    let tenant = await db.select().from(tenants).where(eq(tenants.slug, "wilson-pizza")).limit(1).then((r: any) => r[0]);
    
    if (!tenant) {
      const newTenant = await db.insert(tenants).values({
        name: "Wilson Pizzaria",
        slug: "wilson-pizza",
        description: "Pizzaria artesanal",
        city: "São Paulo",
        state: "SP",
        address: "Rua das Pizzas, 123",
        phone: "11999999999",
        whatsappPhone: "5511999999999",
        isActive: true,
      } as any).returning().then((r: any) => r[0]);
      
      tenant = newTenant;
      console.log("[Seed] Restaurant created:", tenant);
    }

    // Hash password
    const hashedPassword = await hash("wilson123", 10);

    // Create restaurant owner user
    const owner = await db.insert(users).values({
      email: "wilson@wilsonpizza.com",
      password: hashedPassword,
      name: "Wilson",
      phone: "11999999999",
      role: "restaurant_owner",
      tenantId: tenant.id,
      isActive: true,
    } as any).returning().then((r: any) => r[0]);

    console.log("[Seed] Restaurant owner created:", owner.email);
  } catch (error) {
    // Silently fail in development
    if (process.env.NODE_ENV === "development") {
      return;
    }
  }
}
