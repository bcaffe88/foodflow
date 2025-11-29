import { useEffect, useState, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { ChevronLeft, MapPin, Clock, Phone, Truck } from "lucide-react";
import type { Order, OrderItem, User } from "@shared/schema";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const statusStages = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];
const statusLabels: Record<string, string> = {
  pending: "Confirmando",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Pronto para retirada",
  out_for_delivery: "Saindo para entrega",
  delivered: "Entregue",
};

const statusEmojis: Record<string, React.ReactNode> = {
  pending: "⏳",
  confirmed: "✅",
  preparing: "👨‍🍳",
  ready: "📦",
  out_for_delivery: "🏍️",
  delivered: "🎉",
};

// Fix Leaflet icon issue
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function CustomerOrderTracking() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/customer/order/:id");
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    try {
      mapInstanceRef.current = L.map(mapRef.current).setView([-7.9056, -40.1056], 13);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(mapInstanceRef.current);
    } catch (error) {
      console.error('Map init error:', error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Poll for order updates and driver location
  useEffect(() => {
    if (params?.id) {
      loadOrder();
      const interval = setInterval(() => {
        loadOrder();
        // Poll for driver location if order is out for delivery
        if (order?.status === "out_for_delivery" && order?.driverId) {
          loadDriverLocation();
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [params?.id, order?.driverId]);

  const loadOrder = async () => {
    try {
      if (!params?.id) return;
      const orderData = await apiRequest("GET", `/api/orders/${params.id}`);
      const itemsData = await apiRequest("GET", `/api/orders/${params.id}/items`);
      setOrder(orderData);
      setOrderItems(itemsData);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar pedido", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDriverLocation = async () => {
    try {
      if (!order?.driverId) return;
      const driverData = await apiRequest("GET", `/api/drivers/${order.driverId}`);
      if (driverData?.currentLatitude && driverData?.currentLongitude) {
        const loc = { lat: Number(driverData.currentLatitude), lng: Number(driverData.currentLongitude) };
        setDriverLocation(loc);
        
        // Update map marker if map exists
        if (mapInstanceRef.current) {
          const existing = (mapInstanceRef.current as any).driverMarker;
          if (existing) {
            existing.setLatLng([loc.lat, loc.lng]);
          } else {
            const marker = L.marker([loc.lat, loc.lng], { title: 'Motorista' }).addTo(mapInstanceRef.current);
            (mapInstanceRef.current as any).driverMarker = marker;
          }
          // Add destination marker if we have it
          if (order?.addressLatitude && order?.addressLongitude) {
            const destLat = Number(order.addressLatitude);
            const destLng = Number(order.addressLongitude);
            if (!(mapInstanceRef.current as any).destinationMarker) {
              const destMarker = L.marker([destLat, destLng], { 
                title: 'Destino',
                icon: L.icon({
                  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                  iconSize: [25, 41]
                })
              }).addTo(mapInstanceRef.current);
              (mapInstanceRef.current as any).destinationMarker = destMarker;
            }
            // Auto-fit both markers in view
            mapInstanceRef.current.fitBounds([[loc.lat, loc.lng], [destLat, destLng]], { padding: [50, 50] });
          }
        }
      }
    } catch (error) {
      console.error('Driver location error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-md">
          <p className="text-muted-foreground text-sm md:text-base">Pedido não encontrado</p>
        </Card>
      </div>
    );
  }

  const currentStageIndex = statusStages.indexOf(order.status);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 md:py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/customer/orders")}
            data-testid="button-back"
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Truck className="h-5 md:h-6 w-5 md:w-6 text-primary" />
            <div>
              <h1 className="text-lg md:text-xl font-bold truncate">Acompanhando Pedido</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                #{order.id.slice(0, 8)} • {new Date(order.createdAt || Date.now()).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 md:py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6">
          {/* Live Map - Show when out for delivery */}
          {order?.status === "out_for_delivery" && (
            <Card className="overflow-hidden">
              <div 
                ref={mapRef}
                className="w-full h-64 md:h-96 bg-muted"
                data-testid="container-delivery-map"
              />
            </Card>
          )}

          {/* Timeline/Progress */}
          <Card className="p-4 md:p-6">
            <h2 className="font-bold mb-4 md:mb-6 text-sm md:text-base">Status do Pedido</h2>
          <div className="space-y-4">
            {statusStages.map((stage, index) => (
              <div key={stage} className="flex items-center gap-3 md:gap-4" data-testid={`status-${stage}`}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 md:w-10 h-8 md:h-10 rounded-full flex items-center justify-center text-sm md:text-lg font-bold ${
                      index <= currentStageIndex
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {statusEmojis[stage]}
                  </div>
                  {index < statusStages.length - 1 && (
                    <div
                      className={`w-0.5 md:w-1 h-8 md:h-12 my-1 md:my-2 ${
                        index < currentStageIndex ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
                <div>
                  <p className={`font-semibold text-xs md:text-sm ${index <= currentStageIndex ? "" : "text-muted-foreground"}`}>
                    {statusLabels[stage]}
                  </p>
                  {index === currentStageIndex && (
                    <p className="text-xs md:text-sm text-primary">Em progresso</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Delivery Info */}
        {order.deliveryType === "delivery" && (
          <Card className="p-4 md:p-6">
            <h2 className="font-bold mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
              <MapPin className="h-4 w-4" />
              Endereço de Entrega
            </h2>
            <p className="text-xs md:text-sm mb-2" data-testid="text-address">{order.deliveryAddress}</p>
            {order.deliveryReference && (
              <p className="text-xs md:text-sm text-muted-foreground">Ref: {order.deliveryReference}</p>
            )}
            {order.driverPhone && (
              <Button
                variant="outline"
                className="mt-4 w-full text-xs md:text-sm"
                onClick={() => window.open(`tel:${order.driverPhone}`)}
                data-testid="button-call-driver"
              >
                <Phone className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Ligar para Motorista
              </Button>
            )}
          </Card>
        )}

        {/* Items */}
        <Card className="p-4 md:p-6">
          <h2 className="font-bold mb-3 md:mb-4 text-sm md:text-base">Itens do Pedido</h2>
          <div className="space-y-2 md:space-y-3">
            {orderItems.map((item, idx) => (
              <div key={item.id} className="flex justify-between items-center pb-2 md:pb-3 border-b last:border-0" data-testid={`item-${idx}`}>
                <div>
                  <p className="font-medium text-xs md:text-sm">{item.name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                </div>
                <p className="font-semibold text-xs md:text-sm">R$ {(Number(item.price) * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Total */}
        <Card className="p-4 md:p-6">
          <div className="space-y-2 md:space-y-3">
            <div className="flex justify-between text-xs md:text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>R$ {(Number(order.total) * 0.85).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs md:text-sm">
              <span className="text-muted-foreground">Taxa de Entrega</span>
              <span>R$ {(Number(order.total) * 0.15).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm md:text-base border-t pt-2 md:pt-3" data-testid="text-total">
              <span>Total</span>
              <span>R$ {Number(order.total).toFixed(2)}</span>
            </div>
            <div className="mt-3">
              <Badge variant="outline" className="text-xs md:text-sm" data-testid={`badge-payment-${order.paymentMethod}`}>{order.paymentMethod}</Badge>
            </div>
          </div>
        </Card>
        </motion.div>
      </main>
    </div>
  );
}
