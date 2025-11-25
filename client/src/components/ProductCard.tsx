import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  onAddToCart: (productId: string) => void;
}

function ProductCard({
  id,
  name,
  description,
  price,
  image,
  onAddToCart,
}: ProductCardProps) {
  const numPrice = parseFloat(price);

  return (
    <Card className="overflow-hidden group h-full flex flex-col hover-elevate transition-all duration-200">
      {/* Image Container */}
      <div className="aspect-video w-full overflow-hidden bg-muted rounded-md">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          data-testid={`img-product-${id}`}
        />
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        {/* Name & Description */}
        <h3 className="font-bold text-lg mb-2 line-clamp-2" data-testid={`text-product-name-${id}`}>
          {name}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description}
        </p>

        {/* Footer: Price & Button */}
        <div className="mt-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">A partir de</span>
            <span 
              className="text-2xl font-bold text-red-600"
              data-testid={`text-price-${id}`}
            >
              R$ {numPrice.toFixed(2)}
            </span>
          </div>

          <Button
            size="icon"
            className="bg-red-600 hover:bg-red-700 rounded-full h-12 w-12 flex-shrink-0"
            onClick={() => onAddToCart(id)}
            data-testid={`button-add-${id}`}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default memo(ProductCard);
