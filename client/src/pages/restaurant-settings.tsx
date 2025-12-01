import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
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
  // 🖨️ Printer settings
  printerTcpIp: z.string().optional(),
  printerTcpPort: z.number().optional(),
  printerType: z.enum(['tcp', 'usb', 'bluetooth', 'webhook']).optional(),
  printerEnabled: z.boolean().default(false),
  printerWebhookUrl: z.string().url().optional(),
  printerWebhookSecret: z.string().optional(),
  printerWebhookEnabled: z.boolean().default(false),
  printKitchenOrders: z.boolean().default(true),
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

interface KitchenStaff {
  id: string;
  email: string;
  tenantId: string;
}

export default function RestaurantSettingsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [kitchenStaff, setKitchenStaff] = useState<KitchenStaff[]>([]);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

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
      // 🖨️ Printer defaults
      printerTcpIp: "192.168.1.100",
      printerTcpPort: 9100,
      printerType: "tcp",
      printerEnabled: false,
      printerWebhookUrl: "",
      printerWebhookSecret: "",
      printerWebhookEnabled: false,
      printKitchenOrders: true,
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
    loadKitchenStaff();
  }, []);

  const loadKitchenStaff = async () => {
    try {
      const data = await apiRequest("GET", "/api/restaurant/kitchen-staff");
      setKitchenStaff(data || []);
    } catch (error) {
      console.error("Failed to load kitchen staff:", error);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await apiRequest("GET", "/api/restaurant/settings");
      if (!data) throw new Error("Dados vazios");
      
      setRestaurant(data);
      form.reset({
        name: data?.name || "",
        address: data?.address || "",
        description: data?.description || "",
        logo: data?.logo || "",
        whatsappPhone: data?.whatsappPhone || "55",
        stripePublicKey: data?.stripePublicKey || "",
        stripeSecretKey: data?.stripeSecretKey || "",
        n8nWebhookUrl: data?.n8nWebhookUrl || "",
        useOwnDriver: data?.useOwnDriver ?? true,
        deliveryFeeBusiness: String(data?.deliveryFeeBusiness || "0"),
        deliveryFeeCustomer: String(data?.deliveryFeeCustomer || "0"),
        // 🖨️ Printer settings
        printerType: data?.printerType || "tcp",
        printerEnabled: data?.printerEnabled ?? false,
        printerTcpIp: data?.printerTcpIp || "192.168.1.100",
        printerTcpPort: data?.printerTcpPort || 9100,
        printerWebhookUrl: data?.printerWebhookUrl || "",
        printerWebhookSecret: data?.printerWebhookSecret || "",
        printerWebhookEnabled: data?.printerWebhookEnabled ?? false,
        printKitchenOrders: data?.printKitchenOrders ?? true,
        operatingHours: data?.operatingHours || {
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
      // Fallback com valores padrão se falhar
      form.reset({
        name: "Restaurante",
        address: "",
        description: "",
        logo: "",
        whatsappPhone: "55",
        stripePublicKey: "",
        stripeSecretKey: "",
        n8nWebhookUrl: "",
        useOwnDriver: true,
        deliveryFeeBusiness: "0",
        deliveryFeeCustomer: "0",
        // 🖨️ Printer defaults
        printerType: "tcp",
        printerEnabled: false,
        printerTcpIp: "192.168.1.100",
        printerTcpPort: 9100,
        printerWebhookUrl: "",
        printerWebhookSecret: "",
        printerWebhookEnabled: false,
        printKitchenOrders: true,
        operatingHours: {
          monday: { open: "10:00", close: "23:00", closed: false },
          tuesday: { open: "10:00", close: "23:00", closed: false },
          wednesday: { open: "10:00", close: "23:00", closed: false },
          thursday: { open: "10:00", close: "23:00", closed: false },
          friday: { open: "10:00", close: "23:00", closed: false },
          saturday: { open: "10:00", close: "23:00", closed: false },
          sunday: { open: "11:00", close: "22:00", closed: false },
        },
      });
      toast({ title: "Aviso", description: "Usando valores padrão", variant: "default" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStaff = async () => {
    if (!newStaffEmail || !newStaffPassword) {
      toast({ title: "Erro", description: "Preencha email e senha", variant: "destructive" });
      return;
    }

    setIsCreatingStaff(true);
    try {
      await apiRequest("POST", "/api/restaurant/kitchen-staff", {
        email: newStaffEmail,
        password: newStaffPassword,
      });
      
      toast({ title: "Sucesso!", description: "Funcionário adicionado" });
      setNewStaffEmail("");
      setNewStaffPassword("");
      await loadKitchenStaff();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao criar funcionário", variant: "destructive" });
    } finally {
      setIsCreatingStaff(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Remover este funcionário?")) return;

    try {
      await apiRequest("DELETE", `/api/restaurant/kitchen-staff/${staffId}`);
      toast({ title: "Sucesso!", description: "Funcionário removido" });
      await loadKitchenStaff();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao remover funcionário", variant: "destructive" });
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
        // 🖨️ Printer config
        printerTcpIp: data.printerTcpIp,
        printerTcpPort: data.printerTcpPort,
        printerType: data.printerType,
        printerEnabled: data.printerEnabled,
        printKitchenOrders: data.printKitchenOrders,
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

          {/* 🖨️ Impressora */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Configurações da Impressora</h2>
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="printerEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Ativar Impressora</FormLabel>
                      <Switch checked={field.value as boolean} onCheckedChange={field.onChange} data-testid="switch-printer-enabled" />
                    </FormItem>
                  )}
                />

                {form.watch("printerEnabled") && (
                  <>
                    <FormField
                      control={form.control}
                      name="printerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Impressora</FormLabel>
                          <FormControl>
                            <select {...field} className="px-3 py-2 border border-border rounded-md" data-testid="select-printer-type">
                              <option value="tcp">TCP/IP (Ethernet)</option>
                              <option value="usb">USB</option>
                              <option value="bluetooth">Bluetooth</option>
                              <option value="webhook">Webhook (Online)</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("printerType") === "tcp" && (
                      <>
                        <FormField
                          control={form.control}
                          name="printerTcpIp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Endereço IP da Impressora</FormLabel>
                              <FormControl>
                                <Input placeholder="192.168.1.100" {...field} data-testid="input-printer-ip" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="printerTcpPort"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Porta TCP</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="9100" {...field} onChange={(e) => field.onChange(Number(e.target.value))} data-testid="input-printer-port" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {form.watch("printerType") === "webhook" && (
                      <>
                        <FormField
                          control={form.control}
                          name="printerWebhookUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL do Webhook</FormLabel>
                              <FormControl>
                                <Input type="url" placeholder="https://seu-servidor.com/webhook" {...field} data-testid="input-printer-webhook-url" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="printerWebhookSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Segredo do Webhook</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="seu-segredo-aqui" {...field} data-testid="input-printer-webhook-secret" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="printerWebhookEnabled"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <FormLabel>Webhook Ativado</FormLabel>
                              <Switch checked={field.value as boolean} onCheckedChange={field.onChange} data-testid="switch-printer-webhook-enabled" />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      control={form.control}
                      name="printKitchenOrders"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Imprimir Pedidos da Cozinha</FormLabel>
                          <Switch checked={field.value as boolean} onCheckedChange={field.onChange} data-testid="switch-print-kitchen" />
                        </FormItem>
                      )}
                    />
                  </>
                )}
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

          {/* Kitchen Staff Management */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Gerenciar Funcionários de Cozinha</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Email"
                  type="email"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  data-testid="input-staff-email"
                />
                <Input
                  placeholder="Senha"
                  type="password"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  data-testid="input-staff-password"
                />
              </div>
              <Button 
                onClick={handleCreateStaff} 
                disabled={isCreatingStaff}
                className="w-full"
                data-testid="button-create-staff"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isCreatingStaff ? "Adicionando..." : "Adicionar Funcionário"}
              </Button>

              {kitchenStaff.length > 0 ? (
                <div className="space-y-2 mt-6">
                  <h3 className="font-medium text-sm">Funcionários Cadastrados:</h3>
                  {kitchenStaff.map((staff) => (
                    <div 
                      key={staff.id} 
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                      data-testid={`staff-item-${staff.id}`}
                    >
                      <span className="text-sm">{staff.email}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStaff(staff.id)}
                        data-testid={`button-delete-staff-${staff.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum funcionário cadastrado</p>
              )}
            </div>
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
            onClick={() => form.handleSubmit(onSubmit)()}
            disabled={isSaving}
            className="w-full"
            size="lg"
            data-testid="button-save-settings"
          >
            {isSaving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
