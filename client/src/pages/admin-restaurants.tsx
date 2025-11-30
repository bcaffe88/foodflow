import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  commissionPercentage: string;
  n8nWebhookUrl?: string;
}

const webhookSchema = z.object({
  n8nWebhookUrl: z.string().url().optional(),
});

export default function AdminRestaurantsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const form = useForm({ resolver: zodResolver(webhookSchema) });

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const data = await apiRequest("GET", "/api/admin/tenants");
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Load restaurants error:", error);
      toast({ 
        title: "Erro", 
        description: error?.message || "Falha ao carregar restaurantes",
        variant: "destructive" 
      });
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    form.reset({ n8nWebhookUrl: restaurant.n8nWebhookUrl || "" });
  };

  const onSubmit = async (data: any) => {
    if (!selectedRestaurant) return;
    try {
      await apiRequest("PATCH", `/api/admin/restaurants/${selectedRestaurant.id}/webhook`, data);
      toast({ title: "Sucesso!", description: "Webhook atualizado" });
      setSelectedRestaurant(null);
      await loadRestaurants();
    } catch (error: any) {
      console.error("Update webhook error:", error);
      toast({ 
        title: "Erro", 
        description: error?.message || "Falha ao atualizar webhook",
        variant: "destructive" 
      });
    }
  };

  const handleDeleteRestaurant = async (restaurantId: string) => {
    if (!confirm("Tem certeza que deseja deletar este restaurante?")) return;
    try {
      await apiRequest("DELETE", `/api/admin/restaurants/${restaurantId}`);
      toast({ title: "Sucesso!", description: "Restaurante deletado" });
      setSelectedRestaurant(null);
      await loadRestaurants();
    } catch (error: any) {
      console.error("Delete restaurant error:", error);
      toast({ 
        title: "Erro", 
        description: error?.message || "Falha ao deletar restaurante",
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/dashboard")}
            data-testid="button-back-admin"
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 md:h-6 w-5 md:w-6 text-primary" />
            <h1 className="text-lg md:text-xl font-bold truncate">Gerenciar Restaurantes</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-3 md:p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2 md:space-y-3">
              {restaurants.map((restaurant, idx) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card
                    className={`p-3 md:p-4 cursor-pointer hover-elevate ${
                      selectedRestaurant?.id === restaurant.id ? "bg-secondary/10" : ""
                    }`}
                    onClick={() => handleSelectRestaurant(restaurant)}
                    data-testid={`card-restaurant-${restaurant.id}`}
                  >
                    <h3 className="font-semibold text-xs md:text-sm">{restaurant.name}</h3>
                    <p className="text-xs text-muted-foreground">{restaurant.phone}</p>
                    <p className="text-xs text-muted-foreground">{restaurant.address}</p>
                    <p className="text-xs mt-2">Comissão: {restaurant.commissionPercentage}%</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {selectedRestaurant && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-4 md:p-6">
                  <h2 className="text-base md:text-lg font-semibold mb-4" data-testid="text-restaurant-detail">{selectedRestaurant.name}</h2>
                  <div className="space-y-3 md:space-y-4 mb-6">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">ID</p>
                      <p className="font-mono text-xs md:text-sm">{selectedRestaurant.id}</p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Slug</p>
                      <p className="font-mono text-xs md:text-sm">{selectedRestaurant.slug}</p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Telefone</p>
                      <p className="text-xs md:text-sm">{selectedRestaurant.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Comissão</p>
                      <p className="text-xs md:text-sm">{selectedRestaurant.commissionPercentage}%</p>
                    </div>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
                      <FormField
                        control={form.control}
                        name="n8nWebhookUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs md:text-sm">URL Webhook N8N</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://n8n.example.com/webhook/..."
                                className="text-xs md:text-sm h-9 md:h-10"
                                {...field}
                                data-testid="input-webhook-url"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full text-xs md:text-sm"
                        data-testid="button-save-webhook"
                      >
                        Salvar Webhook
                      </Button>
                    </form>
                  </Form>

                  <Button
                    variant="destructive"
                    className="w-full mt-3 md:mt-4 text-xs md:text-sm"
                    onClick={() => handleDeleteRestaurant(selectedRestaurant.id)}
                    data-testid="button-delete-restaurant"
                  >
                    Deletar Restaurante
                  </Button>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
