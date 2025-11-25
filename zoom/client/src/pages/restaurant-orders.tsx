import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { LogOut, ChevronLeft, Clock } from "lucide-react";
import type { Order, OrderItem } from "@shared/schema";

export default function RestaurantOrders() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const allOrders = await apiRequest("GET", "/api/restaurant/orders");
      setOrders(allOrders);
      // Carregar items em paralelo para melhor performance
      const itemsMap: Record<string, OrderItem[]> = {};
      await Promise.all(
        allOrders.map(async (order: Order) => {
          try {
            const items = await apiRequest("GET", `/api/orders/${order.id}/items`);
            itemsMap[order.id] = items;
          } catch (e) {
            itemsMap[order.id] = [];
          }
        })
      );
      setOrderItems(itemsMap);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiRequest("PATCH", `/api/restaurant/orders/${orderId}/status`, { status: newStatus });
      toast({ title: "Status atualizado!" });
      await loadOrders();
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (isLoading) return <div className="p-4">Carregando pedidos...</div>;

  const statusStages = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];
  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    preparing: "Preparando",
    ready: "Pronto",
    out_for_delivery: "Entregando",
    delivered: "Entregue",
  };

  const filteredOrders = orders.filter((o) => !filter || o.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/restaurant/dashboard")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Fila de Pedidos</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={!filter ? "default" : "outline"}
            onClick={() => setFilter("")}
            size="sm"
          >
            Todos ({orders.length})
          </Button>
          {["pending", "confirmed", "preparing", "ready", "out_for_delivery"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              onClick={() => setFilter(status)}
              size="sm"
            >
              {statusLabels[status]} ({orders.filter((o) => o.status === status).length})
            </Button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum pedido nesta categoria</p>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-bold text-lg">#{order.id.slice(0, 8)}</h3>
                    <p className="text-sm text-muted-foreground">{order.customerName}</p>
                    <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={order.deliveryType === "delivery" ? "default" : "secondary"}>
                        {order.deliveryType === "delivery" ? "🏍️ Delivery" : "🫴 Retirada"}
                      </Badge>
                      <Badge variant="outline">{order.paymentMethod}</Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-2">ITENS</p>
                    <div className="space-y-1">
                      {(orderItems[order.id] || []).map((item: any) => (
                        <p key={item.id} className="text-sm">
                          {item.quantity}x {item.name} - R$ {Number(item.price).toFixed(2)}
                        </p>
                      ))}
                    </div>
                    <p className="font-bold mt-3">Total: R$ {Number(order.total).toFixed(2)}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {statusStages.map((status) => (
                      <Button
                        key={status}
                        variant={order.status === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateStatus(order.id, status)}
                        className="text-xs"
                      >
                        {statusLabels[status]}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
