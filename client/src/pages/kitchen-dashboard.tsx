import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
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
        title: "✓ Status atualizado",
        description: `Pedido movido para ${newStatus === "preparing" ? "Preparando" : "Pronto"}`,
      });
      
      await loadKitchenOrders();
    } catch (error) {
      toast({
        title: "Erro na atualização",
        description: "Não conseguimos atualizar. Tente novamente.",
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
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins > 0 ? `${diffMins}m` : "Agora";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <ChefHat className="h-12 w-12 mx-auto animate-pulse text-orange-600 mb-4" />
            <p className="text-sm md:text-base">Carregando pedidos da cozinha...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-3 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 mb-6 md:mb-8"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <ChefHat className="h-7 md:h-8 w-7 md:w-8 text-orange-600" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Cozinha Premium</h1>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="gap-1 md:gap-2 text-xs md:text-sm flex-1 md:flex-none"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="h-3 md:h-4 w-3 md:w-4" />
                  <span className="hidden sm:inline">Som On</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3 md:h-4 w-3 md:w-4" />
                  <span className="hidden sm:inline">Som Off</span>
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              data-testid="button-logout"
              size="sm"
              className="gap-1 md:gap-2 text-xs md:text-sm flex-1 md:flex-none"
            >
              <LogOut className="h-3 md:h-4 w-3 md:w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-8"
        >
          {[
            { label: "Pendentes", count: pendingOrders.length, color: "text-red-600", icon: AlertCircle },
            { label: "Preparando", count: preparingOrders.length, color: "text-blue-600", icon: ChefHat },
            { label: "Prontos", count: readyOrders.length, color: "text-green-600", icon: CheckCircle },
            { label: "Total", count: orders.length, color: "text-gray-600", icon: Clock },
          ].map((stat) => (
            <motion.div key={stat.label} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-4">
                  <CardTitle className="text-xs md:text-sm font-medium">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4" />
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0">
                  <div className={`text-2xl md:text-3xl font-bold ${stat.color}`}>{stat.count}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Kitchen Board */}
        <div className="space-y-6 md:space-y-8">
          {/* Pending Orders */}
          {pendingOrders.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-lg md:text-xl font-bold text-red-600 mb-3 md:mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Aguardando Preparo ({pendingOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {pendingOrders.map((order) => (
                  <motion.div key={order.id} whileHover={{ scale: 1.02 }}>
                    <Card className="border-l-4 border-l-red-500 bg-red-50 h-full flex flex-col">
                      <CardHeader className="pb-2 md:pb-3 p-3 md:p-4">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-base md:text-lg">#{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                            <p className="text-xs md:text-sm text-gray-600 truncate">{order.customerName}</p>
                          </div>
                          <Badge variant="destructive" className="text-xs">{formatTime(order.createdAt)}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 p-3 md:p-4 pt-0 flex-1 flex flex-col">
                        <div className="flex-1">
                          <p className="font-semibold text-xs md:text-sm mb-2">Itens:</p>
                          <ul className="text-xs md:text-sm space-y-1">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="text-gray-700">
                                {item.quantity}x {item.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {order.orderNotes && (
                          <div className="p-2 bg-yellow-100 rounded text-xs border-l-2 border-yellow-400">
                            <strong>Obs:</strong> {order.orderNotes}
                          </div>
                        )}
                        <Button
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-xs md:text-sm"
                          onClick={() => updateOrderStatus(order.id, "preparing")}
                          data-testid={`button-start-order-${order.id}`}
                        >
                          Iniciar Preparo
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Preparing Orders */}
          {preparingOrders.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="text-lg md:text-xl font-bold text-blue-600 mb-3 md:mb-4 flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Preparando ({preparingOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {preparingOrders.map((order) => (
                  <motion.div key={order.id} whileHover={{ scale: 1.02 }}>
                    <Card className="border-l-4 border-l-blue-500 bg-blue-50 h-full flex flex-col">
                      <CardHeader className="pb-2 md:pb-3 p-3 md:p-4">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-base md:text-lg">#{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                            <p className="text-xs md:text-sm text-gray-600 truncate">{order.customerName}</p>
                          </div>
                          <Badge className="bg-blue-600 text-xs">{formatTime(order.createdAt)}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 p-3 md:p-4 pt-0 flex-1 flex flex-col">
                        <div className="flex-1">
                          <p className="font-semibold text-xs md:text-sm mb-2">Itens:</p>
                          <ul className="text-xs md:text-sm space-y-1">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="text-gray-700">
                                {item.quantity}x {item.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button
                          className="w-full bg-green-500 hover:bg-green-600 text-xs md:text-sm"
                          onClick={() => updateOrderStatus(order.id, "ready")}
                          data-testid={`button-complete-order-${order.id}`}
                        >
                          Pronto para Entrega
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Ready Orders */}
          {readyOrders.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="text-lg md:text-xl font-bold text-green-600 mb-3 md:mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Prontos para Entrega ({readyOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {readyOrders.map((order) => (
                  <motion.div key={order.id} animate={{ boxShadow: ["0 0 0 0 rgba(34, 197, 94, 0)", "0 0 0 10px rgba(34, 197, 94, 0)"] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Card className="border-l-4 border-l-green-500 bg-green-50 h-full">
                      <CardHeader className="pb-2 md:pb-3 p-3 md:p-4">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-base md:text-lg">#{order.id.slice(0, 8).toUpperCase()}</CardTitle>
                            <p className="text-xs md:text-sm text-gray-600 truncate">{order.customerName}</p>
                          </div>
                          <Badge className="bg-green-600 text-xs">{formatTime(order.createdAt)}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 md:p-4 pt-0">
                        <div>
                          <p className="font-semibold text-xs md:text-sm mb-2">Itens:</p>
                          <ul className="text-xs md:text-sm space-y-1 mb-3">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="text-gray-700">
                                {item.quantity}x {item.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-xs text-green-700 font-semibold text-center py-2 bg-green-100 rounded">✓ Aguardando motorista</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {orders.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-8 md:p-12 text-center">
                <ChefHat className="h-12 md:h-16 w-12 md:w-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-base md:text-lg font-semibold">Nenhum pedido aguardando</p>
                <p className="text-gray-400 text-xs md:text-sm mt-2">Os pedidos aparecerão aqui em tempo real</p>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
