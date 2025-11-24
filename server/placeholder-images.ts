/**
 * Generate placeholder images for products
 */

export function generatePlaceholderImageUrl(productName: string, color?: string): string {
  // Use a placeholder service with product name
  const encodedName = encodeURIComponent(productName.substring(0, 30));
  const bgColor = color || '3B82F6'; // Default blue
  
  // Using ui-avatars.com or similar service for quick placeholder
  return `https://via.placeholder.com/300x300/${bgColor}/FFFFFF?text=${encodedName}`;
}

export function generateColorForCategory(categoryName: string): string {
  const colors = [
    '3B82F6', // Blue
    'EF4444', // Red
    '10B981', // Green
    'F59E0B', // Amber
    '8B5CF6', // Purple
    'EC4899', // Pink
    '06B6D4', // Cyan
    'F97316', // Orange
  ];
  
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export function generateProductPlaceholder(
  productName: string,
  categoryName: string,
): string {
  const color = generateColorForCategory(categoryName);
  return generatePlaceholderImageUrl(productName, color);
}

/**
 * Generate multiple placeholder images
 */
export function generatePlaceholders(
  products: Array<{ name: string; category: string }>
): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const product of products) {
    result[product.name] = generateProductPlaceholder(product.name, product.category);
  }
  
  return result;
}
