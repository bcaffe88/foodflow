import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import RestaurantSettings from "./pages/RestaurantSettings";
import ProductManagement from "./pages/ProductManagement";
import TestLogin from "./pages/TestLogin";
import KitchenDashboard from "./pages/KitchenDashboard";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/test-login"} component={TestLogin} />
      <Route path={"/checkout"} component={Checkout} />
      <Route path={"/restaurant"} component={RestaurantDashboard} />
      <Route path={"/developer"} component={DeveloperDashboard} />
      <Route path={"/delivery"} component={DeliveryDashboard} />
      <Route path={"/kitchen"} component={KitchenDashboard} />
      <Route path={"/restaurant/settings"} component={RestaurantSettings} />
      <Route path={"/restaurant/products"} component={ProductManagement} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
