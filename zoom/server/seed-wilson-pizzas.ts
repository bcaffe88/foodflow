import { db } from "./db"
import { tenants, categories, pizzaFlavors, products, productFlavors } from "@shared/schema"
import { eq } from "drizzle-orm"

async function seedPizzas() {
  try {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, "wilson-pizza")).limit(1)
    if (!tenant) { console.log("✅ Tenant seeding skipped (for Railway)"); return; }

    console.log("🍕 Seeding Wilson Pizzas...")

    // Pizzas Salgadas category
    const [salgadaCat] = await db.insert(categories).values({
      tenantId: tenant.id, name: "Pizzas Salgadas", slug: "salgadas", displayOrder: 1,
    }).returning()

    // Flavors
    const flavorsData = [
      { name: "Carne de Sol", price: "60.00" },
      { name: "Calabresa", price: "65.00" },
      { name: "Frango Defumado", price: "75.00" },
      { name: "Mussarela", price: "54.00" },
      { name: "Chocolate com Morango", price: "54.00" },
      { name: "Banana Nevada", price: "54.00" },
    ]

    const flavors = await Promise.all(flavorsData.map(f => 
      db.insert(pizzaFlavors).values({
        tenantId: tenant.id, name: f.name, basePrice: f.price, isAvailable: true
      }).returning()
    ))

    // Products
    const products_data = [
      { name: "Carne de Sol", cat: salgadaCat, flavors: [0] },
      { name: "Calabresa", cat: salgadaCat, flavors: [1] },
      { name: "Frango Defumado", cat: salgadaCat, flavors: [2] },
      { name: "Mussarela", cat: salgadaCat, flavors: [3] },
      { name: "Chocolate com Morango", cat: salgadaCat, flavors: [4] },
      { name: "Banana Nevada", cat: salgadaCat, flavors: [5] },
    ]

    for (const p of products_data) {
      const [prod] = await db.insert(products).values({
        tenantId: tenant.id, categoryId: p.cat.id, name: p.name, description: `${p.name}`,
        price: "50.00", image: "https://via.placeholder.com/200", isCombination: true, maxFlavors: 4,
        pricesBySize: { pequena: "30.00", media: "38.00", grande: "50.00", super: "60.00" }
      }).returning()

      for (const fi of p.flavors) {
        await db.insert(productFlavors).values({
          productId: prod.id, flavorId: flavors[fi][0].id
        }).onConflictDoNothing()
      }
    }

    console.log("✅ 6 pizzas seeded!")
  } catch (e) {
    console.log("⚠️ Seed error (expected on Railway):", (e as any).message?.substring(0, 50))
  }
}

seedPizzas()
