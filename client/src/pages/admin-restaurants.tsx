import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
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
      setRestaurants(data || []);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar restaurantes", variant: "destructive" });
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
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao atualizar webhook", variant: "destructive" });
    }
  };

  const handleDeleteRestaurant = async (restaurantId: string) => {
    if (!confirm("Tem certeza que deseja deletar este restaurante?")) return;
    try {
      await apiRequest("DELETE", `/api/admin/restaurants/${restaurantId}`);
      toast({ title: "Sucesso!", description: "Restaurante deletado" });
      setSelectedRestaurant(null);
      await loadRestaurants();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao deletar restaurante", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/admin/dashboard")}
            data-testid="button-back-admin"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">Gerenciar Restaurantes</h1>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {restaurants.map((restaurant) => (
                <Card
                  key={restaurant.id}
                  className={`p-4 cursor-pointer hover-elevate ${
                    selectedRestaurant?.id === restaurant.id ? "bg-secondary/10" : ""
                  }`}
                  onClick={() => handleSelectRestaurant(restaurant)}
                >
                  <h3 className="font-semibold">{restaurant.name}</h3>
                  <p className="text-sm text-muted-foreground">{restaurant.phone}</p>
                  <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                  <p className="text-xs mt-2">Comissão: {restaurant.commissionPercentage}%</p>
                </Card>
              ))}
            </div>

            {selectedRestaurant && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4" data-testid="text-restaurant-detail">{selectedRestaurant.name}</h2>
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="font-mono text-sm">{selectedRestaurant.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Slug</p>
                    <p className="font-mono text-sm">{selectedRestaurant.slug}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p>{selectedRestaurant.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Comissão</p>
                    <p>{selectedRestaurant.commissionPercentage}%</p>
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="n8nWebhookUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Webhook N8N</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://n8n.example.com/webhook/..."
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      data-testid="button-save-webhook"
                    >
                      Salvar Webhook
                    </Button>
                  </form>
                </Form>

                <Button 
                  variant="destructive" 
                  className="w-full mt-4"
                  onClick={() => handleDeleteRestaurant(selectedRestaurant.id)}
                  data-testid="button-delete-restaurant"
                >
                  Deletar Restaurante
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
