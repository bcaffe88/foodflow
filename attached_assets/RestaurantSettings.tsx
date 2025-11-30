import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, CreditCard, MapPin, Clock, Info } from "lucide-react";
import { toast } from "sonner";
import { APP_LOGO } from "@/const";

export default function RestaurantSettings() {
  const { user, loading, isAuthenticated } = useAuth();
  const [stripeKeys, setStripeKeys] = useState({
    publishableKey: "",
    secretKey: "",
  });

  const [restaurantInfo, setRestaurantInfo] = useState({
    businessName: "",
    phone: "",
    address: "",
    deliveryFee: 500,
    minimumOrder: 1000,
    estimatedDeliveryTime: "30-45 min",
  });

  const [deliverySettings, setDeliverySettings] = useState({
    useOwnDrivers: true,
    usePlatformDrivers: false,
    allowPickup: true,
  });

  // Fetch restaurant settings
  const { data: settings } = trpc.restaurant.getSettings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateSettingsMutation = trpc.restaurant.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Configurações atualizadas!");
    },
    onError: () => {
      toast.error("Erro ao atualizar configurações");
    },
  });

  const handleSaveStripe = async () => {
    if (!stripeKeys.publishableKey || !stripeKeys.secretKey) {
      toast.error("Preencha ambas as chaves do Stripe");
      return;
    }

    await updateSettingsMutation.mutateAsync({
      stripePublishableKey: stripeKeys.publishableKey,
      stripeSecretKey: stripeKeys.secretKey,
    });
  };

  const handleSaveRestaurantInfo = async () => {
    await updateSettingsMutation.mutateAsync({
      businessName: restaurantInfo.businessName,
      phone: restaurantInfo.phone,
      address: restaurantInfo.address,
      deliveryFee: restaurantInfo.deliveryFee,
      minimumOrder: restaurantInfo.minimumOrder,
      estimatedDeliveryTime: restaurantInfo.estimatedDeliveryTime,
    });
  };

  const handleSaveDeliverySettings = async () => {
    await updateSettingsMutation.mutateAsync({
      useOwnDrivers: deliverySettings.useOwnDrivers,
      usePlatformDrivers: deliverySettings.usePlatformDrivers,
      allowPickup: deliverySettings.allowPickup,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== "restaurant_owner" && user?.role !== "admin")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Você não tem permissão para acessar esta página</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={APP_LOGO}
                alt="Logo"
                className="h-10 w-10 rounded-full bg-white p-1"
              />
              <div>
                <h1 className="text-xl font-bold">Configurações</h1>
                <p className="text-sm opacity-90">Gerencie seu restaurante</p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => (window.location.href = "/restaurant")}
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <Tabs defaultValue="stripe" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stripe">
              <CreditCard className="h-4 w-4 mr-2" />
              Pagamentos (Stripe)
            </TabsTrigger>
            <TabsTrigger value="restaurant">
              <Settings className="h-4 w-4 mr-2" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="delivery">
              <MapPin className="h-4 w-4 mr-2" />
              Entrega
            </TabsTrigger>
          </TabsList>

          {/* Stripe Configuration */}
          <TabsContent value="stripe">
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Stripe</CardTitle>
                <CardDescription>
                  Configure pagamentos online com PIX via Stripe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Como obter suas chaves Stripe:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Acesse <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">stripe.com</a> e crie uma conta</li>
                      <li>Após criar a conta, vá para o Dashboard</li>
                      <li>No menu lateral, clique em "Developers" → "API keys"</li>
                      <li>Copie a "Publishable key" (começa com pk_) e a "Secret key" (começa com sk_)</li>
                      <li>Cole as chaves abaixo e clique em "Salvar"</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="publishableKey">
                      Chave Publicável (Publishable Key)
                    </Label>
                    <Input
                      id="publishableKey"
                      placeholder="pk_test_..."
                      value={stripeKeys.publishableKey}
                      onChange={(e) =>
                        setStripeKeys({
                          ...stripeKeys,
                          publishableKey: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Esta chave é segura para uso público
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="secretKey">
                      Chave Secreta (Secret Key)
                    </Label>
                    <Input
                      id="secretKey"
                      type="password"
                      placeholder="sk_test_..."
                      value={stripeKeys.secretKey}
                      onChange={(e) =>
                        setStripeKeys({
                          ...stripeKeys,
                          secretKey: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Mantenha esta chave em segredo
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveStripe}
                    disabled={updateSettingsMutation.isPending}
                  >
                    Salvar Configurações Stripe
                  </Button>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Importante:</strong> Para aceitar pagamentos PIX no Brasil, você precisa:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Ter uma conta Stripe ativa no Brasil</li>
                      <li>Completar o processo de verificação da conta</li>
                      <li>Ativar PIX nas configurações de métodos de pagamento</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restaurant Information */}
          <TabsContent value="restaurant">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Restaurante</CardTitle>
                <CardDescription>
                  Configure os dados do seu estabelecimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Nome do Estabelecimento</Label>
                  <Input
                    id="businessName"
                    value={restaurantInfo.businessName}
                    onChange={(e) =>
                      setRestaurantInfo({
                        ...restaurantInfo,
                        businessName: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(87) 99999-9999"
                    value={restaurantInfo.phone}
                    onChange={(e) =>
                      setRestaurantInfo({
                        ...restaurantInfo,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="address">Endereço Completo</Label>
                  <Textarea
                    id="address"
                    placeholder="Rua, número, bairro, cidade - UF"
                    value={restaurantInfo.address}
                    onChange={(e) =>
                      setRestaurantInfo({
                        ...restaurantInfo,
                        address: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="deliveryFee">Taxa de Entrega (R$)</Label>
                    <Input
                      id="deliveryFee"
                      type="number"
                      step="0.01"
                      value={restaurantInfo.deliveryFee / 100}
                      onChange={(e) =>
                        setRestaurantInfo({
                          ...restaurantInfo,
                          deliveryFee: Math.round(
                            parseFloat(e.target.value) * 100
                          ),
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="minimumOrder">Pedido Mínimo (R$)</Label>
                    <Input
                      id="minimumOrder"
                      type="number"
                      step="0.01"
                      value={restaurantInfo.minimumOrder / 100}
                      onChange={(e) =>
                        setRestaurantInfo({
                          ...restaurantInfo,
                          minimumOrder: Math.round(
                            parseFloat(e.target.value) * 100
                          ),
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="estimatedTime">
                    Tempo Estimado de Entrega
                  </Label>
                  <Input
                    id="estimatedTime"
                    placeholder="30-45 min"
                    value={restaurantInfo.estimatedDeliveryTime}
                    onChange={(e) =>
                      setRestaurantInfo({
                        ...restaurantInfo,
                        estimatedDeliveryTime: e.target.value,
                      })
                    }
                  />
                </div>

                <Button
                  onClick={handleSaveRestaurantInfo}
                  disabled={updateSettingsMutation.isPending}
                >
                  Salvar Informações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Settings */}
          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Entrega</CardTitle>
                <CardDescription>
                  Defina como as entregas serão realizadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Usar Motoboys Próprios</Label>
                    <p className="text-sm text-muted-foreground">
                      Entregas realizadas pela sua equipe
                    </p>
                  </div>
                  <Switch
                    checked={deliverySettings.useOwnDrivers}
                    onCheckedChange={(checked) =>
                      setDeliverySettings({
                        ...deliverySettings,
                        useOwnDrivers: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Usar Motoboys da Plataforma</Label>
                    <p className="text-sm text-muted-foreground">
                      Entregas realizadas por motoboys cadastrados
                    </p>
                  </div>
                  <Switch
                    checked={deliverySettings.usePlatformDrivers}
                    onCheckedChange={(checked) =>
                      setDeliverySettings({
                        ...deliverySettings,
                        usePlatformDrivers: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permitir Retirada no Local</Label>
                    <p className="text-sm text-muted-foreground">
                      Clientes podem buscar pedidos no estabelecimento
                    </p>
                  </div>
                  <Switch
                    checked={deliverySettings.allowPickup}
                    onCheckedChange={(checked) =>
                      setDeliverySettings({
                        ...deliverySettings,
                        allowPickup: checked,
                      })
                    }
                  />
                </div>

                <Button
                  onClick={handleSaveDeliverySettings}
                  disabled={updateSettingsMutation.isPending}
                >
                  Salvar Configurações de Entrega
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
