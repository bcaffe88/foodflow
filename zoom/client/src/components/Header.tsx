import { memo } from "react";
import { ShoppingCart, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
}

function Header({ cartItemCount, onCartClick }: HeaderProps) {
  const [, navigate] = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-card-border">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cardápio Online</h1>
            <p className="text-sm text-muted-foreground">Peça já pelo WhatsApp!</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => navigate("/customer/orders")}
              data-testid="button-my-orders"
              title="Meus Pedidos"
            >
              <Package className="h-5 w-5" />
            </Button>

            <Button
              size="icon"
              variant="outline"
              onClick={onCartClick}
              className="relative"
              data-testid="button-cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground text-xs"
                  data-testid="badge-cart-count"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default memo(Header);
