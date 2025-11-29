import { db } from "./db";
import { promotions, tenants } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedPromotions() {
  try {
    if (!db.select) return;

    // Get Wilson Pizza tenant
    const wilsonTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, "wilson-pizza"))
      .limit(1)
      .then((r: any) => r[0]);

    if (!wilsonTenant) {
      console.log("[Seed] Wilson Pizza restaurant not found");
      return;
    }

    // Check existing promotions
    const existing = await db
      .select()
      .from(promotions)
      .where(eq(promotions.tenantId, wilsonTenant.id))
      .limit(1)
      .then((r: any) => r[0]);

    if (existing) {
      console.log("[Seed] Promotions already exist for Wilson Pizza");
      return;
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Create sample promotions
    const promoData = [
      {
        tenantId: wilsonTenant.id,
        code: "PIZZAMANIA",
        description: "15% OFF em qualquer pizza",
        discountType: "percentage",
        discountValue: "15.00",
        maxUses: 100,
        currentUses: 0,
        minOrderValue: "30.00",
        isActive: true,
        startDate,
        endDate,
      },
      {
        tenantId: wilsonTenant.id,
        code: "WELCOME50",
        description: "R$ 50 OFF na primeira compra",
        discountType: "fixed",
        discountValue: "50.00",
        maxUses: 50,
        currentUses: 0,
        minOrderValue: "100.00",
        isActive: true,
        startDate,
        endDate,
      },
      {
        tenantId: wilsonTenant.id,
        code: "FRETEGRATIS",
        description: "Frete grátis acima de R$ 150",
        discountType: "fixed",
        discountValue: "15.00",
        maxUses: 200,
        currentUses: 0,
        minOrderValue: "150.00",
        isActive: true,
        startDate,
        endDate,
      },
      {
        tenantId: wilsonTenant.id,
        code: "DUPLA10",
        description: "10% OFF em combos",
        discountType: "percentage",
        discountValue: "10.00",
        maxUses: 150,
        currentUses: 0,
        minOrderValue: "50.00",
        isActive: true,
        startDate,
        endDate,
      },
    ];

    await db.insert(promotions).values(promoData as any);
    console.log("[Seed] ✅ Promotions seeded for Wilson Pizza");
  } catch (error) {
    console.error("[Seed] Promotions seeding error:", error);
    if (process.env.NODE_ENV === "development") {
      return;
    }
  }
}
