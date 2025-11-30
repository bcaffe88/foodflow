import { useState, useEffect, useRef } from "react";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, Loader2 } from "lucide-react";

interface AddressSelectorProps {
  onAddressSelect: (address: {
    formatted: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialAddress?: string;
}

export default function AddressSelector({
  onAddressSelect,
  initialAddress = "",
}: AddressSelectorProps) {
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();

    // Default to Ouricuri, PE
    const defaultLocation = { lat: -7.8833, lng: -40.0833 };
    map.setCenter(defaultLocation);
    map.setZoom(14);

    // Create marker
    markerRef.current = new google.maps.Marker({
      map: map,
      position: defaultLocation,
      draggable: true,
      title: "Arraste para ajustar o endereço",
    });

    // Handle marker drag
    markerRef.current.addListener("dragend", () => {
      if (markerRef.current) {
        const position = markerRef.current.getPosition();
        if (position) {
          reverseGeocode(position.lat(), position.lng());
        }
      }
    });

    // Handle map click
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng && markerRef.current) {
        markerRef.current.setPosition(e.latLng);
        reverseGeocode(e.latLng.lat(), e.latLng.lng());
      }
    });

    // Search initial address if provided
    if (initialAddress) {
      searchAddress(initialAddress);
    }
  };

  const searchAddress = async (query: string) => {
    if (!query.trim() || !geocoderRef.current || !mapRef.current) return;

    setIsSearching(true);

    try {
      const result = await geocoderRef.current.geocode({
        address: query + ", Ouricuri, PE, Brasil",
      });

      if (result.results && result.results[0]) {
        const location = result.results[0].geometry.location;
        const formatted = result.results[0].formatted_address;

        setSelectedAddress(formatted);
        setCoordinates({ lat: location.lat(), lng: location.lng() });

        if (mapRef.current && markerRef.current) {
          mapRef.current.setCenter(location);
          mapRef.current.setZoom(16);
          markerRef.current.setPosition(location);
        }

        onAddressSelect({
          formatted: formatted,
          latitude: location.lat(),
          longitude: location.lng(),
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!geocoderRef.current) return;

    try {
      const result = await geocoderRef.current.geocode({
        location: { lat, lng },
      });

      if (result.results && result.results[0]) {
        const formatted = result.results[0].formatted_address;
        setSelectedAddress(formatted);
        setCoordinates({ lat, lng });
        setSearchQuery(formatted);

        onAddressSelect({
          formatted: formatted,
          latitude: lat,
          longitude: lng,
        });
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchAddress(searchQuery);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="address-search" className="sr-only">
            Buscar endereço
          </Label>
          <Input
            id="address-search"
            placeholder="Digite o endereço (rua, número, bairro...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isSearching}>
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      <Card>
        <CardContent className="p-0">
          <div className="h-[400px] rounded-lg overflow-hidden">
            <MapView onMapReady={handleMapReady} />
          </div>
        </CardContent>
      </Card>

      {selectedAddress && (
        <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
          <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Endereço selecionado:</p>
            <p className="text-sm text-muted-foreground">{selectedAddress}</p>
            {coordinates && (
              <p className="text-xs text-muted-foreground mt-1">
                Coordenadas: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        💡 Dica: Clique no mapa ou arraste o marcador para ajustar o endereço
      </div>
    </div>
  );
}
