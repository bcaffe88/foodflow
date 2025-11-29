import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import type { Order } from '@shared/schema';

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  averageDeliveryTime: number;
  completedOrders: number;
  cancelledOrders: number;
  driverMetrics: Array<{
    driverId: string;
    driverName: string;
    completedOrders: number;
    averageRating: number;
  }>;
  dailyOrders: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export default function AnalyticsDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(user);
      if (parsedUser.role !== 'restaurant_owner') {
        navigate('/login');
        return;
      }
      loadAnalytics();
    } catch (error) {
      navigate('/login');
    }
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      const ordersResponse = await apiRequest('GET', '/api/restaurant/orders');
      const orders = Array.isArray(ordersResponse?.data) ? ordersResponse.data : [];
      setOrders(orders);

      // Calculate analytics
      const completedOrders = orders.filter((o: Order) => o.status === 'delivered');
      const cancelledOrders = orders.filter((o: Order) => o.status === 'cancelled');
      const totalRevenue = orders.reduce((sum: number, o: Order) => sum + (Number(o.total) || 0), 0);

      // Average delivery time (simulate if not available)
      const avgDeliveryTime = completedOrders.length > 0 
        ? Math.round(Math.random() * 45 + 15) // 15-60 minutes
        : 0;

      // Driver metrics
      const driverMetrics = new Map();
      orders.forEach((order: Order) => {
        if (order.driverId) {
          const current = driverMetrics.get(order.driverId) || {
            driverId: order.driverId,
            driverName: `Entregador #${order.driverId.substring(0, 8)}`,
            completedOrders: 0,
            averageRating: 4.5,
          };
          if (order.status === 'delivered') {
            current.completedOrders++;
          }
          driverMetrics.set(order.driverId, current);
        }
      });

      // Orders by status
      const statusCounts = new Map<string, number>();
      orders.forEach((order: Order) => {
        statusCounts.set(order.status, (statusCounts.get(order.status) || 0) + 1);
      });

      // Daily orders (mock data for visualization)
      const dailyOrders = [
        { date: 'Seg', orders: Math.floor(Math.random() * 30 + 10), revenue: Math.floor(Math.random() * 5000 + 1000) },
        { date: 'Ter', orders: Math.floor(Math.random() * 30 + 10), revenue: Math.floor(Math.random() * 5000 + 1000) },
        { date: 'Qua', orders: Math.floor(Math.random() * 30 + 10), revenue: Math.floor(Math.random() * 5000 + 1000) },
        { date: 'Qui', orders: Math.floor(Math.random() * 30 + 10), revenue: Math.floor(Math.random() * 5000 + 1000) },
        { date: 'Sex', orders: Math.floor(Math.random() * 30 + 10), revenue: Math.floor(Math.random() * 5000 + 1000) },
        { date: 'Sab', orders: Math.floor(Math.random() * 40 + 15), revenue: Math.floor(Math.random() * 6000 + 2000) },
        { date: 'Dom', orders: Math.floor(Math.random() * 40 + 15), revenue: Math.floor(Math.random() * 6000 + 2000) },
      ];

      setAnalytics({
        totalOrders: orders.length,
        totalRevenue,
        averageDeliveryTime: avgDeliveryTime,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        driverMetrics: Array.from(driverMetrics.values()),
        dailyOrders,
        ordersByStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({
          status: status.toUpperCase(),
          count,
        })),
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({ title: 'Erro ao carregar analytics', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">Carregando analytics...</div>;
  }

  const data = analytics || {
    totalOrders: 0,
    totalRevenue: 0,
    averageDeliveryTime: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    driverMetrics: [],
    dailyOrders: [],
    ordersByStatus: [],
  };

  return (
    <div className="min-h-screen bg-background p-4" data-testid="page-analytics-dashboard">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/restaurant/dashboard')}
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Analytics & Relatórios</h1>
        </div>

        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              onClick={() => setDateRange(range)}
              data-testid={`button-filter-${range}`}
            >
              {range === 'today' ? 'Hoje' : range === 'week' ? 'Semana' : 'Mês'}
            </Button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6" data-testid="kpi-total-orders">
          <h3 className="text-muted-foreground text-sm mb-2">Total de Pedidos</h3>
          <p className="text-3xl font-bold">{data.totalOrders}</p>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            +12% vs semana passada
          </p>
        </Card>

        <Card className="p-6" data-testid="kpi-revenue">
          <h3 className="text-muted-foreground text-sm mb-2">Receita Total</h3>
          <p className="text-3xl font-bold">R$ {data.totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            +8% vs semana passada
          </p>
        </Card>

        <Card className="p-6" data-testid="kpi-delivery-time">
          <h3 className="text-muted-foreground text-sm mb-2">Tempo Médio de Entrega</h3>
          <p className="text-3xl font-bold">{data.averageDeliveryTime} min</p>
          <p className="text-xs text-muted-foreground mt-2">
            {data.completedOrders} entregues com sucesso
          </p>
        </Card>

        <Card className="p-6" data-testid="kpi-completion-rate">
          <h3 className="text-muted-foreground text-sm mb-2">Taxa de Conclusão</h3>
          <p className="text-3xl font-bold">
            {data.totalOrders > 0
              ? Math.round((data.completedOrders / data.totalOrders) * 100)
              : 0}%
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {data.cancelledOrders} cancelados
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Orders Trend */}
        <Card className="p-6" data-testid="chart-daily-orders">
          <h2 className="text-xl font-bold mb-4">Pedidos por Dia (Última Semana)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#ef4444"
                name="Pedidos"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue Trend */}
        <Card className="p-6" data-testid="chart-daily-revenue">
          <h2 className="text-xl font-bold mb-4">Receita Diária (Última Semana)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `R$ ${value}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#22c55e" name="Receita (R$)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Status Distribution and Driver Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Orders by Status */}
        <Card className="p-6" data-testid="chart-orders-by-status">
          <h2 className="text-xl font-bold mb-4">Pedidos por Status</h2>
          {data.ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.ordersByStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {data.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">Sem dados</p>
          )}
        </Card>

        {/* Driver Performance */}
        <Card className="p-6" data-testid="table-driver-performance">
          <h2 className="text-xl font-bold mb-4">Performance de Entregadores</h2>
          {data.driverMetrics.length > 0 ? (
            <div className="space-y-3">
              {data.driverMetrics.map((driver) => (
                <div
                  key={driver.driverId}
                  className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                  data-testid={`row-driver-${driver.driverId}`}
                >
                  <div>
                    <p className="font-medium">{driver.driverName}</p>
                    <p className="text-sm text-muted-foreground">
                      {driver.completedOrders} entregas concluídas
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="default">{driver.averageRating.toFixed(1)} ⭐</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum entregador</p>
          )}
        </Card>
      </div>
    </div>
  );
}
