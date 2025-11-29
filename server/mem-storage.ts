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
        tenantId: "wilson-001",
        isActive: true,
      },
      {
        id: generateId("user"),
        email: "driver@example.com",
        passwordHash: "$2b$10$uK8OT2kXAfSYKL9hfeJB2eD69ataGrGqcSZqV3.UJcBESMy2YYbia", // bcrypt of password
        role: "driver",
        name: "Carlos Entregador",
        phone: "11987654321",
        tenantId: "wilson-001",
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
        name: "Calabresa",
        description: "Calabresa fresca com cebola roxa",
        price: "50.00",
        image: "https://via.placeholder.com/300?text=Calabresa",
        isAvailable: true,
      },
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catSalgadas.id,
        name: "Vegetariana",
        description: "Brócolis, tomate, cebola e azeitona",
        price: "46.00",
        image: "https://via.placeholder.com/300?text=Vegetariana",
        isAvailable: true,
      },
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catSalgadas.id,
        name: "Frango com Batata Doce",
        description: "Frango com batata doce e alecrim",
        price: "54.00",
        image: "https://via.placeholder.com/300?text=Frango+Batata+Doce",
        isAvailable: true,
      },
      // Doces
      {
        id: generateId("prod"),
        tenantId: "wilson-001",
        categoryId: catDoces.id,
        name: "Chocolate com Morango",
        description: "Chocolate derretido com morangos frescos",
        price: "44.00",
        image: "https://via.placeholder.com/300?text=Chocolate+Morango",
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

  async getTenantBySlug(slug: string) {
    return Array.from(this.tenants.values()).find((t: any) => t.slug === slug);
  }

  async getAllTenants() {
    return Array.from(this.tenants.values());
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
    return Array.from(this.users.values()).find((u: any) => u.email === email);
  }

  async getUsersByRole(role: string) {
    return Array.from(this.users.values()).filter((u: any) => u.role === role);
  }

  // ========== CATEGORIES ==========
  async createCategory(data: any) {
    const category = { ...data, id: generateId("cat") };
    this.categories.set(category.id, category);
    return category;
  }

  async getCategoriesByTenant(tenantId: string) {
    return Array.from(this.categories.values()).filter((c: any) => c.tenantId === tenantId);
  }

  // ========== PRODUCTS ==========
  async createProduct(data: any) {
    const product = { ...data, id: generateId("prod") };
    this.products.set(product.id, product);
    return product;
  }

  async getProduct(id: string) {
    return this.products.get(id);
  }

  async getProductsByTenant(tenantId: string) {
    return Array.from(this.products.values()).filter((p: any) => p.tenantId === tenantId);
  }

  async getProductsByCategory(categoryId: string) {
    return Array.from(this.products.values()).filter((p: any) => p.categoryId === categoryId);
  }

  async updateProduct(id: string, data: any) {
    const product = this.products.get(id);
    if (product) {
      Object.assign(product, data);
    }
    return product;
  }

  async deleteProduct(id: string) {
    this.products.delete(id);
  }

  // ========== ORDERS ==========
  async createOrder(data: any) {
    const order = { ...data, id: generateId("order") };
    this.orders.set(order.id, order);
    return order;
  }

  async getOrder(id: string) {
    return this.orders.get(id);
  }

  async getOrdersByTenant(tenantId: string) {
    return Array.from(this.orders.values()).filter((o: any) => o.tenantId === tenantId);
  }

  async getOrdersByCustomer(customerId: string) {
    return Array.from(this.orders.values()).filter((o: any) => o.customerId === customerId);
  }

  async getOrdersByDriver(driverId: string) {
    return Array.from(this.orders.values()).filter((o: any) => o.driverId === driverId);
  }

  async updateOrderStatus(id: string, status: string) {
    const order = this.orders.get(id);
    if (order) {
      order.status = status;
    }
    return order;
  }

  async assignDriver(orderId: string, driverId: string) {
    const order = this.orders.get(orderId);
    if (order) {
      order.driverId = driverId;
    }
    return order;
  }

  // ========== PAGINATION HELPERS ==========
  async getAllSettings() {
    return Array.from(this.settings.values());
  }

  async getOrderItems(orderId: string) {
    return [];
  }

  async getPaymentByOrder(orderId: string) {
    return undefined;
  }

  async getPaymentById(id: string) {
    return undefined;
  }

  async getPaymentsByTenant(tenantId: string, limit: number, offset: number) {
    return [];
  }

  async getPaymentCountByTenant(tenantId: string) {
    return 0;
  }

  async getCommissionsByTenant(tenantId: string) {
    return [];
  }

  async getAvailableDrivers() {
    return Array.from(this.users.values()).filter((u: any) => u.role === "driver");
  }

  async getAvailableOrdersByTenant(tenantId: string, status: string) {
    return Array.from(this.orders.values()).filter((o: any) => o.tenantId === tenantId && o.status === status);
  }

  async getRatingsByTenant(tenantId: string) {
    return [];
  }

  async getPromotionsByTenant(tenantId: string) {
    return [];
  }
}

export const memStorage = new MemStorage();
