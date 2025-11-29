import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { LogOut, MapPin, Clock, DollarSign, TrendingUp, Wifi, WifiOff } from "lucide-react";
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
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

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
      connectWebSocket();
      startGPSTracking();
    } else {
      disconnectWebSocket();
      stopGPSTracking();
    }

    return () => {
      disconnectWebSocket();
      stopGPSTracking();
    };
  }, [isOnline]);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/driver`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        ws.send(JSON.stringify({
          action: "auth",
          userId: user.id,
          tenantId: user.tenantId,
        }));
        toast({ title: "Conectado", description: "Online e recebendo pedidos em tempo real" });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.action === "orders_update") {
            setAvailableOrders(message.orders || []);
          } else if (message.action === "new_order") {
            setAvailableOrders((prev) => [message.order, ...prev]);
            toast({ title: "Novo pedido!", description: "Um novo pedido está disponível" });
          }
        } catch (error) {
          console.error("WS message parse error:", error);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      const interval = setInterval(loadAvailableOrders, 5000);
      wsRef.current = { close: () => clearInterval(interval) } as any;
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current && wsRef.current.close) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const startGPSTracking = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not available");
      return;
    }

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          if (wsRef.current && wsConnected) {
            wsRef.current.send(JSON.stringify({
              action: "location",
              data: { lat: latitude, lng: longitude },
            }));
          } else {
            apiRequest("POST", "/api/driver/location", { latitude, longitude }).catch(() => {});
          }
        },
        (error) => {
          console.warn("Geolocation error:", error);
        }
      );
    }, 10000);

    return () => clearInterval(interval);
  };

  const stopGPSTracking = () => {
    // Already handled by effect cleanup
  };

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
        description: isOnline ? "Você está offline" : "Pronto para receber pedidos",
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
      toast({ title: "Entregue!", description: "Pronto para o próximo pedido" });
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

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <p className="text-sm md:text-base">Carregando seu dashboard...</p>
      </Card>
    </div>
  );

  const mockStats = {
    totalEarnings: 450.00,
    deliveriesCompleted: 12,
    rating: 4.8,
    acceptanceRate: 94,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">Dashboard Motorista</h1>
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant={isOnline ? "default" : "outline"}
              onClick={toggleOnline}
              size="sm"
              data-testid="button-toggle-online"
              className="gap-1 md:gap-2 text-xs md:text-sm"
            >
              {isOnline ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              data-testid="button-logout"
              size="sm"
              className="gap-1 md:gap-2 text-xs md:text-sm"
            >
              <LogOut className="h-3 md:h-4 w-3 md:w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8"
        >
          {[
            { icon: DollarSign, label: "Ganhos Hoje", value: `R$ ${mockStats.totalEarnings.toFixed(2)}`, trend: "+15% vs ontem" },
            { icon: TrendingUp, label: "Entregas", value: mockStats.deliveriesCompleted, trend: "Hoje" },
            { icon: Clock, label: "Avaliação", value: `⭐ ${mockStats.rating}`, trend: `${mockStats.acceptanceRate} entregas` },
            { icon: MapPin, label: "Taxa Aceitação", value: `${mockStats.acceptanceRate}%`, trend: "Excelente!" },
          ].map((stat, idx) => (
            <motion.div key={idx} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <Card className="p-4 md:p-6 h-full">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-muted-foreground text-xs md:text-sm font-medium">{stat.label}</h3>
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground">{stat.trend}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Active Order */}
          {activeOrder && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
              <Card className="p-4 md:p-6">
                <h2 className="font-bold text-lg md:text-xl mb-4">Pedido Ativo</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-base md:text-lg">#{activeOrder.id.slice(0, 8)}</p>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">{activeOrder.customerName}</p>
                    </div>
                    <Badge variant="default" className="text-xs md:text-sm">Em Rota</Badge>
                  </div>
                  <div className="flex gap-2 md:gap-3 p-3 bg-muted rounded text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-xs md:text-sm line-clamp-2">{activeOrder.deliveryAddress}</p>
                  </div>
                  <div className="flex gap-2 md:gap-3 p-3 bg-muted rounded text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-xs md:text-sm">Prioridade: Próximos 30 minutos</p>
                  </div>
                  <Button 
                    className="w-full text-xs md:text-base" 
                    onClick={() => completeOrder(activeOrder.id)} 
                    data-testid="button-complete-delivery"
                  >
                    Marcar Entregue
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Available Orders */}
          {isOnline && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={activeOrder ? "lg:col-span-1" : "lg:col-span-3"}>
              <h2 className="font-bold text-lg md:text-xl mb-3 md:mb-4">Pedidos ({availableOrders.length})</h2>
              <div className="space-y-2 md:space-y-3 max-h-96 overflow-y-auto">
                {availableOrders.length === 0 ? (
                  <Card className="p-4 md:p-6 text-center text-muted-foreground">
                    <p className="text-xs md:text-sm">Nenhum pedido disponível agora</p>
                  </Card>
                ) : (
                  availableOrders.map((order) => (
                    <motion.div key={order.id} whileHover={{ scale: 1.02 }}>
                      <Card className="p-3 md:p-4">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm md:text-base">#{order.id.slice(0, 8)}</p>
                            <p className="text-xs md:text-sm text-muted-foreground truncate">{order.customerName}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs md:text-sm flex-shrink-0">
                            R$ {Number(order.total).toFixed(2)}
                          </Badge>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-3">
                          {order.deliveryAddress}
                        </p>
                        <Button
                          size="sm"
                          className="w-full text-xs md:text-sm"
                          onClick={() => acceptOrder(order.id)}
                          data-testid={`button-accept-order-${order.id}`}
                        >
                          Aceitar
                        </Button>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Offline Message */}
          {!isOnline && !activeOrder && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3">
              <Card className="p-8 md:p-12 text-center">
                <p className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Você está offline</p>
                <p className="text-muted-foreground mb-6 md:mb-8 text-sm md:text-base">
                  Ative seu status online para começar a receber pedidos
                </p>
                <Button size="lg" onClick={toggleOnline} data-testid="button-go-online" className="text-sm md:text-base">
                  Ficar Online
                </Button>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
