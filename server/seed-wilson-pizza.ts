import { db } from "./db";
import { tenants, categories, products } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedWilsonPizza() {
  try {
    // Check if Wilson Pizza already exists
    let existing = await db.select().from(tenants).where(eq(tenants.slug, "wilson-pizza")).limit(1).then((r: any) => r[0]);

    if (existing) {
      console.log("[Seed] Wilson Pizza restaurant already exists with ID:", existing.id);
      
      // Check if it has products
      const productCount = await db.select().from(products).where(eq(products.tenantId, existing.id)).limit(1);
      if (productCount.length > 0) {
        console.log("[Seed] Wilson Pizza has products, skipping");
        return;
      }
      console.log("[Seed] Adding products to existing Wilson Pizza restaurant");
    }

    // Create Wilson Pizza tenant if it doesn't exist
    const tenant = existing || await db.insert(tenants).values({
      name: "Wilson Pizzaria",
      slug: "wilson-pizza",
      description: "As melhores pizzas de Ouricuri! Tradicionais, massas, pastéis e muito mais. Qualidade e sabor em cada pedido.",
      phone: "+5587999480699",
      address: "Ouricuri, PE",
      commissionPercentage: "15.00",
      isActive: true,
    } as any).returning().then((r: any) => r[0]);

    // Create categories
    const catSalgadas = await db.insert(categories).values({
      tenantId: tenant.id,
      name: "Pizzas Salgadas",
      slug: "salgadas",
      displayOrder: 1,
    } as any).returning().then((r: any) => r[0]);

    const catDoces = await db.insert(categories).values({
      tenantId: tenant.id,
      name: "Pizzas Doces",
      slug: "doces",
      displayOrder: 2,
    } as any).returning().then((r: any) => r[0]);

    const catMassas = await db.insert(categories).values({
      tenantId: tenant.id,
      name: "Massas",
      slug: "massas",
      displayOrder: 3,
    } as any).returning().then((r: any) => r[0]);

    const catPasteis = await db.insert(categories).values({
      tenantId: tenant.id,
      name: "Pastéis de Forno",
      slug: "pasteis",
      displayOrder: 4,
    } as any).returning().then((r: any) => r[0]);

    const catLasanhas = await db.insert(categories).values({
      tenantId: tenant.id,
      name: "Lasanhas",
      slug: "lasanhas",
      displayOrder: 5,
    } as any).returning().then((r: any) => r[0]);

    const catCalzones = await db.insert(categories).values({
      tenantId: tenant.id,
      name: "Calzones",
      slug: "calzones",
      displayOrder: 6,
    } as any).returning().then((r: any) => r[0]);

    const catPetiscos = await db.insert(categories).values({
      tenantId: tenant.id,
      name: "Petiscos",
      slug: "petiscos",
      displayOrder: 7,
    } as any).returning().then((r: any) => r[0]);

    const catBebidas = await db.insert(categories).values({
      tenantId: tenant.id,
      name: "Bebidas",
      slug: "bebidas",
      displayOrder: 8,
    } as any).returning().then((r: any) => r[0]);

    // Insert products - PIZZAS SALGADAS (Top 20 mais vendidas)
    const productsData = [
      // SALGADAS
      { categoryId: catSalgadas.id, name: "Costela", description: "Costela desfiada, cebola, creme cheese, mussarela e barbecue.", price: "45.00" },
      { categoryId: catSalgadas.id, name: "Calabresa Especial", description: "Molho de tomate, calabresa fatiada, mussarela, creme cheese, barbecue, orégano e azeitonas.", price: "42.00" },
      { categoryId: catSalgadas.id, name: "Carne de Sol", description: "Molho de tomate, carne de sol desfiada, cebola fatiada, mussarela, orégano e azeitonas.", price: "44.00" },
      { categoryId: catSalgadas.id, name: "À Moda do Chefe", description: "Molho de tomate, lombo canadense, bacon, mussarela, champignon, orégano e azeitonas.", price: "38.00" },
      { categoryId: catSalgadas.id, name: "Frango com Catupiry", description: "Molho de tomate, frango desfiado, catupiry, mussarela, orégano e azeitonas.", price: "42.00" },
      { categoryId: catSalgadas.id, name: "4 Queijos", description: "Molho de tomate, mussarela, provolone, catupiry, parmesão, orégano e azeitonas.", price: "41.00" },
      { categoryId: catSalgadas.id, name: "Camarão", description: "Molho de tomate, mussarela, filé de camarão, orégano e azeitonas.", price: "45.00" },
      { categoryId: catSalgadas.id, name: "Frango Bolonhesa", description: "Molho de tomate, frango desfiado, queijo parmesão, orégano e azeitonas.", price: "42.00" },
      { categoryId: catSalgadas.id, name: "Nordestina", description: "Molho de tomate, carne de charque desfiada, cebola, pimentão, pimenta de cheiro, orégano e azeitonas.", price: "42.00" },
      { categoryId: catSalgadas.id, name: "Caipira", description: "Molho de tomate, frango desfiado, milho verde, catupiry, orégano e azeitonas.", price: "42.00" },
      { categoryId: catSalgadas.id, name: "Toscana", description: "Molho de tomate, calabresa moída, cebola, mussarela, orégano e azeitonas.", price: "38.00" },
      { categoryId: catSalgadas.id, name: "À Moda da Casa", description: "Molho de tomate, frango desfiado, milho verde, mussarela, bacon, orégano e azeitonas.", price: "42.00" },
      { categoryId: catSalgadas.id, name: "Portuguesa", description: "Molho de tomate, presunto, ovos, cebola, mussarela, orégano e azeitonas.", price: "40.00" },
      { categoryId: catSalgadas.id, name: "Bacon", description: "Molho de tomate, mussarela, bacon, rodelas de tomate, orégano e azeitonas.", price: "42.00" },
      { categoryId: catSalgadas.id, name: "Marguerita", description: "Molho de tomate, mussarela, manjericão, rodelas de tomate, parmesão, orégano e azeitonas.", price: "38.00" },
      { categoryId: catSalgadas.id, name: "Calabresa", description: "Molho de tomate, calabresa, mussarela, orégano e azeitonas.", price: "38.00" },
      { categoryId: catSalgadas.id, name: "Mussarela", description: "Molho de tomate, mussarela, rodelas de tomate, orégano e azeitonas.", price: "38.00" },
      { categoryId: catSalgadas.id, name: "Bauru", description: "Molho de tomate, presunto, mussarela, rodelas de tomate, orégano e azeitonas.", price: "38.00" },
      { categoryId: catSalgadas.id, name: "Vegetariana", description: "Molho de tomate, mussarela, palmito, tomate fatiado, pimentão, champignon, manjericão, orégano e azeitonas.", price: "40.00" },
      { categoryId: catSalgadas.id, name: "Pepperone", description: "Molho de tomate, mussarela, salaminho tipo peperone, parmesão, orégano e azeitonas.", price: "38.00" },

      // DOCES
      { categoryId: catDoces.id, name: "Chocolate com Morango", description: "Chocolate com morango.", price: "35.00" },
      { categoryId: catDoces.id, name: "Banana Nevada", description: "Banana com canela, creme de leite e chocolate branco com borda de doce de leite.", price: "35.00" },
      { categoryId: catDoces.id, name: "Cartola", description: "Mussarela, catupiry, banana fatiada, açúcar e canela com borda de doce de leite.", price: "35.00" },
      { categoryId: catDoces.id, name: "Romeu e Julieta", description: "Mussarela coberta com fatia de goiabada, com borda de doce de leite.", price: "35.00" },
      { categoryId: catDoces.id, name: "Dois Amores", description: "Chocolate branco e chocolate de avelã com borda de doce de leite.", price: "35.00" },

      // MASSAS
      { categoryId: catMassas.id, name: "Espaguete", description: "Serve 1 pessoa. Monte sua massa escolhendo molho e até 6 ingredientes.", price: "26.00" },
      { categoryId: catMassas.id, name: "Parafuso (Penne)", description: "Serve 1 pessoa. Monte sua massa escolhendo molho e até 6 ingredientes.", price: "26.00" },
      { categoryId: catMassas.id, name: "Penne", description: "Serve 1 pessoa. Monte sua massa escolhendo molho e até 6 ingredientes.", price: "26.00" },
      { categoryId: catMassas.id, name: "Rigatoni", description: "Serve 1 pessoa. Monte sua massa escolhendo molho e até 6 ingredientes.", price: "26.00" },

      // PASTÉIS
      { categoryId: catPasteis.id, name: "Pastel de Queijo", description: "Pastel crocante recheado com queijo derretido.", price: "15.00" },
      { categoryId: catPasteis.id, name: "Pastel de Carne", description: "Pastel crocante recheado com carne moída e temperos.", price: "15.00" },
      { categoryId: catPasteis.id, name: "Pastel de Frango", description: "Pastel crocante recheado com frango desfiado.", price: "15.00" },
      { categoryId: catPasteis.id, name: "Pastel de Calabresa", description: "Pastel crocante recheado com calabresa e queijo.", price: "15.00" },
      { categoryId: catPasteis.id, name: "Pastel de Presunto", description: "Pastel crocante recheado com presunto e queijo.", price: "15.00" },
      { categoryId: catPasteis.id, name: "Pastel de Espinafre", description: "Pastel crocante recheado com espinafre e queijo.", price: "15.00" },
      { categoryId: catPasteis.id, name: "Pastel de Brócolis", description: "Pastel crocante recheado com brócolis e queijo.", price: "15.00" },
      { categoryId: catPasteis.id, name: "Pastel Mix", description: "Pastel crocante com mix de recheios deliciosos.", price: "16.00" },

      // LASANHAS
      { categoryId: catLasanhas.id, name: "Lasanha à Bolonhesa", description: "Lasanha caseira com molho bolonhesa, mussarela e parmesão.", price: "32.00" },
      { categoryId: catLasanhas.id, name: "Lasanha 4 Queijos", description: "Lasanha caseira com 4 tipos de queijo derretido.", price: "32.00" },
      { categoryId: catLasanhas.id, name: "Lasanha de Frango", description: "Lasanha caseira com frango desfiado e molho branco.", price: "32.00" },
      { categoryId: catLasanhas.id, name: "Lasanha de Brócolis", description: "Lasanha caseira com brócolis, molho branco e queijo.", price: "32.00" },

      // CALZONES
      { categoryId: catCalzones.id, name: "Calzone Calabresa", description: "Pizza fechada recheada com calabresa, mussarela e cebola.", price: "42.00" },
      { categoryId: catCalzones.id, name: "Calzone Mussarela", description: "Pizza fechada recheada com mussarela fresca e orégano.", price: "38.00" },
      { categoryId: catCalzones.id, name: "Calzone Frango", description: "Pizza fechada recheada com frango desfiado e catupiry.", price: "42.00" },
      { categoryId: catCalzones.id, name: "Calzone 4 Queijos", description: "Pizza fechada recheada com mix de 4 queijos.", price: "42.00" },
      { categoryId: catCalzones.id, name: "Calzone Portuguesa", description: "Pizza fechada recheada com presunto, ovo, cebola e mussarela.", price: "40.00" },
      { categoryId: catCalzones.id, name: "Calzone Costela", description: "Pizza fechada recheada com costela desfiada e creme cheese.", price: "45.00" },

      // PETISCOS
      { categoryId: catPetiscos.id, name: "Asinhas de Frango", description: "Asinhas de frango temperadas e assadas na brasa.", price: "28.00" },
      { categoryId: catPetiscos.id, name: "Bolinha de Queijo", description: "Bolinhas crocantes de queijo derretido por dentro.", price: "24.00" },
      { categoryId: catPetiscos.id, name: "Batata Frita", description: "Batata frita crocante e saborosa.", price: "18.00" },
      { categoryId: catPetiscos.id, name: "Aros de Cebola", description: "Aros de cebola empanados e fritos até ficar crocante.", price: "20.00" },
      { categoryId: catPetiscos.id, name: "Linguiça Grelhada", description: "Linguiça fina grelhada e temperada.", price: "26.00" },
      { categoryId: catPetiscos.id, name: "Cubos de Queijo", description: "Cubos de queijo empanados e fritos.", price: "22.00" },

      // BEBIDAS
      { categoryId: catBebidas.id, name: "Refrigerante 2L", description: "Refrigerante gelado (Coca-Cola, Guaraná ou Fanta).", price: "12.00" },
      { categoryId: catBebidas.id, name: "Suco Natural", description: "Suco natural fresco de frutas da estação.", price: "10.00" },
      { categoryId: catBebidas.id, name: "Água", description: "Água mineral geladinha.", price: "3.00" },
      { categoryId: catBebidas.id, name: "Cerveja 350ml", description: "Cerveja gelada importada ou local.", price: "8.00" },
      { categoryId: catBebidas.id, name: "Chopp 1L", description: "Chopp gelado direto do barril.", price: "25.00" },
    ];

    // Insert all products
    for (const product of productsData) {
      await db.insert(products).values({
        ...product,
        tenantId: tenant.id,
        isAvailable: true,
      } as any);
    }

    console.log(`[Seed] ✅ Wilson Pizzaria seeded successfully with ${productsData.length} products!`);
  } catch (error) {
    console.error("[Seed] Error seeding Wilson Pizza:", error);
    throw error;
  }
}
