import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import CategoryTabs from "@/components/CategoryTabs";
import HeroMenu from "@/components/HeroMenu";
import ProductCard from "@/components/ProductCard";
import CartSheet from "@/components/CartSheet";
import CheckoutDialog from "@/components/CheckoutDialog";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { mockProductsData, mockCategoriesData } from "@/lib/mockProducts";
import { Menu } from "lucide-react";
import type { CartItem, Tenant, Product, Category } from "@shared/schema";

interface ApiProduct {
  id: string;
  name: string;
  description?: string;
  price: string;
  image?: string;
  categoryId: string;
  [key: string]: any;
}

interface StorefrontTenant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  phone: string;
  address: string;
  whatsappPhone: string;
}

function StorefrontView({ slug }: { slug: string }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tenant, setTenant] = useState<StorefrontTenant | null>(null);
  const [categories, setCategories] = useState<Category[]>(mockCategoriesData as any);
  const [products, setProducts] = useState<ApiProduct[]>(mockProductsData as ApiProduct[]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [deliveryType, setDeliveryType] = useState("delivery");
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load data from API with fallback to mock
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [tenantData, cats, prods] = await Promise.all([
          apiRequest("GET", `/api/storefront/${slug}`),
          apiRequest("GET", `/api/storefront/${slug}/categories`),
          apiRequest("GET", `/api/storefront/${slug}/products`),
        ]);

        if (tenantData && Object.keys(tenantData).length > 0) {
          setTenant(tenantData);
        }
        
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats);
          setActiveCategory(cats[0].id);
        } else {
          setCategories(mockCategoriesData as any);
          setActiveCategory((mockCategoriesData as any)[0]?.id || "");
        }
        
        if (Array.isArray(prods) && prods.length > 0) {
          setProducts(prods);
        } else {
          setProducts(mockProductsData as ApiProduct[]);
        }
        
        setDataLoaded(true);
      } catch (error) {
        console.log("API call failed, using mock data:", error);
        // Fallback to mock data
        setCategories(mockCategoriesData as any);
        setProducts(mockProductsData as ApiProduct[]);
        setActiveCategory((mockCategoriesData as any)[0]?.id || "");
        setDataLoaded(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  // Set active category once categories are loaded (fallback for edge cases)
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.categoryId === activeCategory);
  }, [products, activeCategory]);

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const price = typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price);

    setCartItems(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: price,
        quantity: 1,
      }];
    });

    toast({
      title: "Adicionado ao carrinho!",
      description: `${product.name} foi adicionado ao seu pedido.`,
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.productId !== productId));
    } else {
      setCartItems(prev =>
        prev.map(item =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 5.0;
  const total = subtotal + deliveryFee;

  interface CheckoutData {
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    addressLatitude?: string;
    addressLongitude?: string;
    orderNotes?: string;
    subtotal: string;
    deliveryFee: string;
    total: string;
  }

  const handleCheckoutSubmit = async (data: CheckoutData) => {
    setIsProcessingPayment(true);
    try {
      const order = await apiRequest("POST", `/api/storefront/${slug}/orders`, {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        deliveryAddress: data.deliveryAddress,
        addressLatitude: data.addressLatitude,
        addressLongitude: data.addressLongitude,
        orderNotes: data.orderNotes,
        items: cartItems,
        deliveryFee: data.deliveryFee,
        subtotal: data.subtotal,
        total: data.total,
        paymentMethod: paymentMethod,
        deliveryType: deliveryType,
        paymentIntentId: (data as any).paymentIntentId,
      });

      // Limpar carrinho
      setCartItems([]);
      setCheckoutOpen(false);
      setCartOpen(false);

      // Se Stripe, ir para checkout para pagamento
      if (paymentMethod === "stripe") {
        navigate(`/checkout?orderId=${order.id}&total=${data.total}`);
      } else {
        // Se PIX ou dinheiro, ir direto para confirmação (sem pagamento)
        navigate(`/order-confirmation?orderId=${order.id}`);
      }

      setPaymentMethod("pix");
      setDeliveryType("delivery");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao processar pedido. Tente novamente.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header cartItemCount={cartItems.length} onCartClick={() => setCartOpen(true)} />
      
      {/* Hero Section */}
      <HeroMenu 
        image={tenant?.logo || "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=1920&h=1080&fit=crop"}
        title={tenant?.name || "Pizzas Artesanais Direto do Forno"}
        subtitle={tenant?.description || "Entrega rápida em 30-40 minutos"}
      />

      {/* Category Tabs */}
      {categories.length > 0 && (
        <CategoryTabs 
          categories={categories} 
          activeCategory={activeCategory} 
          onCategoryClick={setActiveCategory}
        />
      )}

      {/* Products Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 md:px-4 py-8 md:py-12">
        {loading ? (
          <div className="text-center py-12 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-xs md:text-base">Nenhum produto disponível nesta categoria</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            {filteredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                data-testid={`product-${product.id}`}
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  description={product.description || ""}
                  price={product.price}
                  image={product.image || "https://via.placeholder.com/400"}
                  onAddToCart={handleAddToCart}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Cart & Checkout */}
      <CartSheet
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={(productId: string) => setCartItems(prev => prev.filter(item => item.productId !== productId))}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
      />
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={cartItems}
        total={total}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        deliveryType={deliveryType}
        onDeliveryTypeChange={setDeliveryType}
        onSubmit={handleCheckoutSubmit}
      />

      <Footer />
    </div>
  );
}

export default function Home() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "wilson-pizza";

  return <StorefrontView slug={slug} />;
}
