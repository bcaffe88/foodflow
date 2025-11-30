import ProductCard from '../ProductCard';

export default function ProductCardExample() {
  return (
    <div className="p-4 max-w-sm">
      <ProductCard
        id="1"
        name="X-Burger Especial"
        description="Hambúrguer artesanal, queijo, alface, tomate e molho especial"
        price="25.90"
        image="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop"
      />
    </div>
  );
}
