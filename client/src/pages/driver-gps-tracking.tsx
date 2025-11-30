import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Navigation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

interface AssignedOrder {
  id: string;
  orderId: string;
  driverId: string;
  status: "pending" | "assigned" | "pickup" | "delivering" | "delivered";
  estimatedDeliveryTime: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  restaurantAddress: string;
}

export default function DriverGPSTracking() {
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [tracking, setTracking] = useState(false);

  // Get assigned orders
  const { data: assignedOrders, isLoading } = useQuery<AssignedOrder[]>({
    queryKey: ["/api/driver/assigned-orders"],
  });

  // Update driver location
  const updateLocationMutation = useMutation({
    mutationFn: async (coords: { lat: number; lng: number }) => {
      const response = await fetch("/api/driver/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng,
        }),
      });
      return response.json();
    },
  });

  // Start GPS tracking
  useEffect(() => {
    if (!tracking) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({
          driverId: "",
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString(),
        });

        // Send to server
        updateLocationMutation.mutate({ lat: latitude, lng: longitude });
      },
      (error) => console.error("GPS error:", error),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking]);

  if (isLoading) {
    return <Skeleton className="h-96 w-full m-6" />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* GPS Control */}
      <Card data-testid="card-gps-control">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Rastreamento GPS</CardTitle>
          <Button
            data-testid="button-gps-toggle"
            variant={tracking ? "destructive" : "default"}
            onClick={() => setTracking(!tracking)}
          >
            {tracking ? "Parar Rastreamento" : "Iniciar Rastreamento"}
          </Button>
        </CardHeader>
        <CardContent>
          {location && (
            <div className="space-y-2">
              <p data-testid="text-latitude">Latitude: {location.latitude.toFixed(4)}</p>
              <p data-testid="text-longitude">Longitude: {location.longitude.toFixed(4)}</p>
              <p data-testid="text-accuracy">Precisão: {location.accuracy.toFixed(0)}m</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Orders */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Pedidos Atribuídos</h2>
        {assignedOrders?.map((order) => (
          <Card key={order.id} data-testid={`card-order-${order.id}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Pedido #{order.orderId}</CardTitle>
              <Badge
                data-testid={`badge-status-${order.id}`}
                variant={order.status === "delivered" ? "default" : "secondary"}
              >
                {order.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span data-testid={`text-address-${order.id}`}>{order.deliveryAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a
                  href={`tel:${order.customerPhone}`}
                  data-testid={`link-phone-${order.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {order.customerPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                <span data-testid={`text-eta-${order.id}`}>
                  ETA: {order.estimatedDeliveryTime} min
                </span>
              </div>
              <Button
                data-testid={`button-navigate-${order.id}`}
                className="w-full"
                variant="outline"
              >
                Abrir no Mapa
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
