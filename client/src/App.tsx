import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

// Eager load critical pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";

// Lazy load other pages
const Home = lazy(() => import("@/pages/home"));
const RestaurantsPage = lazy(() => import("@/pages/restaurants"));
const Checkout = lazy(() => import("@/pages/checkout"));
const OrderConfirmation = lazy(() => import("@/pages/order-confirmation"));
const CustomerOrdersHistory = lazy(() => import("@/pages/customer-orders-history"));
const RestaurantDashboard = lazy(() => import("@/pages/restaurant-dashboard"));
const DriverDashboard = lazy(() => import("@/pages/driver-dashboard"));
const DeliveryDashboard = lazy(() => import("@/pages/delivery-dashboard"));
const KitchenDashboard = lazy(() => import("@/pages/kitchen-dashboard"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const RestaurantSettings = lazy(() => import("@/pages/restaurant-settings"));
const ProductsManagement = lazy(() => import("@/pages/products-management"));
const RestaurantOrders = lazy(() => import("@/pages/restaurant-orders"));
const RestaurantFinancials = lazy(() => import("@/pages/restaurant-financials"));
const RegisterRestaurant = lazy(() => import("@/pages/register-restaurant"));
const RegisterDriver = lazy(() => import("@/pages/register-driver"));
const AdminRestaurants = lazy(() => import("@/pages/admin-restaurants"));
const AdminPlatform = lazy(() => import("@/pages/admin-platform"));
const CustomerOrderTracking = lazy(() => import("@/pages/customer-order-tracking"));
const DriverMap = lazy(() => import("@/pages/driver-map"));
const AnalyticsDashboard = lazy(() => import("@/pages/analytics-dashboard"));
const AdminWebhookConfig = lazy(() => import("@/pages/admin-webhook-config"));
const RestaurantPromotions = lazy(() => import("@/pages/restaurant-promotions"));
const CustomerRating = lazy(() => import("@/pages/customer-rating"));
const RestaurantRatings = lazy(() => import("@/pages/restaurant-ratings"));
const RestaurantIntegrations = lazy(() => import("@/pages/restaurant-integrations"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
      <p className="text-muted-foreground text-sm">Carregando...</p>
    </div>
  </div>
);

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
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
        <Route path="/restaurant/integrations" component={RestaurantIntegrations} />
        <Route path="/restaurant/driver-map" component={DriverMap} />
        <Route path="/restaurant/analytics" component={AnalyticsDashboard} />
        <Route path="/restaurant/promotions" component={RestaurantPromotions} />
        <Route path="/restaurant/ratings" component={RestaurantRatings} />
        <Route path="/customer/rating" component={CustomerRating} />
        <Route path="/driver/dashboard" component={DeliveryDashboard} />
        <Route path="/kitchen/dashboard" component={KitchenDashboard} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/restaurants" component={AdminRestaurants} />
        <Route path="/admin/platform" component={AdminPlatform} />
        <Route path="/admin/webhook-config" component={AdminWebhookConfig} />
        <Route path="/customer/order/:id" component={CustomerOrderTracking} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <Router />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
