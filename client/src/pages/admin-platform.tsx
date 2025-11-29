import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { LogOut, Settings, Building2, TrendingUp } from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalCommission = commissions.reduce((sum, c) => sum + parseFloat(String(c.commissionAmount || '0')), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Settings className="h-5 md:h-6 w-5 md:w-6 text-primary" />
            <h1 className="text-lg md:text-xl font-bold truncate">Gestão da Plataforma</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-9 w-9"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 md:px-4 py-6 md:py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {[
              { icon: Building2, label: "Restaurantes", value: restaurants.length },
              { icon: TrendingUp, label: "Comissões Pendentes", value: commissions.length },
              { icon: TrendingUp, label: "Total Comissões", value: `R$ ${totalCommission.toFixed(2)}` }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-4 md:p-6">
                  <div className="flex items-center gap-3">
                    <stat.icon className="h-5 md:h-6 w-5 md:w-6 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-lg md:text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Restaurantes Ativos */}
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className="space-y-3 md:space-y-4">
                <h2 className="text-base md:text-lg font-bold">Restaurantes Ativos</h2>
                <div className="space-y-2 md:space-y-3">
                  {restaurants.map((r, idx) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="p-3 md:p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-xs md:text-sm truncate">{r.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">{r.slug}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={r.isActive ? "default" : "secondary"}
                              className="text-xs md:text-sm"
                              data-testid={`badge-restaurant-${r.id}`}
                            >
                              {r.isActive ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs md:text-sm mt-2">Comissão: {r.commissionPercentage}%</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Comissões Pendentes */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className="space-y-3 md:space-y-4">
                <h2 className="text-base md:text-lg font-bold">Comissões Pendentes</h2>
                <div className="space-y-2 md:space-y-3">
                  {commissions.map((c, idx) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="p-3 md:p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs md:text-sm">R$ {Number(c.commissionAmount).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{c.commissionPercentage}% de R$ {Number(c.orderTotal).toFixed(2)}</p>
                          </div>
                          <Badge variant="outline" className="text-xs md:text-sm">Pendente</Badge>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
