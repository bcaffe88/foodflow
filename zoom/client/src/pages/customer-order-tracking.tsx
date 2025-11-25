import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { ChevronLeft, MapPin, Clock, Phone } from "lucide-react";
import type { Order, OrderItem } from "@shared/schema";

const statusStages = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];
const statusLabels: Record<string, string> = {
  pending: "Confirmando",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Pronto para retirada",
  out_for_delivery: "Saindo para entrega",
  delivered: "Entregue",
};

const statusEmojis: Record<string, React.ReactNode> = {
  pending: "⏳",
  confirmed: "✅",
  preparing: "👨‍🍳",
  ready: "📦",
  out_for_delivery: "🏍️",
  delivered: "🎉",
};

export default function CustomerOrderTracking() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/customer/order/:id");
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      loadOrder();
      const interval = setInterval(loadOrder, 5000);
      return () => clearInterval(interval);
    }
  }, [params?.id]);

  const loadOrder = async () => {
    try {
      if (!params?.id) return;
      const orderData = await apiRequest("GET", `/api/orders/${params.id}`);
      const itemsData = await apiRequest("GET", `/api/orders/${params.id}/items`);
      setOrder(orderData);
      setOrderItems(itemsData);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar pedido", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-4">Carregando pedido...</div>;
  if (!order) return <div className="p-4">Pedido não encontrado</div>;

  const currentStageIndex = statusStages.indexOf(order.status);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/customer/orders")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt || Date.now()).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Timeline/Progress */}
        <Card className="p-6 mb-6">
          <h2 className="font-bold mb-6">Status do Pedido</h2>
          <div className="space-y-4">
            {statusStages.map((stage, index) => (
              <div key={stage} className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                      index <= currentStageIndex
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {statusEmojis[stage]}
                  </div>
                  {index < statusStages.length - 1 && (
                    <div
                      className={`w-1 h-12 my-2 ${
                        index < currentStageIndex ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${index <= currentStageIndex ? "" : "text-muted-foreground"}`}>
                    {statusLabels[stage]}
                  </p>
                  {index === currentStageIndex && (
                    <p className="text-sm text-primary">Agora</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Delivery Info */}
        {order.deliveryType === "delivery" && (
          <Card className="p-6 mb-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço de Entrega
            </h2>
            <p className="text-sm mb-2">{order.deliveryAddress}</p>
            {order.deliveryReference && (
              <p className="text-sm text-muted-foreground">Referência: {order.deliveryReference}</p>
            )}
            {order.driverPhone && (
              <Button variant="outline" className="mt-4 w-full" onClick={() => window.open(`tel:${order.driverPhone}`)}>
                <Phone className="h-4 w-4 mr-2" />
                Ligar para Motorista
              </Button>
            )}
          </Card>
        )}

        {/* Items */}
        <Card className="p-6 mb-6">
          <h2 className="font-bold mb-4">Itens do Pedido</h2>
          <div className="space-y-3">
            {orderItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center pb-3 border-b last:border-0">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                </div>
                <p className="font-semibold">R$ {(Number(item.price) * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Total */}
        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>R$ {(Number(order.total) * 0.85).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxa de Entrega</span>
              <span>R$ {(Number(order.total) * 0.15).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-3">
              <span>Total</span>
              <span>R$ {Number(order.total).toFixed(2)}</span>
            </div>
            <div className="mt-3">
              <Badge variant="outline">{order.paymentMethod}</Badge>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
