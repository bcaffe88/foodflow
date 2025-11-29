import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Phone, ArrowLeft, ShoppingCart } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface Order {
  id: string;
  customerName: string;
  total: string;
  status: string;
  createdAt: string;
  deliveryAddress: string;
  customerPhone: string;
}

export default function CustomerOrdersPage() {
  const [, navigate] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await apiRequest("GET", "/api/customer/orders");
      setOrders(response);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-purple-100 text-purple-800",
      ready: "bg-green-100 text-green-800",
      out_for_delivery: "bg-orange-100 text-orange-800",
      delivered: "bg-green-600 text-white",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Aguardando",
      confirmed: "Confirmado",
      preparing: "Preparando",
      ready: "Pronto",
      out_for_delivery: "Em Entrega",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold truncate">Meus Pedidos</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back"
            className="text-xs md:text-sm"
          >
            <ArrowLeft className="h-4 md:h-5 w-4 md:w-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8 md:p-12 text-center">
              <ShoppingCart className="h-12 md:h-16 w-12 md:w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4 text-sm md:text-base">Ainda não há pedidos</p>
              <p className="text-muted-foreground/70 text-xs md:text-sm mb-6">Que tal pedir algo? Vem comer bem!</p>
              <Button onClick={() => navigate("/")} data-testid="button-order-now" className="text-xs md:text-sm">
                Ver Restaurantes
              </Button>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { transition: { staggerChildren: 0.08 } } }}
            className="space-y-3 md:space-y-4"
          >
            {orders.map((order) => (
              <motion.div key={order.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} whileHover={{ scale: 1.01 }}>
                <Card className="p-4 md:p-6 hover-elevate cursor-pointer" data-testid={`card-order-${order.id}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-sm md:text-base truncate">{order.customerName}</h3>
                        <Badge className={getStatusColor(order.status)} data-testid={`status-${order.id}`}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 md:h-4 w-3 md:w-4 flex-shrink-0" />
                          <span>
                            {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="h-3 md:h-4 w-3 md:w-4 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{order.deliveryAddress}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone className="h-3 md:h-4 w-3 md:w-4 flex-shrink-0" />
                          <span>{order.customerPhone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xl md:text-2xl font-bold text-primary" data-testid={`price-${order.id}`}>
                        R$ {parseFloat(order.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
