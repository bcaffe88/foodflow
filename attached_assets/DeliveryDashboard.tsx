import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Truck,
  MapPin,
  DollarSign,
  TrendingUp,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

export default function DeliveryDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [newDelivery, setNewDelivery] = useState({
    name: "",
    phone: "",
    cpf: "",
    vehicle: "",
    licensePlate: "",
  });

  // Fetch delivery person data
  const { data: deliveryPerson } = trpc.delivery.getProfile.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Fetch available orders
  const { data: availableOrders, refetch: refetchOrders } =
    trpc.delivery.getAvailableOrders.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  // Fetch active deliveries
  const { data: activeDeliveries, refetch: refetchActive } =
    trpc.delivery.getActiveDeliveries.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  const registerMutation = trpc.delivery.register.useMutation({
    onSuccess: () => {
      setNewDelivery({
        name: "",
        phone: "",
        cpf: "",
        vehicle: "",
        licensePlate: "",
      });
      toast.success("Cadastro realizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao cadastrar");
    },
  });

  const acceptOrderMutation = trpc.delivery.acceptOrder.useMutation({
    onSuccess: () => {
      refetchOrders();
      refetchActive();
      toast.success("Pedido aceito!");
    },
    onError: () => {
      toast.error("Erro ao aceitar pedido");
    },
  });

  const completeDeliveryMutation = trpc.delivery.completeDelivery.useMutation({
    onSuccess: () => {
      refetchActive();
      toast.success("Entrega concluída!");
    },
    onError: () => {
      toast.error("Erro ao concluir entrega");
    },
  });

  const handleRegister = async () => {
    if (
      !newDelivery.name ||
      !newDelivery.phone ||
      !newDelivery.cpf ||
      !newDelivery.vehicle ||
      !newDelivery.licensePlate
    ) {
      toast.error("Preencha todos os campos");
      return;
    }

    await registerMutation.mutateAsync(newDelivery);
  };

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
            <CardTitle className="text-center">Cadastro de Motoboy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Faça login ou cadastre-se para começar a receber pedidos
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar como Motoboy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastro de Motoboy</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={newDelivery.name}
                      onChange={(e) =>
                        setNewDelivery({ ...newDelivery, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={newDelivery.phone}
                      onChange={(e) =>
                        setNewDelivery({ ...newDelivery, phone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={newDelivery.cpf}
                      onChange={(e) =>
                        setNewDelivery({ ...newDelivery, cpf: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle">Veículo</Label>
                    <Input
                      id="vehicle"
                      placeholder="Ex: Moto Honda"
                      value={newDelivery.vehicle}
                      onChange={(e) =>
                        setNewDelivery({
                          ...newDelivery,
                          vehicle: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="licensePlate">Placa do Veículo</Label>
                    <Input
                      id="licensePlate"
                      placeholder="Ex: ABC-1234"
                      value={newDelivery.licensePlate}
                      onChange={(e) =>
                        setNewDelivery({
                          ...newDelivery,
                          licensePlate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    onClick={handleRegister}
                    disabled={registerMutation.isPending}
                    className="w-full"
                  >
                    Cadastrar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!deliveryPerson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Cadastro de Motoboy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Você precisa se cadastrar como motoboy para começar
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Agora
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastro de Motoboy</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={newDelivery.name}
                      onChange={(e) =>
                        setNewDelivery({ ...newDelivery, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={newDelivery.phone}
                      onChange={(e) =>
                        setNewDelivery({ ...newDelivery, phone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={newDelivery.cpf}
                      onChange={(e) =>
                        setNewDelivery({ ...newDelivery, cpf: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle">Veículo</Label>
                    <Input
                      id="vehicle"
                      placeholder="Ex: Moto Honda"
                      value={newDelivery.vehicle}
                      onChange={(e) =>
                        setNewDelivery({
                          ...newDelivery,
                          vehicle: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="licensePlate">Placa do Veículo</Label>
                    <Input
                      id="licensePlate"
                      placeholder="Ex: ABC-1234"
                      value={newDelivery.licensePlate}
                      onChange={(e) =>
                        setNewDelivery({
                          ...newDelivery,
                          licensePlate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button
                    onClick={handleRegister}
                    disabled={registerMutation.isPending}
                    className="w-full"
                  >
                    Cadastrar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
            <div>
              <h1 className="text-2xl font-bold">Dashboard de Entrega</h1>
              <p className="text-sm opacity-90">{deliveryPerson.fullName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Veículo</p>
              <p className="font-semibold">{deliveryPerson.vehicleType}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pedidos Disponíveis
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {availableOrders?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Entregas Ativas
              </CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeDeliveries?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Ganhos do Dia
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="available" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available">Pedidos Disponíveis</TabsTrigger>
            <TabsTrigger value="active">Entregas Ativas</TabsTrigger>
          </TabsList>

          {/* Available Orders */}
          <TabsContent value="available">
            <Card>
              <CardHeader>
                <CardTitle>Novos Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                {!availableOrders || availableOrders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Nenhum pedido disponível no momento</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            #{order.orderNumber}
                          </TableCell>
                          <TableCell>{order.customerName}</TableCell>
                          <TableCell className="text-sm">
                            {order.deliveryAddress}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatPrice(order.total)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() =>
                                acceptOrderMutation.mutate({ orderId: order.id })
                              }
                              disabled={acceptOrderMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aceitar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Deliveries */}
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Entregas</CardTitle>
              </CardHeader>
              <CardContent>
                {!activeDeliveries || activeDeliveries.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Truck className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Você não tem entregas ativas</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Endereço</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeDeliveries.map((delivery) => (
                        <TableRow key={delivery.id}>
                          <TableCell className="font-medium">
                            #{delivery.orderNumber}
                          </TableCell>
                          <TableCell>{delivery.customerName}</TableCell>
                          <TableCell className="text-sm">
                            {delivery.deliveryAddress}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">Em Entrega</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() =>
                                completeDeliveryMutation.mutate({
                                  deliveryId: delivery.id,
                                })
                              }
                              disabled={completeDeliveryMutation.isPending}
                            >
                              Concluir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
