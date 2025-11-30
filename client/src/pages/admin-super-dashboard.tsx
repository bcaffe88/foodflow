import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, ShoppingCart, Store } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PlatformMetrics {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  restaurants: number;
  daily_revenue: Array<{ date: string; revenue: number }>;
  platform_breakdown: Array<{ platform: string; orders: number }>;
  top_restaurants: Array<{ name: string; revenue: number }>;
  restaurant_status: Array<{ name: string; status: "active" | "inactive"; revenue: number; orders: number }>;
}

export default function AdminSuperDashboard() {
  const { data: metrics, isLoading } = useQuery<PlatformMetrics>({
    queryKey: ["/api/admin/super/metrics"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!metrics) {
    return <div className="p-6">Sem dados disponíveis</div>;
  }

  return (
    <div className="p-6 space-y-6 bg-background">
      <h1 className="text-3xl font-bold">Painel Super Admin</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-revenue-platform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {metrics.total_revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Todas as plataformas</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-orders-platform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_orders}</div>
            <p className="text-xs text-muted-foreground">Pedidos totais</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-customers-platform">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_customers}</div>
            <p className="text-xs text-muted-foreground">Usuários ativos</p>
          </CardContent>
        </Card>

        <Card data-testid="card-restaurants-count">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restaurantes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.restaurants}</div>
            <p className="text-xs text-muted-foreground">Ativos na plataforma</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card data-testid="chart-platform-revenue">
          <CardHeader>
            <CardTitle>Receita Diária (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.daily_revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: any) => `R$ ${(Number(value) || 0).toFixed(2)}`} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card data-testid="chart-platform-breakdown-super">
          <CardHeader>
            <CardTitle>Pedidos por Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.platform_breakdown}
                  dataKey="orders"
                  nameKey="platform"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#ec4899" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Restaurants */}
      <Card data-testid="card-top-restaurants">
        <CardHeader>
          <CardTitle>Top 10 Restaurantes</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.top_restaurants}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value.toFixed(2)}`} />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Restaurant Status Table */}
      <Card data-testid="card-restaurants-status">
        <CardHeader>
          <CardTitle>Status dos Restaurantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Restaurante</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-right p-2">Receita</th>
                  <th className="text-right p-2">Pedidos</th>
                </tr>
              </thead>
              <tbody>
                {metrics.restaurant_status.map((rest, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-2" data-testid={`text-restaurant-name-${idx}`}>{rest.name}</td>
                    <td className="p-2">
                      <span
                        data-testid={`badge-status-${idx}`}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          rest.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {rest.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-2 text-right" data-testid={`text-revenue-${idx}`}>
                      R$ {rest.revenue.toFixed(2)}
                    </td>
                    <td className="p-2 text-right" data-testid={`text-orders-${idx}`}>
                      {rest.orders}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
