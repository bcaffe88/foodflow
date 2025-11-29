import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { ChefHat, Clock, Volume2, VolumeX, AlertCircle, CheckCircle, LogOut } from "lucide-react";

interface KitchenOrder {
  id: string;
  customerName: string;
  items: Array<{ name: string; quantity: number }>;
  status: "pending" | "confirmed" | "preparing" | "ready";
  createdAt: string;
  orderNotes?: string;
}

export default function KitchenDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");
    
    if (!token || !user) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(user);
      if (parsedUser.role !== "restaurant_owner") {
        navigate("/login");
        return;
      }
    } catch {
      navigate("/login");
      return;
    }

    loadKitchenOrders();
    const interval = setInterval(loadKitchenOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadKitchenOrders = async () => {
    try {
      const response = await apiRequest("GET", "/api/kitchen/orders");
      setOrders(response || []);
      
      if (soundEnabled && response?.some((o: KitchenOrder) => o.status === "pending")) {
        playNotificationSound();
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load kitchen orders:", error);
      setIsLoading(false);
    }
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.warn("Could not play sound:", e);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiRequest("PATCH", `/api/kitchen/orders/${orderId}/status`, {
        status: newStatus,
      });
      
      toast({
        title: "Status atualizado",
        description: `Pedido marcado como ${newStatus}`,
      });
      
      await loadKitchenOrders();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const confirmingOrders = orders.filter((o) => o.status === "confirmed");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins > 0 ? `${diffMins}m atrás` : "Agora";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <ChefHat className="h-12 w-12 mx-auto animate-pulse text-orange-600 mb-4" />
            <p>Carregando pedidos da cozinha...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">Painel de Cozinha</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="gap-2"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-4 w-4" />
                  Som Ativado
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
                  Som Desativado
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{pendingOrders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{confirmingOrders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preparando</CardTitle>
              <ChefHat className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{preparingOrders.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prontos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{readyOrders.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Kitchen Board */}
        <div className="grid grid-cols-1 gap-6">
          {/* Pending Orders */}
          {pendingOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                ⏳ Pendentes ({pendingOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-l-red-500 bg-red-50">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">#{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                        </div>
                        <Badge variant="destructive">{formatTime(order.createdAt)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="font-semibold text-sm mb-2">Itens:</p>
                        <ul className="text-sm space-y-1">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="text-gray-700">
                              {item.quantity}x {item.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {order.orderNotes && (
                        <div className="p-2 bg-yellow-100 rounded text-sm">
                          <strong>Observações:</strong> {order.orderNotes}
                        </div>
                      )}
                      <Button
                        className="w-full bg-yellow-500 hover:bg-yellow-600"
                        onClick={() => updateOrderStatus(order.id, "preparing")}
                        data-testid={`button-start-order-${order.id}`}
                      >
                        👨‍🍳 Começar Preparo
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Preparing Orders */}
          {preparingOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                👨‍🍳 Preparando ({preparingOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {preparingOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-l-blue-500 bg-blue-50">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">#{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                        </div>
                        <Badge className="bg-blue-600">{formatTime(order.createdAt)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="font-semibold text-sm mb-2">Itens:</p>
                        <ul className="text-sm space-y-1">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="text-gray-700">
                              {item.quantity}x {item.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button
                        className="w-full bg-green-500 hover:bg-green-600"
                        onClick={() => updateOrderStatus(order.id, "ready")}
                        data-testid={`button-complete-order-${order.id}`}
                      >
                        ✓ Pronto para Entrega
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Ready Orders */}
          {readyOrders.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                ✅ Prontos para Entrega ({readyOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-l-green-500 bg-green-50">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">#{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                        </div>
                        <Badge className="bg-green-600">{formatTime(order.createdAt)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="font-semibold text-sm mb-2">Itens:</p>
                        <ul className="text-sm space-y-1">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="text-gray-700">
                              {item.quantity}x {item.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-xs text-green-700 font-semibold">🎉 Pedido pronto! Aguardando motoboy.</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {orders.length === 0 && (
            <Card className="p-12 text-center">
              <ChefHat className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Nenhum pedido para preparar no momento</p>
              <p className="text-gray-400 text-sm mt-2">Os pedidos aparecerão aqui assim que chegarem</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
