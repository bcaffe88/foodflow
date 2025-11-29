// In-memory storage with automatic persistence - fallback when database is offline
// All operations persist in RAM during the session

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export class MemStorage {
  private tenants = new Map<string, any>();
  private users = new Map<string, any>();
  private categories = new Map<string, any>();
  private products = new Map<string, any>();
  private orders = new Map<string, any>();
  private settings = new Map<string, any>();

  constructor() {
    this.initializePreseedData();
  }

  private initializePreseedData() {
    console.log("[MemStorage] 🚀 Initializing pre-seed data...");

    // 1. Wilson Pizza tenant
    const wilsonTenant = {
      id: "wilson-001",
      name: "Wilson Pizzaria",
      slug: "wilson-pizza",
      logo: "https://via.placeholder.com/100?text=Wilson+Pizzaria",
      description: "A melhor pizzaria da região",
      phone: "(11) 98765-4321",
      whatsappPhone: "5511999888777",
      address: "Rua das Pizzas, 123",
      commissionPercentage: "10.00",
      isActive: true,
    };
    this.tenants.set(wilsonTenant.id, wilsonTenant);

    // 2. All users (admin, restaurant owner, customer, driver)
    const users = [
      {
        id: generateId("user"),
        email: "admin@foodflow.com",
        passwordHash: "$2b$10$i88b3J9NpRHGSvvqfxe4nOS.1LFD.DIr7lPXPHoXC4NSGwgCfn3u.", // bcrypt of Admin123!
        role: "platform_admin",
        name: "Admin FoodFlow",
        phone: "11999999999",
        isActive: true,
      },
      {
        id: generateId("user"),
        email: "wilson@wilsonpizza.com",
        passwordHash: "$2b$10$Ap/uIBT0L.34JmT4v6WkcegdPkKGgLDVurWtB9wtQ0sz3bfgYfzR.", // bcrypt of wilson123
        role: "restaurant_owner",
        name: "Wilson",
        phone: "11999999999",
        tenantId: "wilson-001",
        isActive: true,
      },
      {
        id: generateId("user"),
        email: "customer@example.com",
        passwordHash: "$2b$10$uK8OT2kXAfSYKL9hfeJB2eD69ataGrGqcSZqV3.UJcBESMy2YYbia", // bcrypt of password
        role: "customer",
        name: "João Cliente",
        phone: "11988776655",
        isActive: true,
      },
      {
        id: generateId("user"),
        email: "driver@example.com",
        passwordHash: "$2b$10$uK8OT2kXAfSYKL9hfeJB2eD69ataGrGqcSZqV3.UJcBESMy2YYbia", // bcrypt of password
        role: "driver",
        name: "Carlos Entregador",
        phone: "11987654321",
        isActive: true,
      },
    ];
    users.forEach(user => this.users.set(user.id, user));

    // 3. Categories
    const categories = [
      { id: generateId("cat"), tenantId: "wilson-001", name: "Pizzas Salgadas", slug: "salgadas", displayOrder: 1 },
      { id: generateId("cat"), tenantId: "wilson-001", name: "Pizzas Doces", slug: "doces", displayOrder: 2 },
      { id: generateId("cat"), tenantId: "wilson-001", name: "Bebidas", slug: "bebidas", displayOrder: 3 },
      { id: generateId("cat"), tenantId: "wilson-001", name: "Sobremesas", slug: "sobremesas", displayOrder: 4 },
      { id: generateId("cat"), tenantId: "wilson-001", name: "Acompanhamentos", slug: "acompanhamentos", displayOrder: 5 },
      { id: generateId("cat"), tenantId: "wilson-001", name: "Promoções", slug: "promocoes", displayOrder: 6 },
      { id: generateId("cat"), tenantId: "wilson-001", name: "Combos", slug: "combos", displayOrder: 7 },
    ];
    categories.forEach(cat => this.categories.set(cat.id, cat));

    // Store category IDs for reference
    const catIds = Array.from(this.categories.values());
    const catSalgadas = catIds[0];
    const catDoces = catIds[1];
    const catBebidas = catIds[2];

    // 4. Products (11 pizzas + 2 extras)
    const products = [
      // Salgadas
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catSalgadas.id,
        name: "Margherita",
        description: "Pizza clássica com mozzarela fresca e manjericão",
        price: "48.00",
        image: "https://via.placeholder.com/300?text=Margherita",
        isAvailable: true,
      },
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catSalgadas.id,
        name: "Pepperoni",
        description: "Pizza com pepperoni premium",
        price: "52.00",
        image: "https://via.placeholder.com/300?text=Pepperoni",
        isAvailable: true,
      },
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catSalgadas.id,
        name: "Quatro Queijos",
        description: "Mozzarela, gorgonzola, parmesão e provolone",
        price: "56.00",
        image: "https://via.placeholder.com/300?text=Quatro+Queijos",
        isAvailable: true,
      },
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catSalgadas.id,
        name: "Portuguesa",
        description: "Presunto, ovos, cebola e azeitona",
        price: "54.00",
        image: "https://via.placeholder.com/300?text=Portuguesa",
        isAvailable: true,
      },
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catSalgadas.id,
        name: "Frango com Catupiry",
        description: "Frango desfiado com catupiry cremoso",
        price: "55.00",
        image: "https://via.placeholder.com/300?text=Frango+Catupiry",
        isAvailable: true,
      },
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catSalgadas.id,
        name: "Calabresa",
        description: "Calabresa fatiada com cebola",
        price: "50.00",
        image: "https://via.placeholder.com/300?text=Calabresa",
        isAvailable: true,
      },
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catSalgadas.id,
        name: "Vegetariana",
        description: "Tomate, cebola, pimentão, milho e brócolis",
        price: "46.00",
        image: "https://via.placeholder.com/300?text=Vegetariana",
        isAvailable: true,
      },
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catSalgadas.id,
        name: "Bacon",
        description: "Bacon crocante com cheddar",
        price: "58.00",
        image: "https://via.placeholder.com/300?text=Bacon",
        isAvailable: true,
      },
      // Doces
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catDoces.id,
        name: "Chocolate",
        description: "Pizza doce com chocolate belga e morango",
        price: "44.00",
        image: "https://via.placeholder.com/300?text=Chocolate",
        isAvailable: true,
      },
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catDoces.id,
        name: "Romeu e Julieta",
        description: "Goiabada e queijo derretido",
        price: "42.00",
        image: "https://via.placeholder.com/300?text=Romeu+Julieta",
        isAvailable: true,
      },
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catDoces.id,
        name: "Banana Nevada",
        description: "Banana com calda de chocolate e canela",
        price: "48.00",
        image: "https://via.placeholder.com/300?text=Banana+Nevada",
        isAvailable: true,
      },
      // Bebidas
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catBebidas.id,
        name: "Refrigerante 1L",
        description: "Coca-Cola, Guaraná ou Fanta",
        price: "7.00",
        image: "https://via.placeholder.com/300?text=Refrigerante",
        isAvailable: true,
      },
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catBebidas.id,
        name: "Suco Natural",
        description: "Laranja, maçã ou melancia",
        price: "8.50",
        image: "https://via.placeholder.com/300?text=Suco",
        isAvailable: true,
      },
    ];
    products.forEach(prod => this.products.set(prod.id, prod));

    // 5. Default settings
    this.settings.set("wilson-001", {
      whatsappPhone: "5511999888777",
      deliveryFeeBusiness: "8.99",
      deliveryFeeCustomer: "7.50",
      useOwnDriver: true,
    });

    console.log(`[MemStorage] ✅ Initialized: ${this.tenants.size} tenants, ${this.users.size} users, ${this.categories.size} categories, ${this.products.size} products`);
  }

  // ========== TENANTS ==========
  async createTenant(data: any) {
    const tenant = { ...data, id: generateId("tenant") };
    this.tenants.set(tenant.id, tenant);
    return tenant;
  }

  async getTenant(id: string) {
    return this.tenants.get(id);
  }

  async getAllTenants() {
    return Array.from(this.tenants.values()).filter(t => t.isActive);
  }

  async getTenantBySlug(slug: string) {
    return Array.from(this.tenants.values()).find(t => t.slug === slug);
  }

  async updateTenant(id: string, data: Partial<any>) {
    const tenant = this.tenants.get(id);
    if (!tenant) {
      console.warn(`[MemStorage] Tenant not found: ${id}`);
      return undefined;
    }
    const updated = { ...tenant, ...data };
    this.tenants.set(id, updated);
    console.log(`[MemStorage] Updated tenant: ${id} - ${JSON.stringify(data)}`);
    return updated;
  }

  // ========== USERS ==========
  async createUser(data: any) {
    const user = { ...data, id: generateId("user") };
    this.users.set(user.id, user);
    return user;
  }

  async getUser(id: string) {
    return this.users.get(id);
  }

  async getUserByEmail(email: string) {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  // ========== CATEGORIES ==========
  async createCategory(data: any) {
    const category = { ...data, id: generateId("cat") };
    this.categories.set(category.id, category);
    console.log(`[MemStorage] Created category: ${category.name}`);
    return category;
  }

  async getCategoriesByTenant(tenantId: string) {
    return Array.from(this.categories.values())
      .filter(c => c.tenantId === tenantId)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  // ========== PRODUCTS - WITH UPDATE/DELETE/TOGGLE ==========
  async createProduct(data: any) {
    const product = { ...data, id: generateId("prod") };
    this.products.set(product.id, product);
    console.log(`[MemStorage] Created product: ${product.name}`);
    return product;
  }

  async getProduct(id: string) {
    return this.products.get(id);
  }

  async getProductsByTenant(tenantId: string) {
    return Array.from(this.products.values()).filter(p => p.tenantId === tenantId);
  }

  async getProductsByCategory(categoryId: string) {
    return Array.from(this.products.values())
      .filter(p => p.categoryId === categoryId && p.isAvailable === true);
  }

  async updateProduct(id: string, data: Partial<any>) {
    const product = this.products.get(id);
    if (!product) {
      console.warn(`[MemStorage] Product not found: ${id}`);
      return undefined;
    }
    const updated = { ...product, ...data };
    this.products.set(id, updated);
    console.log(`[MemStorage] Updated product: ${id} - ${JSON.stringify(data)}`);
    return updated;
  }

  async deleteProduct(id: string) {
    const existed = this.products.has(id);
    this.products.delete(id);
    console.log(`[MemStorage] Deleted product: ${id}`);
    return existed;
  }

  // ========== SETTINGS ==========
  async getSettings(tenantId: string) {
    return this.settings.get(tenantId) || {};
  }

  async updateSettings(tenantId: string, data: any) {
    const current = this.settings.get(tenantId) || {};
    const updated = { ...current, ...data };
    this.settings.set(tenantId, updated);
    console.log(`[MemStorage] Updated settings for ${tenantId}: ${JSON.stringify(data)}`);
    return updated;
  }

  // ========== ORDERS (STUB) ==========
  private payments = new Map<string, any>();
  private orderItems = new Map<string, any[]>();
  private commissions = new Map<string, any>();

  async createOrder(data: any) {
    const order = { ...data, id: generateId("order"), status: "pending", createdAt: new Date() };
    this.orders.set(order.id, order);
    return order;
  }

  async getOrder(id: string) {
    return this.orders.get(id);
  }

  async getOrdersByTenant(tenantId: string) {
    return Array.from(this.orders.values()).filter(o => o.tenantId === tenantId);
  }

  async getOrdersByCustomer(customerId: string) {
    return Array.from(this.orders.values()).filter(o => o.customerId === customerId);
  }

  async getOrdersByDriver(driverId: string) {
    return Array.from(this.orders.values()).filter(o => o.driverId === driverId);
  }

  async getPendingOrdersByTenant(tenantId: string) {
    return Array.from(this.orders.values())
      .filter(o => o.tenantId === tenantId && o.status === "pending");
  }

  async updateOrderStatus(id: string, status: string) {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updated = { ...order, status };
    this.orders.set(id, updated);
    return updated;
  }

  async assignDriver(orderId: string, driverId: string) {
    const order = this.orders.get(orderId);
    if (!order) return undefined;
    const updated = { ...order, driverId };
    this.orders.set(orderId, updated);
    return updated;
  }

  async createOrderWithTransaction(orderData: any, paymentData?: any, itemsData?: any[], commissionData?: any) {
    const order = await this.createOrder(orderData);
    const payment = paymentData ? await this.createPayment(paymentData) : undefined;
    const items = itemsData ? await Promise.all(itemsData.map(item => this.createOrderItem(item))) : undefined;
    const commission = commissionData ? await this.createCommission(commissionData) : undefined;
    return { order, payment, items, commission };
  }

  // ========== ORDER ITEMS ==========
  async createOrderItem(data: any) {
    const item = { ...data, id: generateId("item") };
    const orderId = data.orderId;
    if (!this.orderItems.has(orderId)) {
      this.orderItems.set(orderId, []);
    }
    this.orderItems.get(orderId)!.push(item);
    return item;
  }

  async getOrderItems(orderId: string) {
    return this.orderItems.get(orderId) || [];
  }

  // ========== PAYMENTS ==========
  async createPayment(data: any) {
    const payment = { ...data, id: generateId("payment"), status: "pending" };
    this.payments.set(payment.id, payment);
    return payment;
  }

  async getPaymentByOrder(orderId: string) {
    return Array.from(this.payments.values()).find(p => p.orderId === orderId);
  }

  async getPaymentById(id: string) {
    return this.payments.get(id);
  }

  async getPaymentsByTenant(tenantId: string, limit: number, offset: number) {
    return Array.from(this.payments.values())
      .filter(p => p.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
  }

  async getPaymentCountByTenant(tenantId: string) {
    return Array.from(this.payments.values()).filter(p => p.tenantId === tenantId).length;
  }

  async updatePaymentStatus(id: string, status: string) {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    const updated = { ...payment, status };
    this.payments.set(id, updated);
    return updated;
  }

  async updatePaymentStripeId(id: string, stripeId: string) {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    const updated = { ...payment, stripePaymentIntentId: stripeId };
    this.payments.set(id, updated);
    return updated;
  }

  // ========== COMMISSIONS ==========
  async createCommission(data: any) {
    const commission = { ...data, id: generateId("commission") };
    this.commissions.set(commission.id, commission);
    return commission;
  }

  async getCommissionsByTenant(tenantId: string) {
    return Array.from(this.commissions.values()).filter(c => c.tenantId === tenantId);
  }

  async getUnpaidCommissions() {
    return Array.from(this.commissions.values()).filter(c => c.status !== "paid");
  }

  async markCommissionPaid(id: string) {
    const commission = this.commissions.get(id);
    if (!commission) return undefined;
    const updated = { ...commission, status: "paid" };
    this.commissions.set(id, updated);
    return updated;
  }

  // ========== STUBS FOR OTHER METHODS ==========
  async createCustomerProfile(data: any) {
    return { ...data, id: generateId("customer") };
  }

  async getCustomerProfile(userId: string) {
    return undefined;
  }

  async updateCustomerProfile(userId: string, data: any) {
    return undefined;
  }

  async createDriverProfile(data: any) {
    return { ...data, id: generateId("driver") };
  }

  async getDriverProfile(userId: string) {
    return undefined;
  }

  async getAvailableDrivers() {
    return [];
  }

  async updateDriverStatus(userId: string, status: string) {
    return undefined;
  }

  async deleteCategory(id: string) {
    this.categories.delete(id);
  }

  async createDriverAssignment(data: any) {
    return { ...data, id: generateId("assignment") };
  }

  async getAssignmentsByOrder(orderId: string) {
    return [];
  }

  async getPendingAssignmentsByDriver(driverId: string) {
    return [];
  }

  async respondToAssignment(id: string, status: string) {
    return undefined;
  }

  async createDailyMetric(data: any) {
    return { ...data, id: generateId("metric") };
  }

  async getMetricsByTenant(tenantId: string, startDate: Date, endDate: Date) {
    return [];
  }

  async getPendingRestaurants() {
    return Array.from(this.tenants.values()).filter((t: any) => t.status === 'pending');
  }

  async getCustomerAddresses(userId: string) {
    return [];
  }

  async createCustomerAddress(data: any) {
    return { ...data, id: generateId("address") };
  }
}

export const memStorage = new MemStorage();
