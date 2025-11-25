// Fallback para quando Neon está desabilitado
export const restaurantsMock = [
  {
    id: "wilson-pizza-uuid",
    name: "Wilson Pizzaria",
    slug: "wilson-pizza",
    logo: "https://via.placeholder.com/100",
    description: "A melhor pizzaria da região",
    phone: "(11) 98765-4321",
    address: "Rua das Pizzas, 123",
    commissionPercentage: "10.00",
    isActive: true
  }
]

export function getRestaurantsFallback() {
  return restaurantsMock
}
