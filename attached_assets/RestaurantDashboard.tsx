import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingBag,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Settings,
} from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";

export default function RestaurantDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useState("");

  // Fetch restaurant data
  const { data: restaurant } = trpc.restaurant.getActive.useQuery();

  // Fetch orders
  const { data: orders, refetch: refetchOrders } = trpc.orders.list.useQuery(
    { restaurantId: restaurant?.id || 0 },
    { enabled: !!restaurant && isAuthenticated }
  );

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      refetchOrders();
    },
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: any }> = {
      pending: { label: "Pendente", variant: "secondary" },
      confirmed: { label: "Confirmado", variant: "default" },
      preparing: { label: "Preparando", variant: "default" },
      ready: { label: "Pronto", variant: "default" },
      out_for_delivery: { label: "Saiu para Entrega", variant: "default" },
      delivered: { label: "Entregue", variant: "default" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleUpdateStatus = async (orderId: number, status: any) => {
    await updateStatusMutation.mutateAsync({ id: orderId, status });
  };

  // Calculate stats
  const stats = {
    totalOrders: orders?.length || 0,
    pendingOrders: orders?.filter((o) => o.status === "pending").length || 0,
    totalRevenue: orders?.reduce((sum, o) => sum + o.total, 0) || 0,
    todayOrders:
      orders?.filter(
        (o) =>
          new Date(o.createdAt).toDateString() === new Date().toDateString()
      ).length || 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">Faça login para acessar o dashboard</p>
            <Button onClick={() => (window.location.href = getLoginUrl())}>
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "restaurant_owner" && user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Você não tem permissão para acessar esta página</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={APP_LOGO}
                alt="Logo"
                className="h-10 w-10 rounded-full bg-white p-1"
              />
              <div>
                <h1 className="text-xl font-bold">Dashboard do Restaurante</h1>
                <p className="text-sm opacity-90">{restaurant?.businessName}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/restaurant/settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
              <Button
                variant="secondary"
                onClick={() => (window.location.href = "/")}
              >
                Ver Cardápio
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Pedidos
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pedidos Pendentes
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pendingOrders}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(stats.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Hoje</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fila de Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                {!orders || orders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Nenhum pedido ainda</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            #{order.orderNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {order.customerName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {order.customerPhone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(order.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {order.deliveryType === "delivery"
                                ? "Entrega"
                                : "Retirada"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatPrice(order.total)}
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {order.status === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateStatus(order.id, "confirmed")
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Confirmar
                                </Button>
                              )}
                              {order.status === "confirmed" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateStatus(order.id, "preparing")
                                  }
                                >
                                  Preparar
                                </Button>
                              )}
                              {order.status === "preparing" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateStatus(order.id, "ready")
                                  }
                                >
                                  Pronto
                                </Button>
                              )}
                              {order.status === "ready" &&
                                order.deliveryType === "delivery" && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleUpdateStatus(
                                        order.id,
                                        "out_for_delivery"
                                      )
                                    }
                                  >
                                    <Truck className="h-4 w-4 mr-1" />
                                    Enviar
                                  </Button>
                                )}
                              {(order.status === "out_for_delivery" ||
                                (order.status === "ready" &&
                                  order.deliveryType === "pickup")) && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() =>
                                    handleUpdateStatus(order.id, "delivered")
                                  }
                                >
                                  Concluir
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Produtos</CardTitle>
              </CardHeader>
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-6">
                  Gerencie produtos, categorias e imagens do cardápio
                </p>
                <Button onClick={() => (window.location.href = "/restaurant/products")}>
                  Ir para Gestão de Produtos
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Restaurante</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Em breve: Configurar horário, taxa de entrega, logo, etc.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
