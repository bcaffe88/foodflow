import { db } from "./db"
import { tenants, categories, pizzaFlavors, products, productFlavors } from "@shared/schema"
import { eq } from "drizzle-orm"

const WILSON_TENANT_SLUG = "wilson-pizza"

const FLAVORS = [
  // SALGADAS
  { name: "Carne de Sol", price: "60.00" },
  { name: "À Moda do Chefe", price: "75.00" },
  { name: "Calabresa", price: "65.00" },
  { name: "Peperone", price: "60.00" },
  { name: "Camarão", price: "80.00" },
  { name: "Frango Defumado", price: "75.00" },
  { name: "Siciliana", price: "70.00" },
  { name: "Nordestina", price: "80.00" },
  { name: "Bacon", price: "70.00" },
  { name: "Vegetariana", price: "60.00" },
  { name: "Caipira", price: "73.00" },
  { name: "Toscana", price: "60.00" },
  { name: "4 Queijos", price: "62.00" },
  { name: "Mussarela", price: "54.00" },
  { name: "Margherita", price: "55.00" },
  
  // DOCES
  { name: "Chocolate com Morango", price: "54.00" },
  { name: "Banana Nevada", price: "54.00" },
  { name: "Cartola", price: "54.00" },
  { name: "Romeu e Julieta", price: "54.00" },
  { name: "Dois Amores", price: "54.00" },
]

export async function seedPizzas() {
  try {
    // Find Wilson tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, WILSON_TENANT_SLUG))
      .limit(1)

    if (!tenant) {
      console.log(`❌ Tenant ${WILSON_TENANT_SLUG} não encontrado`)
      return
    }

    console.log(`✅ Encontrado tenant: ${tenant.name}`)

    // Create flavors
    console.log("\n📝 Criando sabores...")
    const createdFlavors = await Promise.all(
      FLAVORS.map((flavor) =>
        db
          .insert(pizzaFlavors)
          .values({
            tenantId: tenant.id,
            name: flavor.name,
            basePrice: flavor.price,
            isAvailable: true,
          })
          .returning()
      )
    )

    console.log(`✅ ${createdFlavors.length} sabores criados`)

    // Create categories
    console.log("\n📝 Criando categorias...")
    const categories_data = [
      { name: "Pizzas Salgadas", slug: "pizzas-salgadas", order: 1 },
      { name: "Pizzas Doces", slug: "pizzas-doces", order: 2 },
      { name: "Bordas", slug: "bordas", order: 3 },
    ]

    const createdCategories = await Promise.all(
      categories_data.map((cat) =>
        db
          .insert(categories)
          .values({
            tenantId: tenant.id,
            name: cat.name,
            slug: cat.slug,
            displayOrder: cat.order,
          })
          .returning()
      )
    )

    console.log(`✅ ${createdCategories.length} categorias criadas`)

    // Get categories by slug
    const salgadasCat = createdCategories[0]
    const docesCat = createdCategories[1]
    const bordasCat = createdCategories[2]

    // Create pizza products (combination pizzas)
    console.log("\n🍕 Criando produtos de pizza...")

    const pizzaProducts = [
      // Salgadas
      {
        name: "Carne de Sol",
        desc: "Molho de tomate, carne de sol desfiada, cebola",
        cat: salgadasCat,
        flavors: ["Carne de Sol"],
      },
      {
        name: "À Moda do Chefe",
        desc: "Molho de tomate, frango, bacon, mussarela",
        cat: salgadasCat,
        flavors: ["À Moda do Chefe"],
      },
      {
        name: "Calabresa",
        desc: "Molho de tomate, calabresa miolos, cebola",
        cat: salgadasCat,
        flavors: ["Calabresa"],
      },
      {
        name: "4 Queijos",
        desc: "Molho de tomate, mussarela, gorgonzola, parmesão",
        cat: salgadasCat,
        flavors: ["4 Queijos"],
      },
      {
        name: "Mussarela",
        desc: "Molho de tomate, mussarela",
        cat: salgadasCat,
        flavors: ["Mussarela"],
      },

      // Doces
      {
        name: "Chocolate com Morango",
        desc: "Cobertura de chocolate com morango fresco",
        cat: docesCat,
        flavors: ["Chocolate com Morango"],
      },
      {
        name: "Banana Nevada",
        desc: "Banana com calda doce de leite",
        cat: docesCat,
        flavors: ["Banana Nevada"],
      },

      // Bordas
      {
        name: "Borda Catupiry",
        desc: "Catupiry, cheddar, chocolate",
        cat: bordasCat,
        flavors: ["Carne de Sol"], // dummy
      },
    ]

    for (const pizzaProduct of pizzaProducts) {
      const [newProduct] = await db
        .insert(products)
        .values({
          tenantId: tenant.id,
          categoryId: pizzaProduct.cat.id,
          name: pizzaProduct.name,
          description: pizzaProduct.desc,
          price: "50.00", // Default price
          image: "https://via.placeholder.com/200",
          isCombination: true,
          maxFlavors: pizzaProduct.name.toLowerCase().includes("borda") ? 1 : 4,
          pricesBySize: {
            pequena: "30.00",
            media: "38.00",
            grande: "50.00",
            super: "60.00",
          },
        })
        .returning()

      // Link flavors to product
      for (const flavorName of pizzaProduct.flavors) {
        const flavor = createdFlavors
          .flat()
          .find((f) => f[0]?.name === flavorName)?.[0]
        if (flavor) {
          await db
            .insert(productFlavors)
            .values({
              productId: newProduct.id,
              flavorId: flavor.id,
            })
            .onConflictDoNothing()
        }
      }

      console.log(`  ✅ Criado: ${newProduct.name}`)
    }

    console.log("\n🎉 Pizzas importadas com sucesso!")
  } catch (error) {
    console.error("❌ Erro ao seed pizzas:", error)
  }
}
