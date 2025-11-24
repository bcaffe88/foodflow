import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { LogOut, Plus, Store, TrendingUp, Clock } from "lucide-react";
import type { Tenant } from "@shared/schema";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState({ totalRestaurants: 0, totalRevenue: 0, pendingOrders: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showNewTenant, setShowNewTenant] = useState(false);
  const [newTenantData, setNewTenantData] = useState({
    name: "",
    slug: "",
    commission: "10.00",
  });

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem("accessToken");
    const user = localStorage.getItem("user");
    
    if (!token || !user) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(user);
      if (parsedUser.role !== "platform_admin") {
        toast({ title: "Acesso negado", description: "Você não tem permissão", variant: "destructive" });
        navigate("/login");
        return;
      }
    } catch (error) {
      navigate("/login");
      return;
    }

    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const data = await apiRequest("GET", "/api/admin/tenants");
      setTenants(data || []);
      setStats({
        totalRestaurants: data?.length || 0,
        totalRevenue: data?.reduce((sum: number, t: Tenant) => sum + (parseFloat(t.commissionPercentage) * 100), 0) || 0,
        pendingOrders: 12, // Mock - seria de um endpoint real
      });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar restaurantes", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenantData.name || !newTenantData.slug) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    try {
      await apiRequest("POST", "/api/admin/tenants", {
        name: newTenantData.name,
        slug: newTenantData.slug,
        commissionPercentage: newTenantData.commission,
      });

      toast({ title: "Restaurante criado com sucesso!" });
      setNewTenantData({ name: "", slug: "", commission: "10.00" });
      setShowNewTenant(false);
      await loadTenants();
    } catch (error) {
      toast({ title: "Erro ao criar restaurante", variant: "destructive" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (isLoading) return <div className="p-4">Carregando...</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-2">Total de Restaurantes</p>
                <p className="text-3xl font-bold" data-testid="text-total-restaurants">{stats.totalRestaurants}</p>
              </div>
              <Store className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-2">Receita Potencial</p>
                <p className="text-3xl font-bold" data-testid="text-revenue">R$ {stats.totalRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-2">Pedidos Pendentes</p>
                <p className="text-3xl font-bold" data-testid="text-pending-orders">{stats.pendingOrders}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold">Restaurantes</h2>
          <Button onClick={() => setShowNewTenant(!showNewTenant)} data-testid="button-new-tenant" className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Restaurante
          </Button>
        </div>

        {showNewTenant && (
          <Card className="p-6 mb-8">
            <h3 className="font-semibold mb-4">Criar Novo Restaurante</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={newTenantData.name}
                  onChange={(e) => setNewTenantData({ ...newTenantData, name: e.target.value })}
                  placeholder="Restaurante X"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug (URL)</label>
                <Input
                  value={newTenantData.slug}
                  onChange={(e) => setNewTenantData({ ...newTenantData, slug: e.target.value })}
                  placeholder="restaurante-x"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Comissão (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newTenantData.commission}
                  onChange={(e) => setNewTenantData({ ...newTenantData, commission: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateTenant}>Criar</Button>
            </div>
          </Card>
        )}

        <div className="grid gap-4">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="p-6" data-testid={`card-tenant-${tenant.id}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{tenant.name}</h3>
                  <p className="text-sm text-muted-foreground">{tenant.slug}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Comissão: {tenant.commissionPercentage}%
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/admin/restaurants")}
                  data-testid={`button-details-${tenant.id}`}
                >
                  Detalhes
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
