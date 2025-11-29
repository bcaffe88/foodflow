import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DriverLocation {
  driverId: string;
  name: string;
  lat: string | number;
  lng: string | number;
  onlineStatus: boolean;
}

// Fix Leaflet icon issue (marker icons not loading)
const defaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export default function DriverMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
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

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      // Initialize map centered on Ouricuri, PE
      map.current = L.map(mapContainer.current).setView([-7.9056, -40.1056], 13);

      // Add OpenStreetMap tiles (FREE, no API key needed)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
        className: 'map-tiles'
      }).addTo(map.current);

      toast({
        title: 'Mapa carregado',
        description: 'Usando OpenStreetMap'
      });
    } catch (error) {
      console.error('Leaflet map error:', error);
      toast({
        title: 'Erro ao carregar mapa',
        variant: 'destructive'
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [toast]);

  // Update markers when drivers change
  useEffect(() => {
    if (!map.current) return;

    // Parse driver coordinates
    const validDrivers = drivers.filter(driver => driver.lat && driver.lng);

    // Update or create markers
    const driverIds = new Set(validDrivers.map(d => d.driverId));

    // Remove markers for drivers no longer online
    markersRef.current.forEach((marker, driverId) => {
      if (!driverIds.has(driverId)) {
        map.current?.removeLayer(marker);
        markersRef.current.delete(driverId);
      }
    });

    // Add/update markers for active drivers
    validDrivers.forEach((driver) => {
      const lat = typeof driver.lat === 'string' ? parseFloat(driver.lat) : driver.lat;
      const lng = typeof driver.lng === 'string' ? parseFloat(driver.lng) : driver.lng;

      if (isNaN(lat) || isNaN(lng)) return;

      if (markersRef.current.has(driver.driverId)) {
        // Update existing marker position
        markersRef.current.get(driver.driverId)?.setLatLng([lat, lng]);
      } else {
        // Create new marker
        const marker = L.marker([lat, lng], { icon: defaultIcon })
          .bindPopup(
            `<div class="font-semibold">${driver.name}</div>
             <div class="text-xs text-gray-600">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
             <div class="text-xs mt-1">${driver.onlineStatus ? '🟢 Online' : '🔴 Offline'}</div>`
          )
          .addTo(map.current!);
        markersRef.current.set(driver.driverId, marker);
      }
    });
  }, [drivers]);

  return (
    <div className="w-full h-screen flex flex-col" data-testid="page-driver-map">
      <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-base md:text-2xl" data-testid="text-driver-map-title">
          🗺️ Mapa de Entregadores
        </h1>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setLocation('/restaurant/dashboard')}
          data-testid="button-back-dashboard"
        >
          ← Voltar
        </Button>
      </div>

      {/* Mobile: stack vertically, Desktop: flex row */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden bg-slate-50">
        {/* Leaflet Map Container */}
        <div
          ref={mapContainer}
          className="flex-1 rounded-lg border border-slate-200 bg-white shadow-md overflow-hidden h-96 md:h-auto"
          data-testid="container-map-leaflet"
          style={{ minHeight: 0 }}
        />

        {/* Drivers List Panel - Mobile: hidden, Desktop: visible */}
        <div className="hidden md:flex w-80 border border-slate-200 rounded-lg bg-white shadow-md flex-col overflow-hidden" data-testid="panel-drivers-list">
          <div className="p-4 border-b border-slate-200 bg-slate-50 sticky top-0">
            <h2 className="font-semibold text-sm">
              🟢 Entregadores Online ({drivers.filter(d => d.onlineStatus).length}/{drivers.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {drivers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">
                  Nenhum entregador online no momento
                </p>
              </div>
            ) : (
              drivers.map((driver) => (
                <Card
                  key={driver.driverId}
                  className="p-3 hover-elevate active-elevate-2 cursor-pointer transition-all"
                  data-testid={`card-driver-${driver.driverId}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm" data-testid={`text-driver-name-${driver.driverId}`}>
                        {driver.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1.5 font-mono">
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
                      className="whitespace-nowrap text-xs"
                    >
                      {driver.onlineStatus ? '🟢 Online' : '🔴 Offline'}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-gray-600">
            ⏱️ Atualiza a cada 10 segundos
          </div>
        </div>

        {/* Mobile Drivers List - shown below map on mobile */}
        <div className="md:hidden border border-slate-200 rounded-lg bg-white shadow-md flex flex-col overflow-hidden h-48" data-testid="panel-drivers-list-mobile">
          <div className="p-3 border-b border-slate-200 bg-slate-50 sticky top-0">
            <h2 className="font-semibold text-xs">
              🟢 Entregadores ({drivers.filter(d => d.onlineStatus).length}/{drivers.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {drivers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-gray-500">Nenhum entregador online</p>
              </div>
            ) : (
              drivers.map((driver) => (
                <Card key={driver.driverId} className="p-2 hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-driver-mobile-${driver.driverId}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-xs" data-testid={`text-driver-mobile-${driver.driverId}`}>{driver.name}</p>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {driver.lat && driver.lng ? `📍 ${parseFloat(String(driver.lat)).toFixed(4)}, ${parseFloat(String(driver.lng)).toFixed(4)}` : 'Sem localização'}
                      </p>
                    </div>
                    <Badge variant={driver.onlineStatus ? 'default' : 'secondary'} className="text-xs whitespace-nowrap">
                      {driver.onlineStatus ? '🟢' : '🔴'}
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
