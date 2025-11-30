import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  restaurantClients,
  restaurantSettings,
  categories,
  products,
  productOptions,
  productOptionValues,
  orders,
  orderItems,
  deliveryDrivers,
  deliveryNotifications,
  commissions,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Restaurant queries
export async function getRestaurantSettings(restaurantId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(restaurantSettings)
    .where(eq(restaurantSettings.restaurantId, restaurantId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getActiveRestaurant() {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(restaurantClients)
    .where(eq(restaurantClients.isActive, true))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Category queries
export async function getCategories(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.restaurantId, restaurantId),
        eq(categories.isActive, true)
      )
    )
    .orderBy(categories.displayOrder);
}

// Product queries
export async function getProducts(restaurantId: number, categoryId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(products.restaurantId, restaurantId)];
  if (categoryId) {
    conditions.push(eq(products.categoryId, categoryId));
  }

  return await db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(products.displayOrder);
}

export async function getProductById(productId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getProductOptions(productId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(productOptions)
    .where(eq(productOptions.productId, productId))
    .orderBy(productOptions.displayOrder);
}

export async function getProductOptionValues(optionId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(productOptionValues)
    .where(eq(productOptionValues.optionId, optionId))
    .orderBy(productOptionValues.displayOrder);
}

// Order queries
export async function createOrder(orderData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(orders).values(orderData);
  return result;
}

export async function createOrderItem(itemData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(orderItems).values(itemData);
}

export async function getOrdersByRestaurant(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(orders)
    .where(eq(orders.restaurantId, restaurantId))
    .orderBy(desc(orders.createdAt));
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
}

export async function updateOrderStatus(orderId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(orders)
    .set({ status: status as any })
    .where(eq(orders.id, orderId));
}


// Developer functions
export async function getRestaurantClients() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(restaurantClients);
  return result;
}

export async function getCommissionStats() {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, totalCommissions: 0, totalOrders: 0 };

  const orderResults = await db.select().from(orders);
  const totalRevenue = orderResults.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orderResults.length;

  const clientResults = await db.select().from(restaurantClients);
  let totalCommissions = 0;

  for (const order of orderResults) {
    const client = clientResults.find(
      (c) => c.userId === order.restaurantId
    );
    if (client) {
      totalCommissions += Math.floor(
        (order.total * client.commissionRate) / 10000
      );
    }
  }

  return {
    totalRevenue,
    totalCommissions,
    totalOrders,
  };
}

export async function createRestaurantClient(data: {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  commissionPercentage: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const tempPassword = Math.random().toString(36).slice(-8);
  
  const result = await db.insert(restaurantClients).values({
    userId: 1,
    businessName: data.businessName,
    ownerName: data.ownerName,
    email: data.email,
    phone: data.phone,
    commissionRate: Math.floor(data.commissionPercentage * 100),
    isActive: true,
  });

  return { id: (result as any).insertId, tempPassword };
}

export async function updateClientCommission(
  clientId: number,
  percentage: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(restaurantClients)
    .set({ commissionRate: Math.floor(percentage * 100) })
    .where(eq(restaurantClients.id, clientId));

  return { success: true };
}


// Delivery Person functions
export async function createDeliveryPerson(data: {
  name: string;
  phone: string;
  cpf: string;
  vehicle: string;
  licensePlate: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(deliveryDrivers).values({
    userId: 1, // Placeholder
    fullName: data.name,
    phone: data.phone,
    vehicleType: "motorcycle",
    vehiclePlate: data.licensePlate,
    isActive: true,
    isAvailable: true,
  });

  return { id: (result as any).insertId };
}

export async function getDeliveryPersonProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(deliveryDrivers)
    .where(eq(deliveryDrivers.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getAvailableOrdersForDelivery() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.status, "ready"))
    .orderBy(desc(orders.createdAt));

  return result;
}

export async function getActiveDeliveries(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.driverId, userId))
    .orderBy(desc(orders.createdAt));

  return result;
}

export async function assignOrderToDelivery(orderId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(orders)
    .set({
      driverId: userId,
      status: "out_for_delivery",
    })
    .where(eq(orders.id, orderId));

  return { success: true };
}

export async function completeDelivery(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(orders)
    .set({ status: "delivered" })
    .where(eq(orders.id, orderId));

  return { success: true };
}


export async function updateRestaurantSettings(
  restaurantId: number,
  settings: {
    stripePublishableKey?: string;
    stripeSecretKey?: string;
    businessName?: string;
    phone?: string;
    address?: string;
    deliveryFee?: number;
    minimumOrder?: number;
    estimatedDeliveryTime?: string;
    useOwnDrivers?: boolean;
    usePlatformDrivers?: boolean;
    allowPickup?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  
  if (settings.stripePublishableKey !== undefined) updateData.stripePublishableKey = settings.stripePublishableKey;
  if (settings.stripeSecretKey !== undefined) updateData.stripeSecretKey = settings.stripeSecretKey;
  if (settings.businessName !== undefined) updateData.businessName = settings.businessName;
  if (settings.phone !== undefined) updateData.phone = settings.phone;
  if (settings.address !== undefined) updateData.address = settings.address;
  if (settings.deliveryFee !== undefined) updateData.deliveryFee = settings.deliveryFee;
  if (settings.minimumOrder !== undefined) updateData.minimumOrder = settings.minimumOrder;
  if (settings.estimatedDeliveryTime !== undefined) updateData.estimatedDeliveryTime = settings.estimatedDeliveryTime;
  if (settings.useOwnDrivers !== undefined) updateData.useOwnDrivers = settings.useOwnDrivers;
  if (settings.usePlatformDrivers !== undefined) updateData.usePlatformDrivers = settings.usePlatformDrivers;
  if (settings.allowPickup !== undefined) updateData.allowPickup = settings.allowPickup;

  await db
    .update(restaurantSettings)
    .set(updateData)
    .where(eq(restaurantSettings.restaurantId, restaurantId));

  return { success: true };
}


export async function createProduct(data: {
  restaurantId: number;
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(products).values({
    restaurantId: data.restaurantId,
    categoryId: data.categoryId,
    name: data.name,
    description: data.description || null,
    price: data.price,
    imageUrl: data.imageUrl || null,
    isAvailable: data.isAvailable ?? true,
  });

  return { id: (result as any).insertId };
}

export async function updateProduct(
  id: number,
  data: {
    restaurantId: number;
    categoryId: number;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    isAvailable: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(products)
    .set({
      restaurantId: data.restaurantId,
      categoryId: data.categoryId,
      name: data.name,
      description: data.description || null,
      price: data.price,
      imageUrl: data.imageUrl || null,
      isAvailable: data.isAvailable,
    })
    .where(eq(products.id, id));

  return { success: true };
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(products).where(eq(products.id, id));

  return { success: true };
}
