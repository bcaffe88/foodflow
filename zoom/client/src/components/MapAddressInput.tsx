import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Locate } from "lucide-react";

interface MapAddressInputProps {
  value: string;
  onChange: (address: string, lat?: string, lng?: string) => void;
  onLatLngChange?: (lat: string, lng: string) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

export default function MapAddressInput({
  value,
  onChange,
  onLatLngChange,
}: MapAddressInputProps) {
  const [address, setAddress] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get current location
  const handleGetLocation = () => {
    setIsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode using Google Maps API
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            const fullAddress = data.results[0].formatted_address;
            setAddress(fullAddress);
            // Pass coordinates via onChange
            onChange(fullAddress, latitude.toString(), longitude.toString());
            // Also call the legacy callback if provided
            if (onLatLngChange) {
              onLatLngChange(latitude.toString(), longitude.toString());
            }
          }
          setIsLoading(false);
        },
        () => {
          alert("Não foi possível obter sua localização");
          setIsLoading(false);
        }
      );
    }
  };

  // Handle manual address input with autocomplete
  const handleAddressChange = async (inputValue: string) => {
    setAddress(inputValue);
    onChange(inputValue);

    if (inputValue.length > 2) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${inputValue}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
        );
        // Predictions will be shown via native browser autocomplete
      } catch (error) {
        // Silently fail for autocomplete
      }
    }
  };

  // Get coordinates when address is entered
  const handleAddressSubmit = async () => {
    if (!address) return;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        const fullAddress = data.results[0].formatted_address;
        
        setAddress(fullAddress);
        // Pass lat/lng via onChange callback
        onChange(fullAddress, lat.toString(), lng.toString());
        // Also call the legacy callback if provided
        if (onLatLngChange) {
          onLatLngChange(lat.toString(), lng.toString());
        }
      } else {
        alert("Endereço não encontrado. Tente novamente.");
      }
    } catch (error) {
      alert("Erro ao buscar endereço");
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Endereço de Entrega</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Digite seu endereço..."
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddressSubmit();
              }
            }}
            className="pl-9"
            data-testid="input-address"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleGetLocation}
          disabled={isLoading}
          data-testid="button-current-location"
          title="Usar localização atual"
        >
          <Locate className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Pressione Enter ou clique no ícone de localização para confirmar
      </p>
    </div>
  );
}
