import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  ChefHat,
  CheckCircle,
  AlertCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";

interface KitchenOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  items: Array<{
    productName: string;
    quantity: number;
  }>;
  status: string;
  createdAt: Date;
  acceptedAt?: Date;
}

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Fetch orders from API
  const { data: restaurantOrders, isLoading } = trpc.orders.list.useQuery({ restaurantId: 1 });
  const updateStatusMutation = trpc.orders.updateStatus.useMutation();

  // Filter orders for kitchen (pending and accepted)
  useEffect(() => {
    if (restaurantOrders) {
      const kitchenOrders = restaurantOrders
        .filter(
          (order: any) =>
            order.status === "pending" || 
            order.status === "confirmed" || 
            order.status === "preparing"
        )
        .map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          items: order.orderItems || [],
          status: order.status,
          createdAt: order.createdAt,
          acceptedAt: order.acceptedAt,
        }));
      setOrders(kitchenOrders);

      // Play sound for new pending orders
      if (
        soundEnabled &&
        kitchenOrders.some((o: any) => o.status === "pending")
      ) {
        playNotificationSound();
      }
    }
  }, [restaurantOrders, soundEnabled]);

  const playNotificationSound = () => {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleAcceptOrder = async (orderId: number) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: orderId,
        status: "preparing",
      });
      toast.success("Pedido marcado como em preparação");
    } catch (error) {
      toast.error("Erro ao atualizar status do pedido");
    }
  };

  const handleMarkReady = async (orderId: number) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: orderId,
        status: "ready",
      });
      toast.success("Pedido marcado como pronto!");
      playNotificationSound();
    } catch (error) {
      toast.error("Erro ao marcar pedido como pronto");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-800 border-red-300";
      case "confirmed":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "ready":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳ Pendente";
      case "confirmed":
        return "✅ Confirmado";
      case "preparing":
        return "👨‍🍳 Preparando";
      case "ready":
        return "🎉 Pronto";
      default:
        return status;
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Painel de Cozinha
            </h1>
          </div>
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-red-600">
                  {pendingOrders.length}
                </div>
                <div className="text-sm text-gray-600">Pendentes</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-600">
                  {preparingOrders.length}
                </div>
                <div className="text-sm text-gray-600">Preparando</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-600">
                  {readyOrders.length}
                </div>
                <div className="text-sm text-gray-600">Prontos</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <ChefHat className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-purple-600">
                  {orders.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pendentes */}
            <div>
              <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Pendentes ({pendingOrders.length})
              </h2>
              <div className="space-y-3">
                {pendingOrders.length === 0 ? (
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="pt-6 text-center text-gray-500">
                      Nenhum pedido pendente
                    </CardContent>
                  </Card>
                ) : (
                  pendingOrders.map((order) => (
                    <Card
                      key={order.id}
                      className={`border-2 cursor-pointer transition ${
                        selectedOrderId === order.id
                          ? "border-red-500 bg-red-50"
                          : "border-red-200 hover:border-red-400"
                      }`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              #{order.orderNumber}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              {order.customerName}
                            </p>
                          </div>
                          <Badge className="bg-red-600">Novo!</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-sm text-gray-700">
                              {item.quantity}x {item.productName}
                            </div>
                          ))}
                        </div>
                        <Button
                          className="w-full bg-red-600 hover:bg-red-700"
                          onClick={() => handleAcceptOrder(order.id)}
                        >
                          Aceitar Pedido
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Preparando */}
            <div>
              <h2 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Preparando ({preparingOrders.length})
              </h2>
              <div className="space-y-3">
                {preparingOrders.length === 0 ? (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6 text-center text-gray-500">
                      Nenhum pedido em preparação
                    </CardContent>
                  </Card>
                ) : (
                  preparingOrders.map((order) => (
                    <Card
                      key={order.id}
                      className={`border-2 cursor-pointer transition ${
                        selectedOrderId === order.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-blue-200 hover:border-blue-400"
                      }`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              #{order.orderNumber}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              {order.customerName}
                            </p>
                          </div>
                          <Badge className="bg-blue-600">Preparando</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-sm text-gray-700">
                              {item.quantity}x {item.productName}
                            </div>
                          ))}
                        </div>
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleMarkReady(order.id)}
                        >
                          Marcar como Pronto
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Prontos */}
            <div>
              <h2 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Prontos ({readyOrders.length})
              </h2>
              <div className="space-y-3">
                {readyOrders.length === 0 ? (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6 text-center text-gray-500">
                      Nenhum pedido pronto
                    </CardContent>
                  </Card>
                ) : (
                  readyOrders.map((order) => (
                    <Card
                      key={order.id}
                      className={`border-2 cursor-pointer transition ${
                        selectedOrderId === order.id
                          ? "border-green-500 bg-green-50"
                          : "border-green-200 hover:border-green-400"
                      }`}
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              #{order.orderNumber}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              {order.customerName}
                            </p>
                          </div>
                          <Badge className="bg-green-600">Pronto!</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-sm text-gray-700">
                              {item.quantity}x {item.productName}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          ✅ Aguardando entrega
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
