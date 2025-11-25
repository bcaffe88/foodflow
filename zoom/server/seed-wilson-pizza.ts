import { db } from "./db";
import { tenants, categories, products } from "@shared/schema";
import { eq } from "drizzle-orm";

const generateId = () => Math.random().toString(36).substr(2, 9);
const WILSON_PIZZA_ID = "wilson-pizza-" + Date.now();

export async function seedWilsonPizza() {
  try {
    // Check if Wilson Pizza already exists
    const existing = await db.select().from(tenants).where(eq(tenants.slug, "wilsonpizza")).limit(1).then(r => r[0]);
    if (existing) {
      return;
    }

    // Create Wilson Pizza tenant
    const tenant = await db.insert(tenants).values({
      id: WILSON_PIZZA_ID,
      name: "Wilson Pizza",
      slug: "wilsonpizza",
      description: "As melhores pizzas da cidade! Tradicional, saudável e com ingredientes de qualidade.",
      phone: "551133334444",
      address: "Rua das Pizzas, 123 - São Paulo, SP",
      commissionPercentage: "15.00",
      isActive: true,
    } as any).returning().then(r => r[0]);


    // Insert categories directly
    const pizzasTraditionals = await db.insert(categories).values({
      tenantId: WILSON_PIZZA_ID,
      name: "Pizzas Tradicionais",
      slug: "pizzas-tradicionais",
      displayOrder: 1,
    } as any).returning().then(r => r[0]);

    const pizzasDoces = await db.insert(categories).values({
      tenantId: WILSON_PIZZA_ID,
      name: "Pizzas Doces",
      slug: "pizzas-doces",
      displayOrder: 2,
    } as any).returning().then(r => r[0]);

    const massas = await db.insert(categories).values({
      tenantId: WILSON_PIZZA_ID,
      name: "Massas",
      slug: "massas",
      displayOrder: 3,
    } as any).returning().then(r => r[0]);

    const apetitivos = await db.insert(categories).values({
      tenantId: WILSON_PIZZA_ID,
      name: "Apetitivos",
      slug: "apetitivos",
      displayOrder: 4,
    } as any).returning().then(r => r[0]);

    const bebidas = await db.insert(categories).values({
      tenantId: WILSON_PIZZA_ID,
      name: "Bebidas",
      slug: "bebidas",
      displayOrder: 5,
    } as any).returning().then(r => r[0]);

    const sobremesas = await db.insert(categories).values({
      tenantId: WILSON_PIZZA_ID,
      name: "Sobremesas",
      slug: "sobremesas",
      displayOrder: 6,
    } as any).returning().then(r => r[0]);


    // Products data
    const productsToInsert = [
      // Pizzas Tradicionais
      { categoryId: pizzasTraditionals?.id, name: "Margherita", description: "Molho de tomate, mussarela de búfala, tomate fresco e manjericão", price: "45.00", image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&h=400&fit=crop" },
      { categoryId: pizzasTraditionals?.id, name: "Calabresa", description: "Calabresa especial, cebola, azeitonas, mussarela e orégano", price: "48.00", image: "https://images.unsplash.com/photo-1628840042765-356cda07f0ff?w=600&h=400&fit=crop" },
      { categoryId: pizzasTraditionals?.id, name: "Quatro Queijos", description: "Mussarela, gorgonzola, provolone, parmesão e molho branco", price: "52.00", image: "https://images.unsplash.com/photo-1557003996-380b9dd62dd3?w=600&h=400&fit=crop" },
      { categoryId: pizzasTraditionals?.id, name: "Frango com Catupiry", description: "Peito de frango desfiado, catupiry cremoso e milho verde", price: "50.00", image: "https://images.unsplash.com/photo-1599599810694-b3b5ef35d475?w=600&h=400&fit=crop" },
      { categoryId: pizzasTraditionals?.id, name: "Romeu e Julieta", description: "Goiabada cremosa e queijo mussarela tradicional", price: "46.00", image: "https://images.unsplash.com/photo-1608050545552-54f8ee496020?w=600&h=400&fit=crop" },
      { categoryId: pizzasTraditionals?.id, name: "Portuguesa", description: "Presunto, ovo, cebola, pimentão, azeitonas e mussarela", price: "49.00", image: "https://images.unsplash.com/photo-1628840042765-356cda07f0ff?w=600&h=400&fit=crop" },
      { categoryId: pizzasTraditionals?.id, name: "Moda da Casa", description: "Presunto, frango, calabresa, bacon, ovos e cebola", price: "55.00", image: "https://images.unsplash.com/photo-1595521624637-48d4b8e1c6e3?w=600&h=400&fit=crop" },
      { categoryId: pizzasTraditionals?.id, name: "Vegetariana", description: "Brócolis, cenoura, cebola, pimentão e azeitonas verdes", price: "44.00", image: "https://images.unsplash.com/photo-1571407-615cef97baa9?w=600&h=400&fit=crop" },

      // Pizzas Doces
      { categoryId: pizzasDoces?.id, name: "Brigadeiro com Leite Ninho", description: "Base doce com brigadeiro e leite ninho em pó", price: "42.00", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop" },
      { categoryId: pizzasDoces?.id, name: "Chocolate com Morango", description: "Chocolate derretido com morangos frescos", price: "48.00", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop" },
      { categoryId: pizzasDoces?.id, name: "Banana com Canela", description: "Banana em fatias com açúcar e canela", price: "38.00", image: "https://images.unsplash.com/photo-1595521624637-48d4b8e1c6e3?w=600&h=400&fit=crop" },

      // Massas
      { categoryId: massas?.id, name: "Macarrão à Bolonhesa", description: "Macarrão integral com molho à bolonhesa caseiro", price: "42.00", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop" },
      { categoryId: massas?.id, name: "Risoto de Frango", description: "Risoto cremoso com frango desfiado e sálvia", price: "45.00", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop" },
      { categoryId: massas?.id, name: "Fettuccini Carbonara", description: "Fettuccini com bacon, ovos e parmesão", price: "48.00", image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&h=400&fit=crop" },

      // Apetitivos
      { categoryId: apetitivos?.id, name: "Batata Frita com Cheddar", description: "Batata palha crocante coberta com molho cheddar quente", price: "18.00", image: "https://images.unsplash.com/photo-1599022176476-e1a9a8a0dfc7?w=600&h=400&fit=crop" },
      { categoryId: apetitivos?.id, name: "Pastel de Queijo", description: "Pastel crocante recheado com queijo derretido", price: "12.00", image: "https://images.unsplash.com/photo-1599022176476-e1a9a8a0dfc7?w=600&h=400&fit=crop" },
      { categoryId: apetitivos?.id, name: "Água de Banana", description: "Folhado crocante recheado de doce de leite e banana", price: "16.00", image: "https://images.unsplash.com/photo-1599022176476-e1a9a8a0dfc7?w=600&h=400&fit=crop" },

      // Bebidas
      { categoryId: bebidas?.id, name: "Coca-Cola 2L", description: "Refrigerante Coca-Cola 2 litros gelado", price: "10.00", image: "https://images.unsplash.com/photo-1554866585-56f4e13c8e13?w=600&h=400&fit=crop" },
      { categoryId: bebidas?.id, name: "Suco Natural Laranja", description: "Suco de laranja natural 500ml, sem açúcar", price: "8.00", image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&h=400&fit=crop" },
      { categoryId: bebidas?.id, name: "Chopp Brahma 1L", description: "Chopp Brahma gelado 1 litro", price: "28.00", image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&h=400&fit=crop" },

      // Sobremesas
      { categoryId: sobremesas?.id, name: "Brownie com Sorvete", description: "Brownie de chocolate quente com sorvete de baunilha", price: "18.00", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=400&fit=crop" },
      { categoryId: sobremesas?.id, name: "Pudim de Leite Condensado", description: "Pudim cremoso com calda de caramelo", price: "14.00", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop" },
      { categoryId: sobremesas?.id, name: "Pavê de Chocolate", description: "Pavê tradicional com biscoito, chocolate e leite condensado", price: "16.00", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop" },
      { categoryId: sobremesas?.id, name: "Sorvete de Baunilha", description: "Sorvete cremoso de baunilha premium 500ml", price: "12.00", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&h=400&fit=crop" },
    ];

    // Insert products
    for (const p of productsToInsert) {
      if (p.categoryId) {
        await db.insert(products).values({
          tenantId: WILSON_PIZZA_ID,
          categoryId: p.categoryId,
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          isAvailable: true,
        } as any);
      }
    }

  } catch (error) {
    console.error("Error seeding Wilson Pizza:", error);
  }
}
