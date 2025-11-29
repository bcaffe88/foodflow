import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getQueryFn } from "@/lib/queryClient";
import { Search, MapPin, Star, Clock, ShoppingCart } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: restaurants = [], isLoading: loading } = useQuery<Restaurant[]>({
    queryKey: ["/api/storefront/restaurants"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [restaurants, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:to-primary/10">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4 md:p-6 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary" data-testid="text-logo">
              FoodFlow
            </span>
          </motion.div>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            data-testid="button-back-home"
            className="ml-auto"
          >
            ← Voltar
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Restaurantes
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Escolha entre nossos parceiros favoritos e peça suas refeições agora
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Busque por restaurante, culinária ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base shadow-md border-border/50"
              data-testid="input-search-restaurant"
            />
          </div>
        </motion.div>

        {/* Results Count */}
        {!loading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground mb-8"
          >
            {filteredRestaurants.length} restaurante{filteredRestaurants.length !== 1 ? 's' : ''} encontrado{filteredRestaurants.length !== 1 ? 's' : ''}
          </motion.p>
        )}

        {/* Grid de Restaurantes */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-4"
          >
            <Search className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              {searchTerm ? "Nenhum restaurante encontrado. Tente outro termo." : "Nenhum restaurante disponível no momento."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
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
            {filteredRestaurants.map((restaurant) => (
              <motion.div
                key={restaurant.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <Card
                  className="overflow-hidden hover-elevate cursor-pointer h-full flex flex-col border-2 border-transparent hover:border-primary/20 transition-all group shadow-md hover:shadow-xl"
                  onClick={() => navigate(`/r/${restaurant.slug}`)}
                  data-testid={`card-restaurant-${restaurant.id}`}
                >
                  {/* Logo/Image */}
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 flex items-center justify-center overflow-hidden relative">
                    {restaurant.logo ? (
                      <img
                        src={restaurant.logo}
                        alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-5xl font-bold text-primary/30 dark:text-primary/40">
                        {restaurant.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {restaurant.isActive && (
                      <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/90 text-white text-xs font-semibold shadow-lg">
                        <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                        Aberto
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors" data-testid={`text-restaurant-name-${restaurant.id}`}>
                      {restaurant.name}
                    </h3>
                    
                    {restaurant.description && (
                      <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">
                        {restaurant.description}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                      {restaurant.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                          <span className="line-clamp-1">{restaurant.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span>25-30 min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 flex-shrink-0 text-yellow-500" />
                        <span>4.8 (200+ avaliações)</span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-md hover:shadow-lg transition-all mt-auto"
                      onClick={() => navigate(`/r/${restaurant.slug}`)}
                      data-testid={`button-select-${restaurant.id}`}
                    >
                      Ver Cardápio
                      <ShoppingCart className="ml-2 h-4 w-4" />
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
