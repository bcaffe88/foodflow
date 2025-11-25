import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { ArrowLeft, Clock, MapPin, Phone } from "lucide-react";
import type { Order } from "@shared/schema";

export default function CustomerOrdersHistory() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Verificar autenticação
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");
    
    if (!token || !user) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(user);
      if (parsedUser.role !== "customer") {
        toast({ title: "Acesso negado", description: "Apenas clientes podem acessar", variant: "destructive" });
        navigate("/login");
      }
    } catch (error) {
      navigate("/login");
    }
  }, []);

  // Fetch orders
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ["/api/customer/orders"],
    queryFn: () => apiRequest("GET", "/api/customer/orders"),
    enabled: true,
  });

  const orders = (Array.isArray(ordersData) ? ordersData : ordersData?.data || []) as Order[];

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      preparing: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      ready: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      out_for_delivery: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      delivered: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[status] || "bg-gray-100";
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: "Pendente",
      confirmed: "Confirmado",
      preparing: "Preparando",
      ready: "Pronto",
      out_for_delivery: "Entregando",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return typeof date === 'string' ? date : date.toString();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/restaurants")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-red-600" data-testid="text-orders-title">
            Meus Pedidos
          </h1>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="p-8 text-center" data-testid="card-loading">
              <p className="text-muted-foreground">Carregando pedidos...</p>
            </Card>
          ) : error ? (
            <Card className="p-8 text-center" data-testid="card-error">
              <p className="text-red-600">Erro ao carregar pedidos</p>
            </Card>
          ) : orders.length === 0 ? (
            <Card className="p-8 text-center" data-testid="card-empty">
              <p className="text-muted-foreground mb-4">Você não tem nenhum pedido ainda</p>
              <Button
                onClick={() => navigate("/restaurants")}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-start-ordering"
              >
                Começar a Pedir
              </Button>
            </Card>
          ) : (
            orders.map((order: Order) => (
              <Card
                key={order.id}
                className="p-6 hover-elevate"
                data-testid={`card-order-${order.id}`}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {/* Order ID & Date */}
                  <div>
                    <p className="text-sm text-muted-foreground">Número do Pedido</p>
                    <p className="font-semibold" data-testid={`text-order-id-${order.id}`}>
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  {/* Date */}
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <p className="font-semibold" data-testid={`text-order-date-${order.id}`}>
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      className={getStatusColor(order.status)}
                      data-testid={`badge-status-${order.id}`}
                    >
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>

                  {/* Total */}
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-red-600" data-testid={`text-order-total-${order.id}`}>
                      R$ {Number(order.total).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  {/* Address */}
                  {order.deliveryAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Endereço de Entrega</p>
                        <p className="font-medium" data-testid={`text-delivery-address-${order.id}`}>
                          {order.deliveryAddress}
                        </p>
                        {order.addressReference && (
                          <p className="text-sm text-muted-foreground">
                            Ref: {order.addressReference}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Driver Info */}
                  {order.driverPhone && order.status === "out_for_delivery" && (
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Motorista</p>
                        <a
                          href={`tel:${order.driverPhone}`}
                          className="font-medium text-red-600 hover:underline"
                          data-testid={`link-driver-phone-${order.id}`}
                        >
                          {order.driverPhone}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div>
                    <p className="text-sm text-muted-foreground">Método de Pagamento</p>
                    <p className="font-medium" data-testid={`text-payment-method-${order.id}`}>
                      {order.paymentMethod === "cash"
                        ? "Dinheiro"
                        : order.paymentMethod === "pix"
                        ? "PIX"
                        : "Cartão"}
                      {order.needsChange &&
                        ` (Troco: R$ ${Number(order.changeAmount).toFixed(2)})`}
                    </p>
                  </div>
                </div>

                {/* Order Details Button */}
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/customer/order/${order.id}`)}
                    data-testid={`button-details-${order.id}`}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
