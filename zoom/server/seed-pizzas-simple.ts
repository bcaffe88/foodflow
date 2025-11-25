import { db } from "./db"
import { tenants, categories, pizzaFlavors, products, productFlavors } from "@shared/schema"
import { eq } from "drizzle-orm"

async function main() {
  try {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, "wilson-pizza")).limit(1)
    if (!tenant) return console.log("❌ Tenant not found")

    // Create categories
    const [docesCat] = await db.insert(categories).values({
      tenantId: tenant.id,
      name: "Pizzas Doces",
      slug: "pizzas-doces",
      displayOrder: 2,
    }).returning()

    // Create flavor
    const [flavorChoco] = await db.insert(pizzaFlavors).values({
      tenantId: tenant.id,
      name: "Chocolate com Morango",
      basePrice: "54.00",
      isAvailable: true,
    }).returning()

    // Create product
    const [product] = await db.insert(products).values({
      tenantId: tenant.id,
      categoryId: docesCat.id,
      name: "Pizza Chocolate com Morango",
      description: "Pizza doce com chocolate e morango fresco",
      price: "54.00",
      image: "https://via.placeholder.com/200",
      isCombination: true,
      maxFlavors: 2,
      pricesBySize: { pequena: "30.00", media: "38.00", grande: "50.00", super: "60.00" },
    }).returning()

    // Link flavor to product
    await db.insert(productFlavors).values({
      productId: product.id,
      flavorId: flavorChoco.id,
    }).onConflictDoNothing()

    console.log("✅ Pizza seeded successfully!")
  } catch (error) {
    console.error("❌ Error:", error)
  }
  process.exit(0)
}

main()
