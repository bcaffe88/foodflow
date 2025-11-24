import { Product, CreateProductInput, Category, CreateCategoryInput, ProductImport, CreateProductImportInput } from "@shared/schema";

export interface IStorage {
  health(): Promise<{ status: "ok" | "error"; message: string }>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(data: CreateCategoryInput): Promise<Category>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  createProduct(data: CreateProductInput): Promise<Product>;
  updateProduct(id: string, data: Partial<CreateProductInput>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  findProductByExternalReference(ref: string): Promise<Product | null>;
  
  // Imports
  getImports(): Promise<ProductImport[]>;
  createImport(data: CreateProductImportInput): Promise<ProductImport>;
  updateImport(id: string, data: Partial<CreateProductImportInput>): Promise<ProductImport>;
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category> = new Map();
  private products: Map<string, Product> = new Map();
  private imports: Map<string, ProductImport> = new Map();

  async health(): Promise<{ status: "ok" | "error"; message: string }> {
    return { status: "ok", message: "Memory storage operational" };
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(data: CreateCategoryInput): Promise<Category> {
    const category: Category = {
      id: Math.random().toString(36).substring(7),
      ...data,
      createdAt: new Date(),
    };
    this.categories.set(category.id, category);
    return category;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.categoryId === categoryId);
  }

  async getProduct(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  async createProduct(data: CreateProductInput): Promise<Product> {
    const product: Product = {
      id: Math.random().toString(36).substring(7),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: string, data: Partial<CreateProductInput>): Promise<Product> {
    const product = this.products.get(id);
    if (!product) throw new Error("Product not found");
    
    const updated: Product = {
      ...product,
      ...data,
      updatedAt: new Date(),
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  async findProductByExternalReference(ref: string): Promise<Product | null> {
    for (const product of this.products.values()) {
      if (product.externalReference === ref) return product;
    }
    return null;
  }

  // Imports
  async getImports(): Promise<ProductImport[]> {
    return Array.from(this.imports.values());
  }

  async createImport(data: CreateProductImportInput): Promise<ProductImport> {
    const importRecord: ProductImport = {
      id: Math.random().toString(36).substring(7),
      ...data,
      createdAt: new Date(),
    };
    this.imports.set(importRecord.id, importRecord);
    return importRecord;
  }

  async updateImport(id: string, data: Partial<CreateProductImportInput>): Promise<ProductImport> {
    const importRecord = this.imports.get(id);
    if (!importRecord) throw new Error("Import not found");
    
    const updated: ProductImport = {
      ...importRecord,
      ...data,
    };
    this.imports.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
