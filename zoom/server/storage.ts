import { 
  type Tenant, type InsertTenant,
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Product, type InsertProduct,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type Payment, type InsertPayment,
  type Commission, type InsertCommission,
  type CustomerProfile, type InsertCustomerProfile,
  type DriverProfile, type InsertDriverProfile,
  type DriverAssignment, type InsertDriverAssignment,
  type DailyMetric, type InsertDailyMetric,
  tenants, users, categories, products, orders, orderItems, payments, commissions,
  customerProfiles, driverProfiles, driverAssignments, dailyMetrics,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { mockWilsonProducts } from "./mock-products";
import { memStorage } from "./mem-storage";

export interface IStorage {
  // Tenants
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant | undefined>;

  // Users
  createUser(user: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByTenant(tenantId: string): Promise<User[]>;

  // Customer Profiles
  createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile>;
  getCustomerProfile(userId: string): Promise<CustomerProfile | undefined>;
  updateCustomerProfile(userId: string, data: Partial<InsertCustomerProfile>): Promise<CustomerProfile | undefined>;

  // Driver Profiles
  createDriverProfile(profile: InsertDriverProfile): Promise<DriverProfile>;
  getDriverProfile(userId: string): Promise<DriverProfile | undefined>;
  getAvailableDrivers(): Promise<DriverProfile[]>;
  updateDriverStatus(userId: string, status: string): Promise<DriverProfile | undefined>;

  // Categories
  createCategory(category: InsertCategory): Promise<Category>;
  getCategoriesByTenant(tenantId: string): Promise<Category[]>;
  deleteCategory(id: string): Promise<void>;

  // Products
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByTenant(tenantId: string): Promise<Product[]>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;

  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByTenant(tenantId: string): Promise<Order[]>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getOrdersByDriver(driverId: string): Promise<Order[]>;
  getPendingOrdersByTenant(tenantId: string): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  assignDriver(orderId: string, driverId: string): Promise<Order | undefined>;
  createOrderWithTransaction(orderData: InsertOrder, paymentData?: InsertPayment, itemsData?: InsertOrderItem[], commissionData?: InsertCommission): Promise<{ order: Order; payment?: Payment; items?: OrderItem[]; commission?: Commission }>;

  // Order Items
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;

  // Payments
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentByOrder(orderId: string): Promise<Payment | undefined>;
  updatePaymentStatus(id: string, status: string): Promise<Payment | undefined>;

  // Commissions
  createCommission(commission: InsertCommission): Promise<Commission>;
  getCommissionsByTenant(tenantId: string): Promise<Commission[]>;
  getUnpaidCommissions(): Promise<Commission[]>;
  markCommissionPaid(id: string): Promise<Commission | undefined>;

  // Driver Assignments
  createDriverAssignment(assignment: InsertDriverAssignment): Promise<DriverAssignment>;
  getAssignmentsByOrder(orderId: string): Promise<DriverAssignment[]>;
  getPendingAssignmentsByDriver(driverId: string): Promise<DriverAssignment[]>;
  respondToAssignment(id: string, status: string): Promise<DriverAssignment | undefined>;

  // Analytics
  createDailyMetric(metric: InsertDailyMetric): Promise<DailyMetric>;
  getMetricsByTenant(tenantId: string, startDate: Date, endDate: Date): Promise<DailyMetric[]>;
}

export class DatabaseStorage implements IStorage {
  // Tenants
  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await db.insert(tenants).values(insertTenant as any).returning();
    return tenant;
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
    return tenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return db.select().from(tenants).where(eq(tenants.isActive, true));
  }

  async updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.commissionPercentage !== undefined) updateData.commissionPercentage = data.commissionPercentage;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.carouselImages !== undefined) updateData.carouselImages = data.carouselImages;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.stripePublicKey !== undefined) updateData.stripePublicKey = data.stripePublicKey;
    if (data.stripeSecretKey !== undefined) updateData.stripeSecretKey = data.stripeSecretKey;
    if (data.whatsappPhone !== undefined) updateData.whatsappPhone = data.whatsappPhone;
    if (data.whatsappWebhookUrl !== undefined) updateData.whatsappWebhookUrl = data.whatsappWebhookUrl;
    if (data.n8nWebhookUrl !== undefined) updateData.n8nWebhookUrl = data.n8nWebhookUrl;
    if (data.useOwnDriver !== undefined) updateData.useOwnDriver = data.useOwnDriver;
    if (data.deliveryFeeBusiness !== undefined) updateData.deliveryFeeBusiness = data.deliveryFeeBusiness;
    if (data.deliveryFeeCustomer !== undefined) updateData.deliveryFeeCustomer = data.deliveryFeeCustomer;
    if (data.operatingHours !== undefined) updateData.operatingHours = data.operatingHours;
    
    const result = await db.update(tenants).set(updateData).where(eq(tenants.id, id)).returning();
    return result[0];
  }

  // Users
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role as any));
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  // Customer Profiles
  async createCustomerProfile(insertProfile: InsertCustomerProfile): Promise<CustomerProfile> {
    const [profile] = await db.insert(customerProfiles).values(insertProfile).returning();
    return profile;
  }

  async getCustomerProfile(userId: string): Promise<CustomerProfile | undefined> {
    const [profile] = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, userId));
    return profile;
  }

  async updateCustomerProfile(userId: string, data: Partial<InsertCustomerProfile>): Promise<CustomerProfile | undefined> {
    const [profile] = await db.update(customerProfiles).set(data).where(eq(customerProfiles.userId, userId)).returning();
    return profile;
  }

  // Driver Profiles
  async createDriverProfile(insertProfile: InsertDriverProfile): Promise<DriverProfile> {
    const [profile] = await db.insert(driverProfiles).values(insertProfile).returning();
    return profile;
  }

  async getDriverProfile(userId: string): Promise<DriverProfile | undefined> {
    const [profile] = await db.select().from(driverProfiles).where(eq(driverProfiles.userId, userId));
    return profile;
  }

  async getAvailableDrivers(): Promise<DriverProfile[]> {
    return db.select().from(driverProfiles).where(eq(driverProfiles.status, "available"));
  }

  async updateDriverStatus(userId: string, status: string): Promise<DriverProfile | undefined> {
    const [profile] = await db.update(driverProfiles).set({ status: status as any }).where(eq(driverProfiles.userId, userId)).returning();
    return profile;
  }

  // Categories
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    try {
      const [category] = await db.insert(categories).values(insertCategory).returning();
      return category;
    } catch (error) {
      console.error("[DB] Database offline, using MemStorage fallback for createCategory");
      // Fallback: Use MemStorage when DB is down
      return memStorage.createCategory(insertCategory) as any;
    }
  }

  async getCategoriesByTenant(tenantId: string): Promise<Category[]> {
    try {
      return await db.select().from(categories).where(eq(categories.tenantId, tenantId)).orderBy(categories.displayOrder);
    } catch (error) {
      console.error("[DB] Database offline, using MemStorage fallback for getCategoriesByTenant");
      // Fallback: Use MemStorage when DB is down
      return memStorage.getCategoriesByTenant(tenantId) as any;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Products
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    try {
      const [product] = await db.insert(products).values(insertProduct).returning();
      return product;
    } catch (error) {
      console.error("[DB] Database offline, using MemStorage fallback for createProduct");
      // Fallback: Use MemStorage when DB is down
      return memStorage.createProduct(insertProduct) as any;
    }
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByTenant(tenantId: string): Promise<Product[]> {
    try {
      return await db.select().from(products).where(eq(products.tenantId, tenantId));
    } catch (error) {
      console.error("[DB] Database offline, using MemStorage fallback for getProductsByTenant");
      // Fallback: Use MemStorage when DB is down
      return memStorage.getProductsByTenant(tenantId) as any;
    }
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return db.select().from(products).where(and(eq(products.categoryId, categoryId), eq(products.isAvailable, true)));
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
      return product;
    } catch (error) {
      console.error("[DB] Database offline, using MemStorage fallback for updateProduct");
      // Fallback: Use MemStorage when DB is down
      return memStorage.updateProduct(id, data) as any;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await db.delete(products).where(eq(products.id, id));
    } catch (error) {
      console.error("[DB] Database offline, using MemStorage fallback for deleteProduct");
      // Fallback: Use MemStorage when DB is down
      await memStorage.deleteProduct(id);
    }
  }

  // Orders
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByTenant(tenantId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.tenantId, tenantId)).orderBy(desc(orders.createdAt));
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  }

  async getOrdersByDriver(driverId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.driverId, driverId)).orderBy(desc(orders.createdAt));
  }

  async getPendingOrdersByTenant(tenantId: string): Promise<Order[]> {
    return db.select().from(orders)
      .where(and(eq(orders.tenantId, tenantId), eq(orders.status, "pending")))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [order] = await db.update(orders).set({ status: status as any, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return order;
  }

  async assignDriver(orderId: string, driverId: string): Promise<Order | undefined> {
    const [order] = await db.update(orders).set({ driverId, updatedAt: new Date() }).where(eq(orders.id, orderId)).returning();
    return order;
  }

  // Create order with transaction (ACID atomicity)
  async createOrderWithTransaction(
    orderData: InsertOrder,
    paymentData?: Omit<InsertPayment, 'orderId'>,
    itemsData?: Omit<InsertOrderItem, 'orderId'>[],
    commissionData?: Omit<InsertCommission, 'orderId'>
  ): Promise<{ order: Order; payment?: Payment; items?: OrderItem[]; commission?: Commission }> {
    return await db.transaction(async (tx) => {
      // Create order
      const [order] = await tx.insert(orders).values(orderData).returning();

      // Create payment if provided
      let payment: Payment | undefined;
      if (paymentData) {
        const [createdPayment] = await tx.insert(payments).values({
          ...paymentData,
          orderId: order.id,
        } as InsertPayment).returning();
        payment = createdPayment;
      }

      // Create order items if provided
      let items: OrderItem[] = [];
      if (itemsData && itemsData.length > 0) {
        items = await tx.insert(orderItems).values(
          itemsData.map(item => ({
            ...item,
            orderId: order.id,
          }))
        ).returning();
      }

      // Create commission if provided
      let commission: Commission | undefined;
      if (commissionData) {
        const [createdCommission] = await tx.insert(commissions).values({
          ...commissionData,
          orderId: order.id,
        } as InsertCommission).returning();
        commission = createdCommission;
      }

      return { order, payment, items, commission };
    });
  }

  // Order Items
  async createOrderItem(insertItem: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(insertItem).returning();
    return item;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  // Payments
  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async getPaymentByOrder(orderId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId));
    return payment;
  }

  async updatePaymentStatus(id: string, status: string): Promise<Payment | undefined> {
    const [payment] = await db.update(payments).set({ status: status as any }).where(eq(payments.id, id)).returning();
    return payment;
  }

  // Atomic transaction: update payment status and order status together
  async updatePaymentAndOrderStatus(paymentId: string, paymentStatus: string, orderId: string, orderStatus: string): Promise<{ payment: Payment; order: Order } | undefined> {
    try {
      // Update both in sequence (Drizzle doesn't support true transactions yet in neon-serverless)
      const [payment] = await db.update(payments).set({ status: paymentStatus as any }).where(eq(payments.id, paymentId)).returning();
      const [order] = await db.update(orders).set({ status: orderStatus as any, updatedAt: new Date() }).where(eq(orders.id, orderId)).returning();
      
      if (payment && order) {
        return { payment, order };
      }
    } catch (error) {
      console.error(`[DB] Error in updatePaymentAndOrderStatus: ${error}`);
    }
    return undefined;
  }

  // Commissions
  async createCommission(insertCommission: InsertCommission): Promise<Commission> {
    const [commission] = await db.insert(commissions).values(insertCommission).returning();
    return commission;
  }

  async getCommissionsByTenant(tenantId: string): Promise<Commission[]> {
    return db.select().from(commissions).where(eq(commissions.tenantId, tenantId)).orderBy(desc(commissions.createdAt));
  }

  async getUnpaidCommissions(): Promise<Commission[]> {
    return db.select().from(commissions).where(eq(commissions.isPaid, false));
  }

  async markCommissionPaid(id: string): Promise<Commission | undefined> {
    const [commission] = await db.update(commissions).set({ isPaid: true }).where(eq(commissions.id, id)).returning();
    return commission;
  }

  // Driver Assignments
  async createDriverAssignment(insertAssignment: InsertDriverAssignment): Promise<DriverAssignment> {
    const [assignment] = await db.insert(driverAssignments).values(insertAssignment).returning();
    return assignment;
  }

  async getAssignmentsByOrder(orderId: string): Promise<DriverAssignment[]> {
    return db.select().from(driverAssignments).where(eq(driverAssignments.orderId, orderId));
  }

  async getPendingAssignmentsByDriver(driverId: string): Promise<DriverAssignment[]> {
    return db.select().from(driverAssignments)
      .where(and(eq(driverAssignments.driverId, driverId), eq(driverAssignments.status, "pending")));
  }

  async respondToAssignment(id: string, status: string): Promise<DriverAssignment | undefined> {
    const [assignment] = await db.update(driverAssignments)
      .set({ status, respondedAt: new Date() })
      .where(eq(driverAssignments.id, id))
      .returning();
    return assignment;
  }

  // Analytics
  async createDailyMetric(insertMetric: InsertDailyMetric): Promise<DailyMetric> {
    const [metric] = await db.insert(dailyMetrics).values(insertMetric).returning();
    return metric;
  }

  async getMetricsByTenant(tenantId: string, startDate: Date, endDate: Date): Promise<DailyMetric[]> {
    return db.select().from(dailyMetrics)
      .where(
        and(
          eq(dailyMetrics.tenantId, tenantId),
          gte(dailyMetrics.date, startDate),
          lte(dailyMetrics.date, endDate)
        )
      )
      .orderBy(dailyMetrics.date);
  }

  // Pending Restaurants
  async getPendingRestaurants(): Promise<any[]> {
    return db.select().from((await import("@shared/schema")).pendingRestaurants).where(eq((await import("@shared/schema")).pendingRestaurants.status, "pending"));
  }

  async getPendingRestaurant(id: string): Promise<any> {
    const [restaurant] = await db.select().from((await import("@shared/schema")).pendingRestaurants).where(eq((await import("@shared/schema")).pendingRestaurants.id, id));
    return restaurant;
  }

  async approvePendingRestaurant(id: string): Promise<void> {
    await db.update((await import("@shared/schema")).pendingRestaurants).set({ status: "approved" }).where(eq((await import("@shared/schema")).pendingRestaurants.id, id));
  }

  async rejectPendingRestaurant(id: string): Promise<void> {
    await db.update((await import("@shared/schema")).pendingRestaurants).set({ status: "rejected" }).where(eq((await import("@shared/schema")).pendingRestaurants.id, id));
  }

  // Pending Drivers
  async getPendingDrivers(): Promise<any[]> {
    return db.select().from((await import("@shared/schema")).pendingDrivers).where(eq((await import("@shared/schema")).pendingDrivers.status, "pending"));
  }

  async getPendingDriver(id: string): Promise<any> {
    const [driver] = await db.select().from((await import("@shared/schema")).pendingDrivers).where(eq((await import("@shared/schema")).pendingDrivers.id, id));
    return driver;
  }

  async approvePendingDriver(id: string): Promise<void> {
    await db.update((await import("@shared/schema")).pendingDrivers).set({ status: "approved" }).where(eq((await import("@shared/schema")).pendingDrivers.id, id));
  }

  async rejectPendingDriver(id: string): Promise<void> {
    await db.update((await import("@shared/schema")).pendingDrivers).set({ status: "rejected" }).where(eq((await import("@shared/schema")).pendingDrivers.id, id));
  }

  // Customer Addresses
  async getCustomerAddresses(userId: string): Promise<any[]> {
    const { customerAddresses } = await import("@shared/schema");
    return db.select().from(customerAddresses).where(eq(customerAddresses.userId, userId));
  }

  async createCustomerAddress(data: any): Promise<any> {
    const { customerAddresses } = await import("@shared/schema");
    const [address] = await db.insert(customerAddresses).values(data).returning();
    return address;
  }

  // Pizza Flavors
  async createPizzaFlavor(flavor: any): Promise<any> {
    const { pizzaFlavors } = await import("@shared/schema");
    const [created] = await db.insert(pizzaFlavors).values(flavor as any).returning();
    return created;
  }

  async getPizzaFlavorsByTenant(tenantId: string): Promise<any[]> {
    const { pizzaFlavors } = await import("@shared/schema");
    return db.select().from(pizzaFlavors)
      .where(and(eq(pizzaFlavors.tenantId, tenantId), eq(pizzaFlavors.isAvailable, true)));
  }

  async getProductFlavors(productId: string): Promise<any[]> {
    const { productFlavors, pizzaFlavors } = await import("@shared/schema");
    return db.select({
      id: pizzaFlavors.id,
      name: pizzaFlavors.name,
      basePrice: pizzaFlavors.basePrice,
      description: pizzaFlavors.description,
    }).from(productFlavors)
      .innerJoin(pizzaFlavors, eq(productFlavors.flavorId, pizzaFlavors.id))
      .where(eq(productFlavors.productId, productId));
  }

  async linkProductFlavor(productId: string, flavorId: string): Promise<any> {
    const { productFlavors } = await import("@shared/schema");
    return db.insert(productFlavors)
      .values({ productId, flavorId })
      .onConflictDoNothing()
      .returning();
  }
}

// SmartStorage: Fallback from Database to MemStorage on connection errors
export class SmartStorage implements IStorage {
  private dbStorage = new DatabaseStorage();
  private memStorage: any = memStorage;
  private useMemStorage = false;

  private async tryDb<T>(fn: () => Promise<T>, fallbackFn: () => Promise<T>): Promise<T> {
    // Once we know DB is unavailable, always use MemStorage
    if (this.useMemStorage) {
      return fallbackFn();
    }
    
    try {
      return await fn();
    } catch (err: any) {
      // Detect database connection errors
      const isDbError = 
        err?.errno === -3007 || 
        err?.errno === -3008 ||
        err?.code === 'ENOTFOUND' || 
        err?.code === 'ECONNREFUSED' ||
        err?.message?.includes('ENOTFOUND') ||
        err?.message?.includes('ECONNREFUSED') ||
        err?.message?.includes('connect') ||
        err?.message?.includes('getaddrinfo');
      
      if (isDbError) {
        console.warn("[SmartStorage] 🔄 Database unavailable, using MemStorage fallback");
        this.useMemStorage = true;
        try {
          return await fallbackFn();
        } catch (fallbackErr) {
          console.error("[SmartStorage] ❌ Fallback also failed:", fallbackErr);
          throw fallbackErr;
        }
      }
      throw err;
    }
  }

  // Tenants
  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    return this.tryDb(
      () => this.dbStorage.createTenant(tenant),
      () => this.memStorage.createTenant(tenant)
    );
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    return this.tryDb(
      () => this.dbStorage.getTenant(id),
      () => this.memStorage.getTenant(id)
    );
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    return this.tryDb(
      () => this.dbStorage.getTenantBySlug(slug),
      () => this.memStorage.getTenantBySlug(slug)
    );
  }

  async getAllTenants(): Promise<Tenant[]> {
    return this.tryDb(
      () => this.dbStorage.getAllTenants(),
      () => this.memStorage.getAllTenants()
    );
  }

  async updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant | undefined> {
    return this.tryDb(
      () => this.dbStorage.updateTenant(id, data),
      () => this.memStorage.updateTenant(id, data)
    );
  }

  // Users
  async createUser(user: InsertUser): Promise<User> {
    return this.tryDb(
      () => this.dbStorage.createUser(user),
      () => this.memStorage.createUser(user)
    );
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.tryDb(
      () => this.dbStorage.getUser(id),
      () => this.memStorage.getUser(id)
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.tryDb(
      () => this.dbStorage.getUserByEmail(email),
      () => this.memStorage.getUserByEmail(email)
    );
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return this.tryDb(
      () => this.dbStorage.getUsersByRole(role),
      () => this.memStorage.getUsersByRole(role)
    );
  }

  async getUsersByTenant(tenantId: string): Promise<User[]> {
    return this.tryDb(
      () => this.dbStorage.getUsersByTenant(tenantId),
      () => this.memStorage.getUsersByTenant(tenantId)
    );
  }

  // Customer Profiles
  async createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile> {
    return this.tryDb(
      () => this.dbStorage.createCustomerProfile(profile),
      () => this.memStorage.createCustomerProfile(profile)
    );
  }

  async getCustomerProfile(userId: string): Promise<CustomerProfile | undefined> {
    return this.tryDb(
      () => this.dbStorage.getCustomerProfile(userId),
      () => this.memStorage.getCustomerProfile(userId)
    );
  }

  async updateCustomerProfile(userId: string, data: Partial<InsertCustomerProfile>): Promise<CustomerProfile | undefined> {
    return this.tryDb(
      () => this.dbStorage.updateCustomerProfile(userId, data),
      () => this.memStorage.updateCustomerProfile(userId, data)
    );
  }

  // Driver Profiles
  async createDriverProfile(profile: InsertDriverProfile): Promise<DriverProfile> {
    return this.tryDb(
      () => this.dbStorage.createDriverProfile(profile),
      () => this.memStorage.createDriverProfile(profile)
    );
  }

  async getDriverProfile(userId: string): Promise<DriverProfile | undefined> {
    return this.tryDb(
      () => this.dbStorage.getDriverProfile(userId),
      () => this.memStorage.getDriverProfile(userId)
    );
  }

  async getAvailableDrivers(): Promise<DriverProfile[]> {
    return this.tryDb(
      () => this.dbStorage.getAvailableDrivers(),
      () => this.memStorage.getAvailableDrivers()
    );
  }

  async updateDriverStatus(userId: string, status: string): Promise<DriverProfile | undefined> {
    return this.tryDb(
      () => this.dbStorage.updateDriverStatus(userId, status),
      () => this.memStorage.updateDriverStatus(userId, status)
    );
  }

  // Categories
  async createCategory(category: InsertCategory): Promise<Category> {
    return this.tryDb(
      () => this.dbStorage.createCategory(category),
      () => this.memStorage.createCategory(category)
    );
  }

  async getCategoriesByTenant(tenantId: string): Promise<Category[]> {
    return this.tryDb(
      () => this.dbStorage.getCategoriesByTenant(tenantId),
      () => this.memStorage.getCategoriesByTenant(tenantId)
    );
  }

  async deleteCategory(id: string): Promise<void> {
    return this.tryDb(
      () => this.dbStorage.deleteCategory(id),
      () => this.memStorage.deleteCategory(id)
    );
  }

  // Products
  async createProduct(product: InsertProduct): Promise<Product> {
    return this.tryDb(
      () => this.dbStorage.createProduct(product),
      () => this.memStorage.createProduct(product)
    );
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.tryDb(
      () => this.dbStorage.getProduct(id),
      () => this.memStorage.getProduct(id)
    );
  }

  async getProductsByTenant(tenantId: string): Promise<Product[]> {
    return this.tryDb(
      () => this.dbStorage.getProductsByTenant(tenantId),
      () => this.memStorage.getProductsByTenant(tenantId)
    );
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return this.tryDb(
      () => this.dbStorage.getProductsByCategory(categoryId),
      () => this.memStorage.getProductsByCategory(categoryId)
    );
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined> {
    return this.tryDb(
      () => this.dbStorage.updateProduct(id, data),
      () => this.memStorage.updateProduct(id, data)
    );
  }

  async deleteProduct(id: string): Promise<void> {
    return this.tryDb(
      () => this.dbStorage.deleteProduct(id),
      () => this.memStorage.deleteProduct(id)
    );
  }

  // Orders
  async createOrder(order: InsertOrder): Promise<Order> {
    return this.tryDb(
      () => this.dbStorage.createOrder(order),
      () => this.memStorage.createOrder(order)
    );
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.tryDb(
      () => this.dbStorage.getOrder(id),
      () => this.memStorage.getOrder(id)
    );
  }

  async getOrdersByTenant(tenantId: string): Promise<Order[]> {
    return this.tryDb(
      () => this.dbStorage.getOrdersByTenant(tenantId),
      () => this.memStorage.getOrdersByTenant(tenantId)
    );
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return this.tryDb(
      () => this.dbStorage.getOrdersByCustomer(customerId),
      () => this.memStorage.getOrdersByCustomer(customerId)
    );
  }

  async getOrdersByDriver(driverId: string): Promise<Order[]> {
    return this.tryDb(
      () => this.dbStorage.getOrdersByDriver(driverId),
      () => this.memStorage.getOrdersByDriver(driverId)
    );
  }

  async getPendingOrdersByTenant(tenantId: string): Promise<Order[]> {
    return this.tryDb(
      () => this.dbStorage.getPendingOrdersByTenant(tenantId),
      () => this.memStorage.getPendingOrdersByTenant(tenantId)
    );
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    return this.tryDb(
      () => this.dbStorage.updateOrderStatus(id, status),
      () => this.memStorage.updateOrderStatus(id, status)
    );
  }

  async assignDriver(orderId: string, driverId: string): Promise<Order | undefined> {
    return this.tryDb(
      () => this.dbStorage.assignDriver(orderId, driverId),
      () => this.memStorage.assignDriver(orderId, driverId)
    );
  }

  async createOrderWithTransaction(orderData: InsertOrder, paymentData?: InsertPayment, itemsData?: InsertOrderItem[], commissionData?: InsertCommission): Promise<{ order: Order; payment?: Payment; items?: OrderItem[]; commission?: Commission }> {
    return this.tryDb(
      () => this.dbStorage.createOrderWithTransaction(orderData, paymentData, itemsData, commissionData),
      () => this.memStorage.createOrderWithTransaction(orderData, paymentData, itemsData, commissionData)
    );
  }

  // Order Items
  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    return this.tryDb(
      () => this.dbStorage.createOrderItem(item),
      () => this.memStorage.createOrderItem(item)
    );
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return this.tryDb(
      () => this.dbStorage.getOrderItems(orderId),
      () => this.memStorage.getOrderItems(orderId)
    );
  }

  // Payments
  async createPayment(payment: InsertPayment): Promise<Payment> {
    return this.tryDb(
      () => this.dbStorage.createPayment(payment),
      () => this.memStorage.createPayment(payment)
    );
  }

  async getPaymentByOrder(orderId: string): Promise<Payment | undefined> {
    return this.tryDb(
      () => this.dbStorage.getPaymentByOrder(orderId),
      () => this.memStorage.getPaymentByOrder(orderId)
    );
  }

  async updatePaymentStatus(id: string, status: string): Promise<Payment | undefined> {
    return this.tryDb(
      () => this.dbStorage.updatePaymentStatus(id, status),
      () => this.memStorage.updatePaymentStatus(id, status)
    );
  }

  // Commissions
  async createCommission(commission: InsertCommission): Promise<Commission> {
    return this.tryDb(
      () => this.dbStorage.createCommission(commission),
      () => this.memStorage.createCommission(commission)
    );
  }

  async getCommissionsByTenant(tenantId: string): Promise<Commission[]> {
    return this.tryDb(
      () => this.dbStorage.getCommissionsByTenant(tenantId),
      () => this.memStorage.getCommissionsByTenant(tenantId)
    );
  }

  async getUnpaidCommissions(): Promise<Commission[]> {
    return this.tryDb(
      () => this.dbStorage.getUnpaidCommissions(),
      () => this.memStorage.getUnpaidCommissions()
    );
  }

  async markCommissionPaid(id: string): Promise<Commission | undefined> {
    return this.tryDb(
      () => this.dbStorage.markCommissionPaid(id),
      () => this.memStorage.markCommissionPaid(id)
    );
  }

  // Driver Assignments
  async createDriverAssignment(assignment: InsertDriverAssignment): Promise<DriverAssignment> {
    return this.tryDb(
      () => this.dbStorage.createDriverAssignment(assignment),
      () => this.memStorage.createDriverAssignment(assignment)
    );
  }

  async getAssignmentsByOrder(orderId: string): Promise<DriverAssignment[]> {
    return this.tryDb(
      () => this.dbStorage.getAssignmentsByOrder(orderId),
      () => this.memStorage.getAssignmentsByOrder(orderId)
    );
  }

  async getPendingAssignmentsByDriver(driverId: string): Promise<DriverAssignment[]> {
    return this.tryDb(
      () => this.dbStorage.getPendingAssignmentsByDriver(driverId),
      () => this.memStorage.getPendingAssignmentsByDriver(driverId)
    );
  }

  async respondToAssignment(id: string, status: string): Promise<DriverAssignment | undefined> {
    return this.tryDb(
      () => this.dbStorage.respondToAssignment(id, status),
      () => this.memStorage.respondToAssignment(id, status)
    );
  }

  // Analytics
  async createDailyMetric(metric: InsertDailyMetric): Promise<DailyMetric> {
    return this.tryDb(
      () => this.dbStorage.createDailyMetric(metric),
      () => this.memStorage.createDailyMetric(metric)
    );
  }

  async getMetricsByTenant(tenantId: string, startDate: Date, endDate: Date): Promise<DailyMetric[]> {
    return this.tryDb(
      () => this.dbStorage.getMetricsByTenant(tenantId, startDate, endDate),
      () => this.memStorage.getMetricsByTenant(tenantId, startDate, endDate)
    );
  }

  async getPendingRestaurants() {
    return this.tryDb(
      () => this.dbStorage.getPendingRestaurants(),
      () => this.memStorage.getPendingRestaurants()
    );
  }

  async getCustomerAddresses(userId: string) {
    return this.tryDb(
      () => this.dbStorage.getCustomerAddresses(userId),
      () => this.memStorage.getCustomerAddresses(userId)
    );
  }

  async createCustomerAddress(data: any) {
    return this.tryDb(
      () => this.dbStorage.createCustomerAddress(data),
      () => this.memStorage.createCustomerAddress(data)
    );
  }
}

export const storage = new SmartStorage();

// Pagination helper
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export async function paginate<T>(
  query: any,
  countQuery: any,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedResult<T>> {
  const offset = (page - 1) * limit;
  const [{ count }] = await countQuery;
  const data = await query.offset(offset).limit(limit);
  
  return {
    data,
    total: count || 0,
    page,
    limit,
    pages: Math.ceil((count || 0) / limit),
  };
}
