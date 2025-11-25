import CategoryNav from '../CategoryNav';

export default function CategoryNavExample() {
  const categories = [
    { id: '1', name: 'Lanches', slug: 'lanches' },
    { id: '2', name: 'Pizzas', slug: 'pizzas' },
    { id: '3', name: 'Bebidas', slug: 'bebidas' },
    { id: '4', name: 'Sobremesas', slug: 'sobremesas' },
  ];

  return (
    <CategoryNav
      categories={categories}
      activeCategory="1"
    />
  );
}
