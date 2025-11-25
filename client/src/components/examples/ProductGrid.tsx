import ProductGrid from '../ProductGrid';

export default function ProductGridExample() {
  const products = [
    {
      id: '1',
      name: 'X-Burger Especial',
      description: 'Hambúrguer artesanal, queijo, alface, tomate',
      price: 25.90,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      categoryId: '1',
    },
    {
      id: '2',
      name: 'Pizza Margherita',
      description: 'Molho de tomate, mussarela e manjericão',
      price: 45.00,
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
      categoryId: '2',
    },
  ];

  return (
    <div className="p-4">
    </div>
  );
}
