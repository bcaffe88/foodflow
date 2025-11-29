import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface DriverLocation {
  driverId: string;
  name: string;
  lat: string | number;
  lng: string | number;
  onlineStatus: boolean;
}

export default function DriverMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Get restaurant tenant from URL or session
  const getTenantId = () => {
    const url = new URL(window.location.href);
    return url.searchParams.get('tenantId') || localStorage.getItem('tenantId') || 'default';
  };

  const { data: drivers = [] } = useQuery<DriverLocation[]>({
    queryKey: ['/api/driver/active-locations', getTenantId()],
    refetchInterval: 10000, // Atualiza a cada 10s (mesmo intervalo do GPS)
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with default center (São Paulo)
    const defaultCenter = { lat: -23.5505, lng: -46.6333 };

    if (!map.current) {
      // Fallback: Mostrar lista de drivers sem mapa
      // Em produção, usar Google Maps API com chave
      return;
    }
  }, []);

  // Update markers when drivers change
  useEffect(() => {
    if (!drivers.length) return;

    // Limpar markers antigos
    markers.forEach((marker) => {
      if (marker.remove) marker.remove();
    });

    const newMarkers: any[] = [];
    drivers.forEach((driver) => {
      if (!driver.lat || !driver.lng) return;

      const lat = typeof driver.lat === 'string' ? parseFloat(driver.lat) : driver.lat;
      const lng = typeof driver.lng === 'string' ? parseFloat(driver.lng) : driver.lng;

      // Criar marcador (implementação simplificada sem Google Maps)
      // Em produção, usar marker com ícone do Google Maps
      newMarkers.push({
        id: driver.driverId,
        lat,
        lng,
        name: driver.name,
        status: driver.onlineStatus,
      });
    });

    setMarkers(newMarkers);
  }, [drivers]);

  return (
    <div className="w-full h-screen flex flex-col" data-testid="page-driver-map">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-2xl font-bold" data-testid="text-driver-map-title">
          Rastrear Entregadores em Tempo Real
        </h1>
        <Button 
          variant="outline" 
          onClick={() => setLocation('/restaurant/dashboard')}
          data-testid="button-back-dashboard"
        >
          Voltar
        </Button>
      </div>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Map Container */}
        <div
          ref={mapContainer}
          className="flex-1 rounded-lg border bg-slate-100 flex items-center justify-center"
          data-testid="container-map"
        >
          <div className="text-center">
            <p className="text-gray-500 mb-4">
              Mapa de drivers em tempo real
            </p>
            <p className="text-sm text-gray-400">
              (Integração com Google Maps em produção)
            </p>
          </div>
        </div>

        {/* Drivers List */}
        <div className="w-80 border rounded-lg overflow-y-auto" data-testid="panel-drivers-list">
          <div className="sticky top-0 p-4 border-b bg-white">
            <h2 className="font-semibold">
              Entregadores Online ({drivers.filter(d => d.onlineStatus).length})
            </h2>
          </div>

          <div className="p-4 space-y-3">
            {drivers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Nenhum entregador online no momento
              </p>
            ) : (
              drivers.map((driver) => (
                <Card
                  key={driver.driverId}
                  className="p-3 hover-elevate cursor-pointer"
                  data-testid={`card-driver-${driver.driverId}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate" data-testid={`text-driver-name-${driver.driverId}`}>
                        {driver.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {driver.lat && driver.lng ? (
                          <>
                            📍 {parseFloat(String(driver.lat)).toFixed(4)}, {parseFloat(String(driver.lng)).toFixed(4)}
                          </>
                        ) : (
                          'Localização não disponível'
                        )}
                      </p>
                    </div>
                    <Badge
                      variant={driver.onlineStatus ? 'default' : 'secondary'}
                      data-testid={`badge-status-${driver.driverId}`}
                    >
                      {driver.onlineStatus ? '🟢 Online' : '🔴 Offline'}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
