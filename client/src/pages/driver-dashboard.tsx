import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { LogOut, MapPin, Clock, DollarSign, TrendingUp } from "lucide-react";
import type { Order, DriverProfile } from "@shared/schema";

interface DriverData extends DriverProfile {
  isOnline?: boolean;
}

export default function DriverDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");
    
    if (!token || !user) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(user);
      if (parsedUser.role !== "driver") {
        toast({ title: "Acesso negado", description: "Apenas motoristas podem acessar", variant: "destructive" });
        navigate("/login");
        return;
      }
    } catch (error) {
      navigate("/login");
      return;
    }

    loadDriverData();
  }, []);

  useEffect(() => {
    if (isOnline) {
      const interval = setInterval(loadAvailableOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  const loadDriverData = async () => {
    try {
      const data = await apiRequest("GET", "/api/driver/profile");
      setDriverData(data);
      setIsOnline(data.isOnline);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar perfil", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableOrders = async () => {
    try {
      const orders = await apiRequest("GET", "/api/driver/available-orders");
      setAvailableOrders(orders);
    } catch (error) {
    }
  };

  const toggleOnline = async () => {
    try {
      await apiRequest("PATCH", "/api/driver/status", {
        isOnline: !isOnline,
      });
      setIsOnline(!isOnline);
      toast({
        title: isOnline ? "Offline" : "Online",
        description: isOnline ? "Você está offline" : "Você está pronto para receber pedidos",
      });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao atualizar status", variant: "destructive" });
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const order = await apiRequest("POST", "/api/driver/orders/accept", {
        orderId,
      });
      setActiveOrder(order);
      setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast({ title: "Pedido aceito!", description: "Navegue para o restaurante" });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao aceitar pedido", variant: "destructive" });
    }
  };

  const completeOrder = async (orderId: string) => {
    try {
      await apiRequest("PATCH", `/api/driver/orders/${orderId}/complete`);
      setActiveOrder(null);
      toast({ title: "Pedido entregue!", description: "Pronto para o próximo" });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao completar pedido", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (isLoading) return <div className="p-4">Carregando...</div>;

  const mockStats = {
    totalEarnings: 450.00,
    deliveriesCompleted: 12,
    rating: 4.8,
    acceptanceRate: 94,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard - Motorista</h1>
          <div className="flex items-center gap-3">
            <Button
              variant={isOnline ? "default" : "outline"}
              onClick={toggleOnline}
              size="sm"
              data-testid="button-toggle-online"
            >
              {isOnline ? "🟢 Online" : "⚫ Offline"}
            </Button>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <h3 className="text-muted-foreground text-sm mb-2">Ganhos Hoje</h3>
            <p className="text-3xl font-bold">R$ {mockStats.totalEarnings.toFixed(2)}</p>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +15% vs ontem
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-muted-foreground text-sm mb-2">Entregas</h3>
            <p className="text-3xl font-bold">{mockStats.deliveriesCompleted}</p>
            <p className="text-xs text-muted-foreground mt-2">Hoje</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-muted-foreground text-sm mb-2">Avaliação</h3>
            <p className="text-3xl font-bold">⭐ {mockStats.rating}</p>
            <p className="text-xs text-muted-foreground mt-2">Baseado em {mockStats.acceptanceRate} entregas</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-muted-foreground text-sm mb-2">Taxa Aceitação</h3>
            <p className="text-3xl font-bold">{mockStats.acceptanceRate}%</p>
            <p className="text-xs text-muted-foreground mt-2">Excelente!</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Order */}
          {activeOrder && (
            <Card className="p-6 lg:col-span-2">
              <h2 className="font-bold mb-4">Pedido Ativo</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">#{activeOrder.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">{activeOrder.customerName}</p>
                  </div>
                  <Badge variant="default">Em Rota</Badge>
                </div>
                <div className="flex gap-2 p-3 bg-muted rounded">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{activeOrder.deliveryAddress}</p>
                </div>
                <div className="flex gap-2 p-3 bg-muted rounded">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">Prioridade: Próximos 30 minutos</p>
                </div>
                <Button className="w-full" onClick={() => completeOrder(activeOrder.id)} data-testid="button-complete-delivery">
                  Marcar como Entregue
                </Button>
              </div>
            </Card>
          )}

          {/* Available Orders */}
          {isOnline && (
            <div className={activeOrder ? "lg:col-span-1" : "lg:col-span-3"}>
              <h2 className="font-bold mb-4">Pedidos Disponíveis ({availableOrders.length})</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {availableOrders.length === 0 ? (
                  <Card className="p-4 text-center text-muted-foreground">
                    <p>Nenhum pedido disponível no momento</p>
                  </Card>
                ) : (
                  availableOrders.map((order) => (
                    <Card key={order.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{order.customerName}</p>
                        </div>
                        <Badge variant="secondary">
                          R$ {Number(order.total).toFixed(2)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {order.deliveryAddress}
                      </p>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => acceptOrder(order.id)}
                        data-testid={`button-accept-order-${order.id}`}
                      >
                        Aceitar Entrega
                      </Button>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Offline Message */}
          {!isOnline && !activeOrder && (
            <Card className="p-8 lg:col-span-3 text-center">
              <p className="text-lg font-semibold mb-4">Você está offline</p>
              <p className="text-muted-foreground mb-6">
                Ative seu status online para receber pedidos
              </p>
              <Button size="lg" onClick={toggleOnline} data-testid="button-go-online">
                Ficar Online
              </Button>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
