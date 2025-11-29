import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, pgEnum, boolean, json, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["customer", "restaurant_owner", "driver", "platform_admin"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]);
export const driverStatusEnum = pgEnum("driver_status", ["available", "busy", "offline"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);

// Tenants (Restaurants)
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  description: text("description"),
  phone: text("phone"),
  address: text("address"),
  carouselImages: json("carousel_images").$type<string[]>(),
  isActive: boolean("is_active").notNull().default(true),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).notNull().default("10.00"),
  stripePublicKey: text("stripe_public_key"),
  stripeSecretKey: text("stripe_secret_key"),
  whatsappPhone: text("whatsapp_phone"),
  whatsappWebhookUrl: text("whatsapp_webhook_url"),
  useOwnDriver: boolean("use_own_driver").notNull().default(true),
  deliveryFeeBusiness: decimal("delivery_fee_business", { precision: 10, scale: 2 }).default("0"),
  deliveryFeeCustomer: decimal("delivery_fee_customer", { precision: 10, scale: 2 }).default("0"),
  n8nWebhookUrl: text("n8n_webhook_url"),
  operatingHours: json("operating_hours").$type<{
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  }>().default(sql`'{"monday":{"open":"10:00","close":"23:00","closed":false},"tuesday":{"open":"10:00","close":"23:00","closed":false},"wednesday":{"open":"10:00","close":"23:00","closed":false},"thursday":{"open":"10:00","close":"23:00","closed":false},"friday":{"open":"10:00","close":"23:00","closed":false},"saturday":{"open":"10:00","close":"23:00","closed":false},"sunday":{"open":"11:00","close":"22:00","closed":false}}'`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Users (Multi-role: customers, restaurant owners, drivers, admins)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Customer Profiles
export const customerProfiles = pgTable("customer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  defaultAddress: text("default_address"),
  addressLatitude: decimal("address_latitude", { precision: 10, scale: 7 }),
  addressLongitude: decimal("address_longitude", { precision: 10, scale: 7 }),
  addressReference: text("address_reference"),
});

// Driver Profiles
export const driverProfiles = pgTable("driver_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  vehicleType: text("vehicle_type"),
  vehiclePlate: text("vehicle_plate"),
  status: driverStatusEnum("status").notNull().default("offline"),
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 7 }),
  currentLongitude: decimal("current_longitude", { precision: 10, scale: 7 }),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  totalDeliveries: integer("total_deliveries").notNull().default(0),
});

// Categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
});

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  pricesBySize: json("prices_by_size").$type<{ [key: string]: string | undefined }>(),
  isCombination: boolean("is_combination").notNull().default(false),
  maxFlavors: integer("max_flavors").default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Pizza Flavors (sabores)
export const pizzaFlavors = pgTable("pizza_flavors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  name: text("name").notNull(),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  image: text("image"),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Product-Flavor Mapping (vincula pizza a sabores disponíveis)
export const productFlavors = pgTable("product_flavors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  flavorId: varchar("flavor_id").notNull().references(() => pizzaFlavors.id),
});

// Order Items with Flavors
export const orderItemsNew = pgTable("order_items_new", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  selectedFlavors: json("selected_flavors").$type<{ id: string; name: string; price: string }[]>(),
  selectedSize: text("selected_size").notNull().default("media"),
});

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  customerId: varchar("customer_id").references(() => users.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  deliveryAddress: text("delivery_address"),
  addressLatitude: decimal("address_latitude", { precision: 10, scale: 7 }),
  addressLongitude: decimal("address_longitude", { precision: 10, scale: 7 }),
  addressReference: text("address_reference"),
  orderNotes: text("order_notes"),
  status: orderStatusEnum("status").notNull().default("pending"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  driverId: varchar("driver_id").references(() => users.id),
  driverPhone: text("driver_phone"),
  deliveryReference: text("delivery_reference"),
  deliveryType: text("delivery_type").notNull().default("delivery"),
  paymentMethod: text("payment_method").notNull().default("cash"),
  needsChange: boolean("needs_change").default(false),
  changeAmount: decimal("change_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  idx_tenant: index("idx_orders_tenant").on(table.tenantId),
  idx_status: index("idx_orders_status").on(table.status),
  idx_created: index("idx_orders_created").on(table.createdAt),
}));

// Order Items
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
});

// Payments
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Commissions
export const commissions = pgTable("commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  orderTotal: decimal("order_total", { precision: 10, scale: 2 }).notNull(),
  commissionPercentage: decimal("commission_percentage", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  idx_tenant_unpaid: index("idx_commissions_tenant_unpaid").on(table.tenantId, table.isPaid),
  idx_created: index("idx_commissions_created").on(table.createdAt),
}));

// Driver Assignments
export const driverAssignments = pgTable("driver_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  driverId: varchar("driver_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  notifiedAt: timestamp("notified_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Analytics / Metrics (for dashboards)
export const dailyMetrics = pgTable("daily_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  date: timestamp("date").notNull(),
  totalOrders: integer("total_orders").notNull().default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).notNull().default("0"),
  totalCommission: decimal("total_commission", { precision: 10, scale: 2 }).notNull().default("0"),
});

// Pending Restaurant Registrations
export const pendingRestaurants = pgTable("pending_restaurants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Pending Driver Registrations
export const pendingDrivers = pgTable("pending_drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  vehiclePlate: text("vehicle_plate").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Customer Addresses (up to 3 per customer)
export const customerAddresses = pgTable("customer_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  label: text("label").notNull(),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  reference: text("reference"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Ratings & Feedback (customer feedback on orders, drivers, restaurants)
export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  driverId: varchar("driver_id").references(() => users.id),
  restaurantRating: integer("restaurant_rating"), // 1-5
  restaurantComment: text("restaurant_comment"),
  driverRating: integer("driver_rating"), // 1-5
  driverComment: text("driver_comment"),
  foodRating: integer("food_rating"), // 1-5
  foodComment: text("food_comment"),
  deliveryTime: integer("delivery_time"), // minutes
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  idx_order: index("idx_ratings_order").on(table.orderId),
  idx_tenant: index("idx_ratings_tenant").on(table.tenantId),
}));

// Promotions & Coupons
export const promotions = pgTable("promotions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  discountType: text("discount_type").notNull(), // "percentage" or "fixed"
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").notNull().default(0),
  minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  idx_tenant: index("idx_promotions_tenant").on(table.tenantId),
  idx_code: index("idx_promotions_code").on(table.code),
}));

// Insert Schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCustomerProfileSchema = createInsertSchema(customerProfiles).omit({ id: true });
export const insertDriverProfileSchema = createInsertSchema(driverProfiles).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertPizzaFlavorSchema = createInsertSchema(pizzaFlavors).omit({ id: true, createdAt: true });
export const insertProductFlavorSchema = createInsertSchema(productFlavors).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertOrderItemNewSchema = createInsertSchema(orderItemsNew).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertCommissionSchema = createInsertSchema(commissions).omit({ id: true, createdAt: true });
export const insertDriverAssignmentSchema = createInsertSchema(driverAssignments).omit({ id: true, notifiedAt: true });
export const insertDailyMetricSchema = createInsertSchema(dailyMetrics).omit({ id: true });
export const insertRatingSchema = createInsertSchema(ratings).omit({ id: true, createdAt: true });
export const insertPromotionSchema = createInsertSchema(promotions).omit({ id: true, createdAt: true });

// Types
export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type DriverProfile = typeof driverProfiles.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type PizzaFlavor = typeof pizzaFlavors.$inferSelect;
export type ProductFlavor = typeof productFlavors.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderItemNew = typeof orderItemsNew.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Commission = typeof commissions.$inferSelect;
export type DriverAssignment = typeof driverAssignments.$inferSelect;
export type DailyMetric = typeof dailyMetrics.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCustomerProfile = z.infer<typeof insertCustomerProfileSchema>;
export type InsertDriverProfile = z.infer<typeof insertDriverProfileSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertPizzaFlavor = z.infer<typeof insertPizzaFlavorSchema>;
export type InsertProductFlavor = z.infer<typeof insertProductFlavorSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertOrderItemNew = z.infer<typeof insertOrderItemNewSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type InsertDriverAssignment = z.infer<typeof insertDriverAssignmentSchema>;
export type InsertDailyMetric = z.infer<typeof insertDailyMetricSchema>;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;

// Frontend cart item interface
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}
