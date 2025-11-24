import { Product, CSVProduct } from "@shared/schema";

/**
 * Parse CSV content and extract products
 */
export function parseCSV(csvText: string): CSVProduct[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const products: CSVProduct[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = line.split(',').map(v => v.trim());
    const obj: Record<string, string> = {};

    headers.forEach((header, idx) => {
      obj[header] = values[idx] || '';
    });

    if (obj.name) {
      try {
        const product: CSVProduct = {
          name: obj.name,
          description: obj.description || obj.descricao || undefined,
          price: obj.price || obj.preco || '0',
          category: obj.category || obj.categoria || 'Geral',
          image: obj.image || obj.imagem || undefined,
        };
        products.push(product);
      } catch (error) {
        console.error(`Failed to parse CSV row ${i}:`, error);
      }
    }
  }

  return products;
}

/**
 * Parse text description for product info
 * Tries to extract: name, price, description
 * Example: "Margherita - R$ 25.00 - Cheese and tomato pizza"
 */
export function parseTextDescription(text: string): Partial<Product> {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const result: Partial<Product> = {};

  for (const line of lines) {
    // Try to find price pattern: R$ 25.00 or $25.00 or 25.00
    const priceMatch = line.match(/(?:R\$\s*)?(\d+[.,]\d{2})/);
    if (priceMatch && !result.price) {
      result.price = parseFloat(priceMatch[1].replace(',', '.'));
    }

    // First non-price line is usually the name
    if (!result.name && !priceMatch) {
      result.name = line;
    } else if (!result.name && !result.description) {
      result.description = line;
    } else if (line && !result.description) {
      result.description = (result.description || '') + ' ' + line;
    }
  }

  return result;
}

/**
 * Detect duplicates by comparing product names
 */
export function findDuplicates(
  products: Partial<Product>[],
  existingProducts: Product[],
): { duplicates: Partial<Product>[]; new: Partial<Product>[] } {
  const existingNames = new Set(
    existingProducts.map(p => p.name.toLowerCase().trim())
  );

  const duplicates: Partial<Product>[] = [];
  const newProducts: Partial<Product>[] = [];

  for (const product of products) {
    if (product.name && existingNames.has(product.name.toLowerCase().trim())) {
      duplicates.push(product);
    } else {
      newProducts.push(product);
    }
  }

  return { duplicates, new: newProducts };
}

/**
 * Merge product data intelligently
 */
export function mergeProductData(
  products: Partial<Product>[],
  defaultCategoryId: string,
): Array<Partial<Product> & { categoryId: string }> {
  return products.map(p => ({
    ...p,
    categoryId: p.categoryId || defaultCategoryId,
    isAvailable: p.isAvailable !== false,
  }));
}
