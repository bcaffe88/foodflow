import { Express, type Request, Response } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { importProductsSchema, createProductSchema, createCategorySchema } from "@shared/schema";
import { parseCSV, parseTextDescription, findDuplicates, mergeProductData } from "./product-parser";
import { generateProductPlaceholder } from "./placeholder-images";
import { z } from "zod";

export async function registerRoutes(app: Express) {
  const server = createServer(app);

  // ============ Health Check ============
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ============ Categories ============
  app.get("/api/categories", async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      const data = createCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.json(category);
    } catch (error) {
      res.status(400).json({ error: "Invalid category data" });
    }
  });

  // ============ Products ============
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId as string;
      const products = categoryId
        ? await storage.getProductsByCategory(categoryId)
        : await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req: Request, res: Response) => {
    try {
      const data = createProductSchema.parse(req.body);
      
      // Generate placeholder if no image provided
      if (!data.image) {
        const category = await storage.getCategories();
        const cat = category.find(c => c.id === data.categoryId);
        data.image = generateProductPlaceholder(data.name, cat?.name || "Produto");
      }

      const product = await storage.createProduct(data);
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.patch("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete product" });
    }
  });

  // ============ Product Import from CSV ============
  app.post("/api/import/csv", async (req: Request, res: Response) => {
    try {
      const { csvContent, categoryId } = req.body as {
        csvContent: string;
        categoryId: string;
      };

      if (!csvContent || !categoryId) {
        return res.status(400).json({ error: "Missing csvContent or categoryId" });
      }

      // Parse CSV
      const csvProducts = parseCSV(csvContent);
      console.log(`[IMPORT] Parsed ${csvProducts.length} products from CSV`);

      // Get existing products
      const existing = await storage.getProducts();

      // Find duplicates
      const partialProducts = csvProducts.map(p => ({
        ...p,
        categoryId,
      }));
      const { new: newProducts } = findDuplicates(partialProducts, existing);

      // Create import record
      const importRecord = await storage.createImport({
        source: "csv",
        productsInserted: newProducts.length,
        productsDuplicated: csvProducts.length - newProducts.length,
        status: "processing",
      });

      // Insert new products
      const inserted = [];
      for (const product of newProducts) {
        try {
          // Generate placeholder if not provided
          if (!product.image) {
            product.image = generateProductPlaceholder(product.name || "Produto", "CSV Import");
          }

          const created = await storage.createProduct(product as any);
          inserted.push(created);
        } catch (error) {
          console.error(`Failed to insert product: ${product.name}`, error);
        }
      }

      // Update import record
      const finalRecord = await storage.updateImport(importRecord.id, {
        productsInserted: inserted.length,
        status: "completed",
      });

      res.json({
        success: true,
        import: finalRecord,
        inserted: inserted.length,
        duplicated: csvProducts.length - newProducts.length,
        products: inserted,
      });
    } catch (error) {
      console.error("CSV import error:", error);
      res.status(500).json({ error: "Failed to import CSV" });
    }
  });

  // ============ Product Import from Telegram ============
  app.post("/api/import/telegram", async (req: Request, res: Response) => {
    try {
      const { description, categoryId, telegramMessageId } = req.body as {
        description: string;
        categoryId: string;
        telegramMessageId?: string;
      };

      if (!description || !categoryId) {
        return res.status(400).json({ error: "Missing description or categoryId" });
      }

      // Parse text description
      const parsedData = parseTextDescription(description);
      console.log(`[TELEGRAM] Parsed product:`, parsedData);

      // Check if product already exists
      const existing = await storage.getProducts();
      const isDuplicate = existing.some(
        p => p.name && p.name.toLowerCase() === parsedData.name?.toLowerCase()
      );

      if (isDuplicate) {
        return res.json({
          success: false,
          isDuplicate: true,
          message: "Product already exists",
        });
      }

      // Create product
      const productData: any = {
        ...parsedData,
        categoryId,
        image: generateProductPlaceholder(
          parsedData.name || "Produto",
          "Telegram"
        ),
        externalReference: `telegram_${telegramMessageId || Date.now()}`,
      };

      const product = await storage.createProduct(productData);

      // Create import record
      const importRecord = await storage.createImport({
        source: "telegram",
        sourceId: telegramMessageId,
        productsInserted: 1,
        productsDuplicated: 0,
        status: "completed",
      });

      res.json({
        success: true,
        product,
        import: importRecord,
      });
    } catch (error) {
      console.error("Telegram import error:", error);
      res.status(500).json({ error: "Failed to import from Telegram" });
    }
  });

  // ============ Batch Import (Generic) ============
  app.post("/api/import/batch", async (req: Request, res: Response) => {
    try {
      const data = importProductsSchema.parse(req.body);
      console.log(`[BATCH IMPORT] Source: ${data.source}, Products: ${data.products.length}`);

      // Get existing products
      const existing = await storage.getProducts();

      // Find duplicates
      const { new: newProducts, duplicates } = findDuplicates(data.products as any, existing);

      // Create import record
      const importRecord = await storage.createImport({
        source: data.source as any,
        sourceId: data.sourceId,
        productsInserted: newProducts.length,
        productsDuplicated: duplicates.length,
        status: "processing",
      });

      // Insert products
      const inserted = [];
      for (const product of newProducts) {
        try {
          if (!product.image) {
            product.image = generateProductPlaceholder(
              product.name || "Produto",
              "Batch Import"
            );
          }
          const created = await storage.createProduct(product as any);
          inserted.push(created);
        } catch (error) {
          console.error(`Failed to insert product: ${product.name}`, error);
        }
      }

      // Update import record
      const finalRecord = await storage.updateImport(importRecord.id, {
        productsInserted: inserted.length,
        status: "completed",
      });

      res.json({
        success: true,
        import: finalRecord,
        inserted: inserted.length,
        duplicated: duplicates.length,
        products: inserted,
      });
    } catch (error) {
      console.error("Batch import error:", error);
      res.status(500).json({ error: "Failed to import products" });
    }
  });

  // ============ Import History ============
  app.get("/api/imports", async (req: Request, res: Response) => {
    try {
      const imports = await storage.getImports();
      res.json(imports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch imports" });
    }
  });

  return server;
}
