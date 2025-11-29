import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import RestaurantsPage from "@/pages/restaurants";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Checkout from "@/pages/checkout";
import OrderConfirmation from "@/pages/order-confirmation";
import CustomerOrdersHistory from "@/pages/customer-orders-history";
import RestaurantDashboard from "@/pages/restaurant-dashboard";
import DriverDashboard from "@/pages/driver-dashboard";
import DeliveryDashboard from "@/pages/delivery-dashboard";
import KitchenDashboard from "@/pages/kitchen-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";
import RestaurantSettings from "@/pages/restaurant-settings";
import ProductsManagement from "@/pages/products-management";
import RestaurantOrders from "@/pages/restaurant-orders";
import RestaurantFinancials from "@/pages/restaurant-financials";
import RegisterRestaurant from "@/pages/register-restaurant";
import RegisterDriver from "@/pages/register-driver";
import AdminRestaurants from "@/pages/admin-restaurants";
import AdminPlatform from "@/pages/admin-platform";
import CustomerOrderTracking from "@/pages/customer-order-tracking";
import DriverMap from "@/pages/driver-map";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import AdminWebhookConfig from "@/pages/admin-webhook-config";
import AgentConsole from "@/pages/agent-console";

function Router() {
  return (
    <Switch>
        <Route path="/" component={Landing} />
        <Route path="/restaurants" component={RestaurantsPage} />
        <Route path="/r/:slug" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/register-restaurant" component={RegisterRestaurant} />
        <Route path="/register-driver" component={RegisterDriver} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/order-confirmation" component={OrderConfirmation} />
        <Route path="/customer/orders" component={CustomerOrdersHistory} />
        <Route path="/restaurant/dashboard" component={RestaurantDashboard} />
        <Route path="/restaurant/products" component={ProductsManagement} />
        <Route path="/restaurant/orders" component={RestaurantOrders} />
        <Route path="/restaurant/financials" component={RestaurantFinancials} />
        <Route path="/restaurant/settings" component={RestaurantSettings} />
        <Route path="/restaurant/driver-map" component={DriverMap} />
        <Route path="/restaurant/analytics" component={AnalyticsDashboard} />
        <Route path="/driver/dashboard" component={DeliveryDashboard} />
        <Route path="/kitchen/dashboard" component={KitchenDashboard} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/restaurants" component={AdminRestaurants} />
        <Route path="/admin/platform" component={AdminPlatform} />
        <Route path="/admin/webhook-config" component={AdminWebhookConfig} />
        <Route path="/admin/agent-console" component={AgentConsole} />
        <Route path="/customer/order/:id" component={CustomerOrderTracking} />
        <Route component={NotFound} />
      </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
