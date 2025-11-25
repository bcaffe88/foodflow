import { db } from "./db";
import { tenants, users, categories, products } from "@shared/schema";
import { hash } from "bcryptjs";

const SAMPLE_CATEGORIES = [
  { name: "Lanches", slug: "lanches", displayOrder: 1 },
  { name: "Pizzas", slug: "pizzas", displayOrder: 2 },
  { name: "Bebidas", slug: "bebidas", displayOrder: 3 },
  { name: "Sobremesas", slug: "sobremesas", displayOrder: 4 },
  { name: "Porções", slug: "porcoes", displayOrder: 5 },
  { name: "Saladas", slug: "saladas", displayOrder: 6 },
];

const SAMPLE_PRODUCTS = [
  // Lanches
  {
    name: "X-Burger Especial",
    description: "Hambúrguer artesanal 150g, queijo cheddar, alface, tomate e molho especial da casa",
    price: "25.90",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    category: "lanches",
  },
  {
    name: "X-Bacon Duplo",
    description: "Dois hambúrgueres, bacon crocante, queijo, cebola caramelizada e molho barbecue",
    price: "32.90",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop",
    category: "lanches",
  },
  {
    name: "X-Frango",
    description: "Filé de frango grelhado, queijo, alface, tomate e maionese",
    price: "23.90",
    image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=300&fit=crop",
    category: "lanches",
  },
  {
    name: "X-Salada",
    description: "Hambúrguer, queijo, alface, tomate, milho, ervilha e batata palha",
    price: "27.90",
    image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=300&fit=crop",
    category: "lanches",
  },
  // Pizzas
  {
    name: "Pizza Margherita",
    description: "Molho de tomate italiano, mussarela de búfala, manjericão fresco e azeite",
    price: "45.00",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop",
    category: "pizzas",
  },
  {
    name: "Pizza Calabresa",
    description: "Calabresa especial, cebola, azeitonas, mussarela e orégano",
    price: "48.00",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
    category: "pizzas",
  },
  {
    name: "Pizza Quatro Queijos",
    description: "Mussarela, gorgonzola, provolone, parmesão e molho branco",
    price: "52.00",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop",
    category: "pizzas",
  },
  {
    name: "Pizza Portuguesa",
    description: "Presunto, ovos, cebola, azeitonas, mussarela e orégano",
    price: "50.00",
    image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400&h=300&fit=crop",
    category: "pizzas",
  },
  // Bebidas
  {
    name: "Coca-Cola 2L",
    description: "Refrigerante Coca-Cola garrafa 2 litros gelada",
    price: "12.00",
    image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop",
    category: "bebidas",
  },
  {
    name: "Suco Natural Laranja",
    description: "Suco de laranja natural 500ml, sem açúcar",
    price: "8.00",
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop",
    category: "bebidas",
  },
  {
    name: "Água Mineral 500ml",
    description: "Água mineral sem gás gelada",
    price: "3.50",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
    category: "bebidas",
  },
  {
    name: "Guaraná 2L",
    description: "Refrigerante Guaraná garrafa 2 litros gelado",
    price: "10.00",
    image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=300&fit=crop",
    category: "bebidas",
  },
  // Sobremesas
  {
    name: "Brownie com Sorvete",
    description: "Brownie de chocolate quente com sorvete de baunilha e calda",
    price: "18.00",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop",
    category: "sobremesas",
  },
  {
    name: "Petit Gateau",
    description: "Bolinho de chocolate com recheio cremoso e sorvete",
    price: "22.00",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop",
    category: "sobremesas",
  },
  {
    name: "Pudim de Leite",
    description: "Pudim de leite condensado caseiro com calda de caramelo",
    price: "12.00",
    image: "https://images.unsplash.com/photo-1551222120-6c1bf0eb4d81?w=400&h=300&fit=crop",
    category: "sobremesas",
  },
  // Porções
  {
    name: "Batata Frita Grande",
    description: "Porção grande de batata frita crocante",
    price: "18.00",
    image: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=400&h=300&fit=crop",
    category: "porcoes",
  },
  {
    name: "Onion Rings",
    description: "Anéis de cebola empanados e fritos",
    price: "20.00",
    image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop",
    category: "porcoes",
  },
  // Saladas
  {
    name: "Salada Caesar",
    description: "Alface, croutons, parmesão e molho caesar",
    price: "24.00",
    image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop",
    category: "saladas",
  },
];

export async function seedDatabase() {

  // Create a demo tenant (restaurant)
  const [demoTenant] = await db
    .insert(tenants)
    .values({
      name: "Restaurante Demo",
      slug: "demo",
      description: "Restaurante de demonstração com cardápio completo",
      phone: "(87) 99999-9999",
      address: "Rua Principal, 123 - Centro",
      commissionPercentage: "10.00",
    })
    .returning();


  // Create demo restaurant owner
  const hashedPassword = await hash("demo123", 10);
  const [owner] = await db
    .insert(users)
    .values({
      email: "owner@demo.com",
      password: hashedPassword,
      name: "Dono do Restaurante",
      phone: "(87) 99999-9999",
      role: "restaurant_owner",
      tenantId: demoTenant.id,
    })
    .returning();


  // Create platform admin
  const [admin] = await db
    .insert(users)
    .values({
      email: "admin@platform.com",
      password: hashedPassword,
      name: "Administrador da Plataforma",
      role: "platform_admin",
    })
    .returning();


  // Create categories
  const categoryMap = new Map<string, string>();
  
  for (const cat of SAMPLE_CATEGORIES) {
    const [category] = await db
      .insert(categories)
      .values({
        ...cat,
        tenantId: demoTenant.id,
      })
      .returning();
    categoryMap.set(cat.slug, category.id);
  }


  // Create products
  let productsCreated = 0;
  for (const prod of SAMPLE_PRODUCTS) {
    const categoryId = categoryMap.get(prod.category);
    if (categoryId) {
      await db.insert(products).values({
        name: prod.name,
        description: prod.description,
        price: prod.price,
        image: prod.image,
        tenantId: demoTenant.id,
        categoryId,
        isAvailable: true,
      });
      productsCreated++;
    }
  }


}

// Run seed if called directly
seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
