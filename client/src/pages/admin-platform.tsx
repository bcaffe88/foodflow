import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { LogOut } from "lucide-react";
import type { Tenant, Commission } from "@shared/schema";

export default function AdminPlatform() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<Tenant[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rests, comms] = await Promise.all([
        apiRequest("GET", "/api/admin/restaurants"),
        apiRequest("GET", "/api/admin/commissions/unpaid"),
      ]);
      setRestaurants(rests);
      setCommissions(comms);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar dados", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (isLoading) return <div className="p-4">Carregando...</div>;

  const totalCommission = commissions.reduce((sum, c) => sum + parseFloat(String(c.commissionAmount || '0')), 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Platform</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <h3 className="text-muted-foreground text-sm mb-2">Restaurantes</h3>
            <p className="text-3xl font-bold">{restaurants.length}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-muted-foreground text-sm mb-2">Comissões Pendentes</h3>
            <p className="text-3xl font-bold">{commissions.length}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-muted-foreground text-sm mb-2">Total Comissões</h3>
            <p className="text-3xl font-bold">R$ {totalCommission.toFixed(2)}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Restaurantes Ativos</h2>
            <div className="space-y-2">
              {restaurants.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{r.name}</h3>
                      <p className="text-sm text-muted-foreground">{r.slug}</p>
                    </div>
                    <Badge variant={r.isActive ? "default" : "secondary"}>
                      {r.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-sm mt-2">Comissão: {r.commissionPercentage}%</p>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Comissões Pendentes</h2>
            <div className="space-y-2">
              {commissions.map((c) => (
                <Card key={c.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold">R$ {Number(c.commissionAmount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{c.commissionPercentage}% de R$ {Number(c.orderTotal).toFixed(2)}</p>
                    </div>
                    <Badge variant="outline">Pendente</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
