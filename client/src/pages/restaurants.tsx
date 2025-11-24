import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getQueryFn } from "@/lib/queryClient";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

export default function RestaurantsPage() {
  const [, navigate] = useLocation();
  
  const { data: restaurants = [], isLoading: loading } = useQuery<Restaurant[]>({
    queryKey: ["/api/storefront/restaurants"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold text-red-600"
          >
            FoodFlow
          </motion.div>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            data-testid="button-back-home"
          >
            ← Voltar
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Restaurantes</h1>
          <p className="text-lg text-muted-foreground">
            Escolha seu restaurante favorito
          </p>
        </motion.div>

        {/* Grid de Restaurantes */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Nenhum restaurante disponível no momento
            </p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {restaurants.map((restaurant) => (
              <motion.div
                key={restaurant.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Card
                  className="overflow-hidden hover-elevate cursor-pointer h-full flex flex-col"
                  onClick={() => navigate(`/r/${restaurant.slug}`)}
                  data-testid={`card-restaurant-${restaurant.id}`}
                >
                  {/* Logo/Image */}
                  <div className="aspect-video bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 flex items-center justify-center overflow-hidden">
                    {restaurant.logo ? (
                      <img
                        src={restaurant.logo}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-4xl font-bold text-red-600 dark:text-red-400">
                        {restaurant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-lg mb-1" data-testid={`text-restaurant-name-${restaurant.id}`}>
                      {restaurant.name}
                    </h3>
                    {restaurant.description && (
                      <p className="text-sm text-muted-foreground mb-3 flex-1">
                        {restaurant.description}
                      </p>
                    )}
                    {restaurant.address && (
                      <p className="text-xs text-muted-foreground mb-2">
                        📍 {restaurant.address}
                      </p>
                    )}
                    {restaurant.phone && (
                      <p className="text-xs text-muted-foreground mb-4">
                        📞 {restaurant.phone}
                      </p>
                    )}
                    <Button
                      className="w-full bg-red-600 hover:bg-red-700 mt-auto"
                      onClick={() => navigate(`/r/${restaurant.slug}`)}
                      data-testid={`button-select-${restaurant.id}`}
                    >
                      Ver Cardápio
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
