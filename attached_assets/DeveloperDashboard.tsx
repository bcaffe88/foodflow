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
  Store,
  DollarSign,
  Users,
  TrendingUp,
  Plus,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

export default function DeveloperDashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [newClient, setNewClient] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    commissionPercentage: 10,
  });

  // Fetch clients
  const { data: clients, refetch: refetchClients } =
    trpc.developer.getClients.useQuery(undefined, { enabled: isAuthenticated });

  // Fetch commission stats
  const { data: commissionStats } = trpc.developer.getCommissionStats.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const createClientMutation = trpc.developer.createClient.useMutation({
    onSuccess: () => {
      refetchClients();
      setNewClient({
        businessName: "",
        ownerName: "",
        email: "",
        phone: "",
        commissionPercentage: 10,
      });
      toast.success("Cliente criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar cliente");
    },
  });

  const updateCommissionMutation =
    trpc.developer.updateCommission.useMutation({
      onSuccess: () => {
        refetchClients();
        toast.success("Comissão atualizada!");
      },
      onError: () => {
        toast.error("Erro ao atualizar comissão");
      },
    });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const handleCreateClient = async () => {
    if (
      !newClient.businessName ||
      !newClient.ownerName ||
      !newClient.email ||
      !newClient.phone
    ) {
      toast.error("Preencha todos os campos");
      return;
    }

    await createClientMutation.mutateAsync({
      businessName: newClient.businessName,
      ownerName: newClient.ownerName,
      email: newClient.email,
      phone: newClient.phone,
      commissionPercentage: newClient.commissionPercentage,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
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

  if (!isAuthenticated || user?.role !== "admin") {
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
            <div>
              <h1 className="text-2xl font-bold">Dashboard do Desenvolvedor</h1>
              <p className="text-sm opacity-90">Gerenciar clientes e comissões</p>
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
                Total de Clientes
              </CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Faturamento Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(commissionStats?.totalRevenue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Comissões Ganhas
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(commissionStats?.totalCommissions || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Pedidos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {commissionStats?.totalOrders || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="commissions">Comissões</TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <div className="flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Cliente</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="businessName">Nome do Negócio</Label>
                      <Input
                        id="businessName"
                        value={newClient.businessName}
                        onChange={(e) =>
                          setNewClient({
                            ...newClient,
                            businessName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerName">Nome do Proprietário</Label>
                      <Input
                        id="ownerName"
                        value={newClient.ownerName}
                        onChange={(e) =>
                          setNewClient({
                            ...newClient,
                            ownerName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newClient.email}
                        onChange={(e) =>
                          setNewClient({ ...newClient, email: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={newClient.phone}
                        onChange={(e) =>
                          setNewClient({ ...newClient, phone: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="commission">
                        Comissão (%) - Padrão 10%
                      </Label>
                      <Input
                        id="commission"
                        type="number"
                        min="0"
                        max="100"
                        value={newClient.commissionPercentage}
                        onChange={(e) =>
                          setNewClient({
                            ...newClient,
                            commissionPercentage: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <Button
                      onClick={handleCreateClient}
                      disabled={createClientMutation.isPending}
                      className="w-full"
                    >
                      Criar Cliente
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Meus Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                {!clients || clients.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Store className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Nenhum cliente cadastrado ainda</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Negócio</TableHead>
                        <TableHead>Proprietário</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Comissão</TableHead>
                        <TableHead>Credenciais</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            {client.businessName}
                          </TableCell>
                          <TableCell>{client.ownerName}</TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>{client.phone}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={Math.floor(client.commissionRate / 100)}
                                onChange={(e) =>
                                  updateCommissionMutation.mutate({
                                    clientId: client.id,
                                    percentage: parseInt(e.target.value),
                                  })
                                }
                                className="w-20"
                              />
                              <span>%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  Ver
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Credenciais - {client.businessName}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>E-mail de Acesso</Label>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Input
                                        readOnly
                                        value={client.email || ""}
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          copyToClipboard(client.email || "")
                                        }
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Senha Temporária</Label>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Input
                                        readOnly
                                        type={
                                          showPasswords[client.id]
                                            ? "text"
                                            : "password"
                                        }
                                        value="temp_password_123"
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          setShowPasswords({
                                            ...showPasswords,
                                            [client.id]: !showPasswords[
                                              client.id
                                            ],
                                          })
                                        }
                                      >
                                        {showPasswords[client.id] ? (
                                          <EyeOff className="h-4 w-4" />
                                        ) : (
                                          <Eye className="h-4 w-4" />
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          copyToClipboard(
                                            "temp_password_123"
                                          )
                                        }
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Compartilhe essas credenciais com o cliente
                                    para que ele possa fazer login no dashboard
                                  </p>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Comissões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Faturamento Total
                      </p>
                      <p className="text-2xl font-bold">
                        {formatPrice(commissionStats?.totalRevenue || 0)}
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Comissões Ganhas
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPrice(commissionStats?.totalCommissions || 0)}
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Ticket Médio
                      </p>
                      <p className="text-2xl font-bold">
                        {formatPrice(
                          commissionStats?.totalOrders
                            ? commissionStats.totalRevenue /
                                commissionStats.totalOrders
                            : 0
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
