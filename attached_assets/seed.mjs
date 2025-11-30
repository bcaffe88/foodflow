import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  restaurantClients,
  restaurantSettings,
  categories,
  products,
  productOptions,
  productOptionValues,
} from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Starting seed...");

  try {
    // Create demo restaurant owner user
    const [restaurantOwner] = await db.insert(users).values({
      openId: "demo-restaurant-owner",
      name: "Demo Restaurant Owner",
      email: "restaurant@demo.com",
      role: "restaurant_owner",
      loginMethod: "demo",
    });

    console.log("✅ Created restaurant owner user");

    // Create demo restaurant client
    const [restaurant] = await db.insert(restaurantClients).values({
      userId: 1,
      businessName: "Sabor Express",
      ownerName: "Demo Restaurant Owner",
      phone: "87999480699",
      email: "restaurant@demo.com",
      commissionRate: 1000, // 10%
      isActive: true,
      logoUrl: "/logo.svg",
    });

    console.log("✅ Created restaurant client");

    // Create restaurant settings
    await db.insert(restaurantSettings).values({
      restaurantId: 1,
      logoUrl: "/logo.svg",
      bannerImages: JSON.stringify([
        "/products/burger1.jpg",
        "/products/pizza1.jpg",
        "/products/drink1.jpg",
      ]),
      primaryColor: "#EA1D2C",
      secondaryColor: "#00AA4B",
      whatsappNumber: "5587999480699",
      address: "Rua João Pessoa, 123 - Centro, Ouricuri - PE, 56200-000",
      openingHours: JSON.stringify({
        monday: { open: "18:00", close: "23:00" },
        tuesday: { open: "18:00", close: "23:00" },
        wednesday: { open: "18:00", close: "23:00" },
        thursday: { open: "18:00", close: "23:00" },
        friday: { open: "18:00", close: "00:00" },
        saturday: { open: "18:00", close: "00:00" },
        sunday: { open: "18:00", close: "23:00" },
      }),
      deliveryFee: 500, // R$ 5,00
      minimumOrder: 1500, // R$ 15,00
      isOpen: true,
      acceptingOrders: true,
      allowPickup: true,
      useOwnDrivers: false,
      usePlatformDrivers: true,
    });

    console.log("✅ Created restaurant settings");

    // Create categories
    const categoryData = [
      {
        restaurantId: 1,
        name: "Hambúrgueres",
        description: "Deliciosos hambúrgueres artesanais",
        imageUrl: "/products/burger1.jpg",
        displayOrder: 1,
        isActive: true,
      },
      {
        restaurantId: 1,
        name: "Pizzas",
        description: "Pizzas tradicionais e especiais",
        imageUrl: "/products/pizza1.jpg",
        displayOrder: 2,
        isActive: true,
      },
      {
        restaurantId: 1,
        name: "Bebidas",
        description: "Refrigerantes e sucos",
        imageUrl: "/products/drink1.jpg",
        displayOrder: 3,
        isActive: true,
      },
      {
        restaurantId: 1,
        name: "Acompanhamentos",
        description: "Batatas fritas e porções",
        imageUrl: "/products/fries1.jpg",
        displayOrder: 4,
        isActive: true,
      },
      {
        restaurantId: 1,
        name: "Sobremesas",
        description: "Doces e sorvetes",
        imageUrl: "/products/dessert1.jpg",
        displayOrder: 5,
        isActive: true,
      },
    ];

    for (const cat of categoryData) {
      await db.insert(categories).values(cat);
    }

    console.log("✅ Created categories");

    // Create products - Hambúrgueres
    const burgerProducts = [
      {
        restaurantId: 1,
        categoryId: 1,
        name: "X-Burger Clássico",
        description:
          "Hambúrguer artesanal 180g, queijo cheddar, alface, tomate e molho especial",
        price: 2500, // R$ 25,00
        imageUrl: "/products/burger1.jpg",
        isAvailable: true,
        preparationTime: 25,
        displayOrder: 1,
      },
      {
        restaurantId: 1,
        categoryId: 1,
        name: "X-Bacon",
        description:
          "Hambúrguer 180g, bacon crocante, queijo, cebola caramelizada e molho barbecue",
        price: 2800,
        imageUrl: "/products/burger2.jpg",
        isAvailable: true,
        preparationTime: 25,
        displayOrder: 2,
      },
      {
        restaurantId: 1,
        categoryId: 1,
        name: "X-Salada Premium",
        description:
          "Hambúrguer 180g, queijo, alface, tomate, cebola roxa, picles e maionese",
        price: 2700,
        imageUrl: "/products/burger3.jpg",
        isAvailable: true,
        preparationTime: 25,
        displayOrder: 3,
      },
      {
        restaurantId: 1,
        categoryId: 1,
        name: "X-Tudo",
        description:
          "Hambúrguer 180g, bacon, ovo, queijo, presunto, alface, tomate e molhos",
        price: 3200,
        imageUrl: "/products/burger4.jpg",
        isAvailable: true,
        preparationTime: 30,
        displayOrder: 4,
      },
    ];

    for (const product of burgerProducts) {
      await db.insert(products).values(product);
    }

    console.log("✅ Created burger products");

    // Create products - Pizzas
    const pizzaProducts = [
      {
        restaurantId: 1,
        categoryId: 2,
        name: "Pizza Margherita",
        description: "Molho de tomate, mussarela, tomate fresco e manjericão",
        price: 4500,
        imageUrl: "/products/pizza1.jpg",
        isAvailable: true,
        preparationTime: 35,
        displayOrder: 1,
      },
      {
        restaurantId: 1,
        categoryId: 2,
        name: "Pizza Calabresa",
        description: "Molho de tomate, mussarela, calabresa e cebola",
        price: 4800,
        imageUrl: "/products/pizza2.jpg",
        isAvailable: true,
        preparationTime: 35,
        displayOrder: 2,
      },
      {
        restaurantId: 1,
        categoryId: 2,
        name: "Pizza Portuguesa",
        description:
          "Molho de tomate, mussarela, presunto, ovos, cebola, azeitonas",
        price: 5200,
        imageUrl: "/products/pizza3.jpg",
        isAvailable: true,
        preparationTime: 35,
        displayOrder: 3,
      },
      {
        restaurantId: 1,
        categoryId: 2,
        name: "Pizza Quatro Queijos",
        description: "Molho branco, mussarela, provolone, gorgonzola e parmesão",
        price: 5500,
        imageUrl: "/products/pizza4.jpg",
        isAvailable: true,
        preparationTime: 35,
        displayOrder: 4,
      },
    ];

    for (const product of pizzaProducts) {
      await db.insert(products).values(product);
    }

    console.log("✅ Created pizza products");

    // Create products - Bebidas
    const drinkProducts = [
      {
        restaurantId: 1,
        categoryId: 3,
        name: "Coca-Cola 350ml",
        description: "Refrigerante Coca-Cola lata 350ml gelada",
        price: 500,
        imageUrl: "/products/drink1.jpg",
        isAvailable: true,
        preparationTime: 5,
        displayOrder: 1,
      },
      {
        restaurantId: 1,
        categoryId: 3,
        name: "Coca-Cola 2L",
        description: "Refrigerante Coca-Cola garrafa 2 litros",
        price: 1200,
        imageUrl: "/products/drink2.jpg",
        isAvailable: true,
        preparationTime: 5,
        displayOrder: 2,
      },
      {
        restaurantId: 1,
        categoryId: 3,
        name: "Suco Natural",
        description: "Suco natural de laranja, limão ou morango - 500ml",
        price: 800,
        imageUrl: "/products/drink3.jpg",
        isAvailable: true,
        preparationTime: 10,
        displayOrder: 3,
      },
    ];

    for (const product of drinkProducts) {
      await db.insert(products).values(product);
    }

    console.log("✅ Created drink products");

    // Create products - Acompanhamentos
    const sidesProducts = [
      {
        restaurantId: 1,
        categoryId: 4,
        name: "Batata Frita Pequena",
        description: "Porção pequena de batatas fritas crocantes",
        price: 1200,
        imageUrl: "/products/fries1.jpg",
        isAvailable: true,
        preparationTime: 15,
        displayOrder: 1,
      },
      {
        restaurantId: 1,
        categoryId: 4,
        name: "Batata Frita Grande",
        description: "Porção grande de batatas fritas crocantes",
        price: 2000,
        imageUrl: "/products/fries2.jpg",
        isAvailable: true,
        preparationTime: 15,
        displayOrder: 2,
      },
    ];

    for (const product of sidesProducts) {
      await db.insert(products).values(product);
    }

    console.log("✅ Created sides products");

    // Create products - Sobremesas
    const dessertProducts = [
      {
        restaurantId: 1,
        categoryId: 5,
        name: "Sorvete 2 Bolas",
        description: "Duas bolas de sorvete com cobertura a escolher",
        price: 1500,
        imageUrl: "/products/dessert1.jpg",
        isAvailable: true,
        preparationTime: 10,
        displayOrder: 1,
      },
      {
        restaurantId: 1,
        categoryId: 5,
        name: "Sundae Especial",
        description: "Sorvete com calda, chantilly e cerejas",
        price: 1800,
        imageUrl: "/products/dessert2.jpg",
        isAvailable: true,
        preparationTime: 10,
        displayOrder: 2,
      },
    ];

    for (const product of dessertProducts) {
      await db.insert(products).values(product);
    }

    console.log("✅ Created dessert products");

    // Create product options for burgers (size)
    const burgerSizeOption = await db.insert(productOptions).values({
      productId: 1,
      name: "Tamanho",
      type: "single",
      isRequired: true,
      displayOrder: 1,
    });

    await db.insert(productOptionValues).values([
      {
        optionId: 1,
        name: "Tradicional (180g)",
        priceModifier: 0,
        displayOrder: 1,
      },
      {
        optionId: 1,
        name: "Grande (250g)",
        priceModifier: 500,
        displayOrder: 2,
      },
    ]);

    // Create product options for burgers (extras)
    const burgerExtrasOption = await db.insert(productOptions).values({
      productId: 1,
      name: "Adicionais",
      type: "multiple",
      isRequired: false,
      displayOrder: 2,
    });

    await db.insert(productOptionValues).values([
      {
        optionId: 2,
        name: "Bacon Extra",
        priceModifier: 400,
        displayOrder: 1,
      },
      {
        optionId: 2,
        name: "Queijo Extra",
        priceModifier: 300,
        displayOrder: 2,
      },
      {
        optionId: 2,
        name: "Ovo",
        priceModifier: 200,
        displayOrder: 3,
      },
    ]);

    console.log("✅ Created product options");

    // Create pizza size options
    const pizzaSizeOption = await db.insert(productOptions).values({
      productId: 5,
      name: "Tamanho",
      type: "single",
      isRequired: true,
      displayOrder: 1,
    });

    await db.insert(productOptionValues).values([
      {
        optionId: 3,
        name: "Pequena (4 fatias)",
        priceModifier: -1000,
        displayOrder: 1,
      },
      {
        optionId: 3,
        name: "Média (6 fatias)",
        priceModifier: 0,
        displayOrder: 2,
      },
      {
        optionId: 3,
        name: "Grande (8 fatias)",
        priceModifier: 1000,
        displayOrder: 3,
      },
    ]);

    console.log("✅ Created pizza options");

    console.log("🎉 Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
