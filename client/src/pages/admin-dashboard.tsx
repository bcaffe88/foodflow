import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { LogOut, Plus, Store, TrendingUp, Clock, BarChart3, Users } from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <p className="text-sm md:text-base">Carregando...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 md:gap-3">
            <BarChart3 className="h-6 md:h-7 w-6 md:w-7 text-primary" />
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Gestão da Plataforma</h1>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-logout" size="sm" className="gap-1 md:gap-2 text-xs md:text-sm">
            <LogOut className="h-3 md:h-4 w-3 md:w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* KPIs */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8"
        >
          {[
            { icon: Store, label: "Restaurantes", value: stats.totalRestaurants, color: "text-red-600", testid: "text-total-restaurants" },
            { icon: TrendingUp, label: "Receita", value: `R$ ${stats.totalRevenue.toFixed(2)}`, color: "text-green-600", testid: "text-revenue" },
            { icon: Clock, label: "Pendentes", value: stats.pendingOrders, color: "text-blue-600", testid: "text-pending-orders" },
          ].map((stat, idx) => (
            <motion.div key={idx} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <Card className="p-4 md:p-6 h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs md:text-sm mb-2">{stat.label}</p>
                    <p className={`text-2xl md:text-3xl font-bold ${stat.color}`} data-testid={stat.testid}>{stat.value}</p>
                  </div>
                  <stat.icon className="w-6 md:w-8 h-6 md:h-8 opacity-20" />
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6 md:mb-8">
          <div>
            <h2 className="text-lg md:text-xl font-bold">Seus Restaurantes</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">{stats.totalRestaurants} conectados na plataforma</p>
          </div>
          <Button onClick={() => setShowNewTenant(!showNewTenant)} data-testid="button-new-tenant" className="gap-2 text-xs md:text-sm w-full md:w-auto">
            <Plus className="h-3 md:h-4 w-3 md:w-4" />
            <span>Adicionar</span>
          </Button>
        </div>

        {showNewTenant && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-4 md:p-6 mb-6 md:mb-8">
              <h3 className="font-bold text-base md:text-lg mb-4">Adicionar Restaurante</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs md:text-sm font-medium">Nome</label>
                  <Input
                    value={newTenantData.name}
                    onChange={(e) => setNewTenantData({ ...newTenantData, name: e.target.value })}
                    placeholder="Restaurante X"
                    className="text-xs md:text-sm h-9 md:h-10"
                  />
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium">Slug (URL)</label>
                  <Input
                    value={newTenantData.slug}
                    onChange={(e) => setNewTenantData({ ...newTenantData, slug: e.target.value })}
                    placeholder="restaurante-x"
                    className="text-xs md:text-sm h-9 md:h-10"
                  />
                </div>
                <div>
                  <label className="text-xs md:text-sm font-medium">Comissão (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newTenantData.commission}
                    onChange={(e) => setNewTenantData({ ...newTenantData, commission: e.target.value })}
                    className="text-xs md:text-sm h-9 md:h-10"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleCreateTenant} className="flex-1 text-xs md:text-sm">Adicionar</Button>
                  <Button variant="outline" onClick={() => setShowNewTenant(false)} className="flex-1 text-xs md:text-sm">Cancelar</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Restaurants List */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { transition: { staggerChildren: 0.05 } } }}
          className="grid gap-3 md:gap-4"
        >
          {tenants.length === 0 ? (
            <Card className="p-8 text-center">
              <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-sm md:text-base">Nenhum restaurante ainda</p>
            </Card>
          ) : (
            tenants.map((tenant) => (
              <motion.div key={tenant.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} whileHover={{ scale: 1.01 }}>
                <Card className="p-4 md:p-6 hover-elevate" data-testid={`card-tenant-${tenant.id}`}>
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 md:gap-0">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base md:text-lg truncate">{tenant.name}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground truncate">
                        <span className="inline-block">{tenant.slug}</span>
                        <span className="mx-2">•</span>
                        <span className="inline-block">{tenant.commissionPercentage}% comissão</span>
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate("/admin/restaurants")}
                      data-testid={`button-details-${tenant.id}`}
                      className="text-xs md:text-sm w-full md:w-auto"
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </main>
    </div>
  );
}
