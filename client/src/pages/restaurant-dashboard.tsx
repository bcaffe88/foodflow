import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/api";
import { LogOut, Plus, Package, MapPin, BarChart3, Truck, Phone, Navigation } from "lucide-react";
import type { Order } from "@shared/schema";

interface AssignedDriver {
  id: string;
  name: string;
  phone: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface OrderWithDriver extends Order {
  assignedDriver?: AssignedDriver;
}

export default function RestaurantDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [orders, setOrders] = useState<OrderWithDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem("accessToken");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== "restaurant_owner") {
        toast({ title: "Acesso negado", description: "Você não tem permissão para acessar esta área", variant: "destructive" });
        navigate("/login");
        return;
      }
      setUser(parsedUser);
      setIsAuthenticated(true);
      loadDashboard();
    } catch (error) {
      navigate("/login");
    }
  }, []);

  // WebSocket real-time updates
  useWebSocket({
    userId: user?.id || "",
    userType: "restaurant_owner",
    token: localStorage.getItem("accessToken") || "",
    tenantId: user?.tenantId,
    onMessage: (notification) => {
      // Quando motorista aceita pedido
      if (notification.action === "driver_accepted_order" && notification.driver) {
        const orderId = notification.orderId;
        const driver = notification.driver;
        
        setOrders(prev =>
          prev.map(order =>
            order.id === orderId
              ? {
                  ...order,
                  status: "out_for_delivery",
                  assignedDriver: {
                    id: driver.id,
                    name: driver.name,
                    phone: driver.phone,
                    location: driver.location,
                  },
                }
              : order
          )
        );

        toast({
          title: "Motorista Atribuído!",
          description: `${driver.name} saiu para entregar seu pedido!`,
        });
      }
    },
  });

  const loadDashboard = async () => {
    try {
      const [dashboard, ordersResponse] = await Promise.all([
        apiRequest("GET", "/api/restaurant/dashboard"),
        apiRequest("GET", "/api/restaurant/orders"),
      ]);

      setDashboardData(dashboard || {});
      // Extrair array data do response (endpoint retorna { data: orders, total, page, limit, pages })
      const orders = ordersResponse?.data || ordersResponse || [];
      setOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      console.error("Dashboard load error:", error);
      // Fallback mock data
      setDashboardData({
        pendingOrdersCount: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: [],
      });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleViewDriverMap = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    navigate(`/restaurant/driver-map?tenantId=${user.tenantId}`);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Atualizar estado local ANTES de fazer request para atualizar visualmente
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus as any } : order
      ));

      await apiRequest("PATCH", `/api/restaurant/orders/${orderId}/status`, {
        status: newStatus,
      });

      toast({ title: "Pedido atualizado!" });
      
      // Carregar dados atualizados após sucesso
      setTimeout(() => loadDashboard(), 1000);
    } catch (error) {
      // Se falhar, recarregar dados para reverter mudança local
      loadDashboard();
      toast({ title: "Erro ao atualizar pedido", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Seu Restaurante</h1>
          <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <h3 className="text-muted-foreground text-sm mb-2">Pedidos Pendentes</h3>
            <p className="text-3xl font-bold" data-testid="text-pending-orders">
              {dashboardData?.pendingOrdersCount || 0}
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-muted-foreground text-sm mb-2">Total de Pedidos</h3>
            <p className="text-3xl font-bold">{dashboardData?.totalOrders || 0}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-muted-foreground text-sm mb-2">Receita (30 dias)</h3>
            <p className="text-3xl font-bold" data-testid="text-revenue">
              R$ {(dashboardData?.totalRevenue || 0).toFixed(2)}
            </p>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <Button onClick={() => navigate("/restaurant/products")} data-testid="button-manage-products">
            <Package className="h-4 w-4 mr-2" />
            Gerenciar Produtos
          </Button>
          <Button onClick={handleViewDriverMap} variant="outline" data-testid="button-view-driver-map">
            <MapPin className="h-4 w-4 mr-2" />
            Ver Entregadores
          </Button>
          <Button onClick={() => navigate("/restaurant/analytics")} variant="outline" data-testid="button-view-analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline" onClick={() => navigate("/restaurant/settings")} data-testid="button-settings">
            Configurações
          </Button>
        </div>

        {/* All Orders */}
        <div>
          <h2 className="text-xl font-bold mb-4">Fila de Pedidos</h2>
          {orders?.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum pedido</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders?.map((order: OrderWithDriver) => {
                const statusColors: { [key: string]: string } = {
                  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                  preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
                  ready: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                  out_for_delivery: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                  delivered: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
                };

                return (
                  <Card key={order.id} className="p-6" data-testid={`card-order-${order.id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{order.customerName}</h3>
                        <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                      </div>
                      <Badge className={statusColors[order.status] || "bg-gray-100"}>{order.status}</Badge>
                    </div>
                    <p className="text-sm mb-2 line-clamp-1">{order.deliveryAddress}</p>
                    
                    {/* Motorista Atribuído */}
                    {order.assignedDriver && order.status === "out_for_delivery" && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <div>
                              <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">{order.assignedDriver.name}</p>
                              <div className="flex gap-3 mt-1">
                                <a
                                  href={`https://wa.me/${order.assignedDriver.phone.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                  data-testid={`link-whatsapp-driver-${order.id}`}
                                >
                                  <Phone className="h-3 w-3" />
                                  WhatsApp
                                </a>
                                {order.assignedDriver.location && (
                                  <a
                                    href={`https://www.google.com/maps/search/${order.assignedDriver.location.latitude},${order.assignedDriver.location.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    data-testid={`link-map-driver-${order.id}`}
                                  >
                                    <Navigation className="h-3 w-3" />
                                    Localização
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">R$ {Number(order.total).toFixed(2)}</p>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="px-3 py-1 rounded-md border border-border text-sm"
                        data-testid={`select-status-${order.id}`}
                      >
                        <option value="pending">Pendente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="preparing">Preparando</option>
                        <option value="ready">Pronto</option>
                        <option value="out_for_delivery">Entregando</option>
                        <option value="delivered">Entregue</option>
                      </select>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
