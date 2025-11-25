import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";

const daySchema = z.object({
  open: z.string(),
  close: z.string(),
  closed: z.boolean(),
});

const settingsSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  whatsappPhone: z.string().min(10),
  stripePublicKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  n8nWebhookUrl: z.string().url().optional(),
  useOwnDriver: z.boolean(),
  deliveryFeeBusiness: z.string(),
  deliveryFeeCustomer: z.string(),
  operatingHours: z.object({
    monday: daySchema,
    tuesday: daySchema,
    wednesday: daySchema,
    thursday: daySchema,
    friday: daySchema,
    saturday: daySchema,
    sunday: daySchema,
  }),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function RestaurantSettingsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<any>(null);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      address: "",
      description: "",
      logo: "",
      whatsappPhone: "",
      stripePublicKey: "",
      stripeSecretKey: "",
      n8nWebhookUrl: "",
      useOwnDriver: true,
      deliveryFeeBusiness: "0",
      deliveryFeeCustomer: "0",
      operatingHours: {
        monday: { open: "10:00", close: "23:00", closed: false },
        tuesday: { open: "10:00", close: "23:00", closed: false },
        wednesday: { open: "10:00", close: "23:00", closed: false },
        thursday: { open: "10:00", close: "23:00", closed: false },
        friday: { open: "10:00", close: "23:00", closed: false },
        saturday: { open: "10:00", close: "23:00", closed: false },
        sunday: { open: "11:00", close: "22:00", closed: false },
      },
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiRequest("GET", "/api/restaurant/settings");
      setRestaurant(data);
      form.reset({
        name: data.name || "",
        address: data.address || "",
        description: data.description || "",
        logo: data.logo || "",
        whatsappPhone: data.whatsappPhone || "",
        stripePublicKey: data.stripePublicKey || "",
        stripeSecretKey: data.stripeSecretKey || "",
        n8nWebhookUrl: data.n8nWebhookUrl || "",
        useOwnDriver: data.useOwnDriver ?? true,
        deliveryFeeBusiness: String(data.deliveryFeeBusiness || "0"),
        deliveryFeeCustomer: String(data.deliveryFeeCustomer || "0"),
        operatingHours: data.operatingHours || {
          monday: { open: "10:00", close: "23:00", closed: false },
          tuesday: { open: "10:00", close: "23:00", closed: false },
          wednesday: { open: "10:00", close: "23:00", closed: false },
          thursday: { open: "10:00", close: "23:00", closed: false },
          friday: { open: "10:00", close: "23:00", closed: false },
          saturday: { open: "10:00", close: "23:00", closed: false },
          sunday: { open: "11:00", close: "22:00", closed: false },
        },
      });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar configurações", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    setIsSaving(true);
    try {
      await apiRequest("PATCH", "/api/restaurant/settings", {
        name: data.name,
        address: data.address,
        description: data.description,
        logo: data.logo,
        whatsappPhone: data.whatsappPhone,
        stripePublicKey: data.stripePublicKey,
        stripeSecretKey: data.stripeSecretKey,
        n8nWebhookUrl: data.n8nWebhookUrl,
        useOwnDriver: data.useOwnDriver,
        deliveryFeeBusiness: data.deliveryFeeBusiness,
        deliveryFeeCustomer: data.deliveryFeeCustomer,
        operatingHours: data.operatingHours,
      });
      
      // Invalidar TODOS os caches relacionados
      // 1. Lista de restaurantes no storefront
      queryClient.invalidateQueries({ queryKey: ["/api/storefront/restaurants"] });
      
      // 2. Restaurante específico pelo slug
      if (restaurant?.slug) {
        queryClient.invalidateQueries({ queryKey: [`/api/storefront/${restaurant.slug}`] });
        
        try {
          // Limpar localStorage cache
          localStorage.removeItem(`storefront-${restaurant.slug}`);
          // Forçar recarga do storefront se estiver aberta em outra aba
          window.dispatchEvent(new CustomEvent('storefront-updated', { detail: { slug: restaurant.slug } }));
        } catch (e) {
          console.log("Cache invalidation:", e);
        }
      }
      
      // 3. Settings do restaurante
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/settings"] });
      
      toast({ title: "Sucesso!", description: "Configurações salvas e lista atualizada" });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao salvar configurações", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/restaurant/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">Configurações</h1>
        </div>

        <div className="space-y-6">
          {/* Informações do Restaurante */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Informações da Pizzaria</h2>
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Pizzaria</FormLabel>
                      <FormControl>
                        <Input placeholder="Wilson Pizza" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua Principal, 123, São Paulo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição da sua pizzaria..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Logo</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://exemplo.com/logo.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </Card>

          {/* WhatsApp */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">WhatsApp</h2>
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="whatsappPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número WhatsApp (com país e DDD)</FormLabel>
                      <FormControl>
                        <Input placeholder="558799999999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="n8nWebhookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Webhook N8N (para notificações)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://n8n.example.com/webhook/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </Card>

          {/* Stripe */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Stripe (Opcional)</h2>
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="stripePublicKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave Pública Stripe</FormLabel>
                      <FormControl>
                        <Input placeholder="pk_live_..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stripeSecretKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave Secreta Stripe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="sk_live_..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </Card>

          {/* Entrega */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Configurações de Entrega</h2>
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="useOwnDriver"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Usar Meu Próprio Motorista</FormLabel>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryFeeCustomer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa de Entrega (Cliente) - R$ (deixe em branco para grátis)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="5.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryFeeBusiness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa Paga ao Motorista - R$ (deixe em branco para grátis)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="3.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </Card>

          {/* Horário de Funcionamento */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Horário de Funcionamento</h2>
            <Form {...form}>
              <form className="space-y-4">
                {(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const).map((day) => (
                  <div key={day} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium capitalize">{day === "monday" ? "Segunda" : day === "tuesday" ? "Terça" : day === "wednesday" ? "Quarta" : day === "thursday" ? "Quinta" : day === "friday" ? "Sexta" : day === "saturday" ? "Sábado" : "Domingo"}</label>
                      <FormField
                        control={form.control}
                        name={`operatingHours.${day}.closed`}
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormLabel className="text-sm">Fechado</FormLabel>
                            <Switch checked={field.value as boolean} onCheckedChange={field.onChange} />
                          </FormItem>
                        )}
                      />
                    </div>
                    {!form.watch(`operatingHours.${day}.closed`) && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`operatingHours.${day}.open`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Abre às</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`operatingHours.${day}.close`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Fecha às</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </form>
            </Form>
          </Card>

          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSaving}
            className="w-full"
            size="lg"
          >
            {isSaving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
