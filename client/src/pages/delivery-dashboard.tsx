import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Truck, MapPin, Clock, DollarSign, Phone, TrendingUp, LogOut, ArrowLeft, BarChart3 } from "lucide-react";

interface DeliveryOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  total: string;
  status: string;
  createdAt: string;
}

interface DriverStats {
  totalEarnings: number;
  deliveriesCompleted: number;
  rating: number;
  acceptanceRate: number;
}

export default function DeliveryDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<DeliveryOrder | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DriverStats>({
    totalEarnings: 0,
    deliveriesCompleted: 0,
    rating: 4.8,
    acceptanceRate: 94,
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");
    
    if (!token || !user) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(user);
      if (parsedUser.role !== "driver") {
        navigate("/login");
        return;
      }
    } catch {
      navigate("/login");
      return;
    }

    loadDashboard();
  }, []);

  useEffect(() => {
    if (isOnline) {
      const interval = setInterval(loadAvailableOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  const loadDashboard = async () => {
    try {
      await loadAvailableOrders();
      setIsLoading(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar dashboard",
        variant: "destructive",
      });
    }
  };

  const loadAvailableOrders = async () => {
    try {
      const orders = await apiRequest("GET", "/api/driver/available-orders");
      setAvailableOrders(orders || []);
    } catch (error) {
      console.error("Failed to load orders:", error);
    }
  };

  const acceptOrder = async (order: DeliveryOrder) => {
    try {
      const accepted = await apiRequest("POST", "/api/driver/orders/accept", {
        orderId: order.id,
      });
      setActiveDelivery(accepted);
      setAvailableOrders((prev) => prev.filter((o) => o.id !== order.id));
      toast({
        title: "Pedido aceito!",
        description: `Dirija-se para o endereço fornecido`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao aceitar pedido",
        variant: "destructive",
      });
    }
  };

  const completeDelivery = async () => {
    if (!activeDelivery) return;
    try {
      await apiRequest("PATCH", `/api/driver/orders/${activeDelivery.id}/complete`);
      setActiveDelivery(null);
      setStats((prev) => ({
        ...prev,
        deliveriesCompleted: prev.deliveriesCompleted + 1,
        totalEarnings: prev.totalEarnings + parseFloat(activeDelivery.total || "0"),
      }));
      toast({
        title: "Entrega concluída!",
        description: "Pronto para o próximo pedido",
      });
      await loadAvailableOrders();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao concluir entrega",
        variant: "destructive",
      });
    }
  };

  const toggleOnline = () => {
    setIsOnline(!isOnline);
    toast({
      title: isOnline ? "Offline" : "Online",
      description: isOnline
        ? "Você está offline"
        : "Você está pronto para receber pedidos",
    });
    if (!isOnline) {
      loadAvailableOrders();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8">
            <div className="text-center space-y-4">
              <Truck className="h-12 w-12 mx-auto animate-pulse text-muted-foreground" />
              <p>Carregando dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Dashboard - Entregador</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={isOnline ? "default" : "outline"}
              onClick={toggleOnline}
              data-testid="button-toggle-online"
            >
              {isOnline ? "🟢 Online" : "⚫ Offline"}
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganhos Hoje</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.totalEarnings.toFixed(2)}
              </div>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3" /> +15% vs ontem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregas</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.deliveriesCompleted}</div>
              <p className="text-xs text-muted-foreground mt-2">Hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliação</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">⭐ {stats.rating}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.acceptanceRate} entregas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa Aceitação</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.acceptanceRate}%</div>
              <p className="text-xs text-muted-foreground mt-2">Excelente!</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Delivery */}
          {activeDelivery && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>🚚 Entrega Ativa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">
                      #{activeDelivery.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activeDelivery.customerName}
                    </p>
                  </div>
                  <Badge>Em Rota</Badge>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex gap-3 p-3 bg-muted rounded-md">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Endereço de Entrega</p>
                      <p className="text-sm font-medium">
                        {activeDelivery.deliveryAddress}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 bg-muted rounded-md">
                    <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone do Cliente</p>
                      <p className="text-sm font-medium">
                        {activeDelivery.customerPhone}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-3 bg-muted rounded-md">
                    <DollarSign className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Valor</p>
                      <p className="text-sm font-medium">
                        R$ {parseFloat(activeDelivery.total || "0").toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={completeDelivery}
                  data-testid="button-complete-delivery"
                >
                  ✓ Marcar como Entregue
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Available Orders */}
          {isOnline && (
            <div className={activeDelivery ? "lg:col-span-1" : "lg:col-span-3"}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    📦 Pedidos Disponíveis ({availableOrders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {availableOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum pedido disponível no momento</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {availableOrders.map((order) => (
                        <div
                          key={order.id}
                          className="border rounded-md p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-sm">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.customerName}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              R$ {parseFloat(order.total || "0").toFixed(2)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {order.deliveryAddress}
                          </p>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => acceptOrder(order)}
                            data-testid={`button-accept-order-${order.id}`}
                          >
                            Aceitar Entrega
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Offline Message */}
          {!isOnline && !activeDelivery && (
            <Card className="lg:col-span-3">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="space-y-4">
                  <Truck className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold">Você está offline</h3>
                  <p className="text-muted-foreground">
                    Ative seu status online para começar a receber pedidos
                  </p>
                  <Button size="lg" onClick={toggleOnline} data-testid="button-go-online">
                    🟢 Ficar Online
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
