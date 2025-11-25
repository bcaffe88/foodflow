import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number | string;
  image: string;
  categoryId?: string;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (productId: string) => void;
}

export default function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          description={product.description}
          price={product.price}
          image={product.image}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
