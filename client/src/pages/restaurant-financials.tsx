import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { LogOut, ChevronLeft, TrendingUp } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function RestaurantFinancials() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [financials, setFinancials] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<"day" | "week" | "month" | "year" | "all">("week");

  useEffect(() => {
    loadFinancials();
  }, [filterPeriod]);

  const loadFinancials = async () => {
    try {
      const data = await apiRequest("GET", `/api/restaurant/financials?period=${filterPeriod}`);
      setFinancials(data);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar dados financeiros", variant: "destructive" });
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

  const mockDaily = [
    { day: "Seg", revenue: 450, orders: 12 },
    { day: "Ter", revenue: 620, orders: 18 },
    { day: "Qua", revenue: 580, orders: 15 },
    { day: "Qui", revenue: 750, orders: 22 },
    { day: "Sex", revenue: 890, orders: 28 },
    { day: "Sab", revenue: 1200, orders: 35 },
    { day: "Dom", revenue: 950, orders: 30 },
  ];

  const mockHourly = [
    { hour: "11h", orders: 2 },
    { hour: "12h", orders: 8 },
    { hour: "13h", orders: 12 },
    { hour: "14h", orders: 5 },
    { hour: "18h", orders: 6 },
    { hour: "19h", orders: 15 },
    { hour: "20h", orders: 18 },
    { hour: "21h", orders: 10 },
  ];

  const mockPayment = [
    { name: "PIX", value: 45 },
    { name: "Crédito", value: 35 },
    { name: "Débito", value: 15 },
    { name: "Dinheiro", value: 5 },
  ];

  const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"];

  const totalRevenue = mockDaily.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = mockDaily.reduce((sum, d) => sum + d.orders, 0);
  const avgOrder = (totalRevenue / totalOrders).toFixed(2);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/restaurant/dashboard")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Financeiro</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter Period */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {(["day", "week", "month", "year", "all"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                filterPeriod === period
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-background hover:bg-muted"
              }`}
              data-testid={`button-filter-${period}`}
            >
              {period === "day" && "Hoje"}
              {period === "week" && "Semana"}
              {period === "month" && "Mês"}
              {period === "year" && "Ano"}
              {period === "all" && "Tudo"}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <h3 className="text-muted-foreground text-sm mb-2">Receita Semanal</h3>
            <p className="text-3xl font-bold">R$ {(totalRevenue).toFixed(2)}</p>
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12% vs semana anterior
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-muted-foreground text-sm mb-2">Pedidos</h3>
            <p className="text-3xl font-bold">{totalOrders}</p>
            <p className="text-xs text-muted-foreground mt-2">Essa semana</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-muted-foreground text-sm mb-2">Ticket Médio</h3>
            <p className="text-3xl font-bold">R$ {avgOrder}</p>
            <p className="text-xs text-muted-foreground mt-2">Por pedido</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-muted-foreground text-sm mb-2">Comissão Plataforma</h3>
            <p className="text-3xl font-bold">R$ {(totalRevenue * 0.15).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-2">15% da receita</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="font-bold mb-4">Receita e Pedidos (7 dias)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockDaily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Receita (R$)" />
                <Bar dataKey="orders" fill="#10b981" name="Pedidos" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-4">Pedidos por Hora</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockHourly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="#ef4444" strokeWidth={2} name="Pedidos" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-bold mb-4">Métodos de Pagamento (%)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockPayment}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockPayment.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-4">Resumo de Pagamentos</h3>
            <div className="space-y-3">
              {mockPayment.map((method) => (
                <div key={method.name} className="flex justify-between items-center pb-3 border-b">
                  <span className="text-sm">{method.name}</span>
                  <span className="font-semibold">{method.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
