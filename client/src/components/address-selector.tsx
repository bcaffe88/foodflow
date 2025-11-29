import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Loader } from "lucide-react";

interface AddressSuggestion {
  place_id: string;
  description: string;
  latitude: number;
  longitude: number;
}

interface AddressSelectorProps {
  onAddressSelect: (address: {
    address: string;
    latitude: number;
    longitude: number;
    reference: string;
  }) => void;
  placeholder?: string;
  value?: string;
}

export function AddressSelector({
  onAddressSelect,
  placeholder = "Digite seu endereço...",
  value = "",
}: AddressSelectorProps) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);

  useEffect(() => {
    // Initialize Google Maps API
    if (!window.google) {
      console.warn("Google Maps API not loaded");
      return;
    }

    autocompleteService.current =
      new window.google.maps.places.AutocompleteService();
    placesService.current = new window.google.maps.places.PlacesService(
      document.createElement("div")
    );
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      if (autocompleteService.current) {
        const predictions =
          await autocompleteService.current.getPlacePredictions({
            input: value,
            componentRestrictions: { country: "br" },
          });

        const suggestions = (predictions.predictions || []).map((p: any) => ({
          place_id: p.place_id,
          description: p.description,
          latitude: 0,
          longitude: 0,
        }));

        setSuggestions(suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    setInput(suggestion.description);
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      if (placesService.current) {
        placesService.current.getDetails(
          { placeId: suggestion.place_id },
          (place: any) => {
            if (place && place.geometry) {
              onAddressSelect({
                address: place.formatted_address || suggestion.description,
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng(),
                reference: place.formatted_address || suggestion.description,
              });
            } else {
              onAddressSelect({
                address: suggestion.description,
                latitude: 0,
                longitude: 0,
                reference: suggestion.description,
              });
            }
            setIsLoading(false);
          }
        );
      }
    } catch (error) {
      console.error("Error getting place details:", error);
      onAddressSelect({
        address: suggestion.description,
        latitude: 0,
        longitude: 0,
        reference: suggestion.description,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={input}
          onChange={handleInputChange}
          onFocus={() => input.length >= 3 && setShowSuggestions(true)}
          className="pl-10"
          data-testid="input-address"
        />
        {isLoading && (
          <Loader className="absolute right-3 top-3 h-4 w-4 text-primary animate-spin" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-0 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b last:border-0 flex items-start gap-2"
              data-testid={`button-suggestion-${suggestion.place_id}`}
            >
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{suggestion.description}</p>
              </div>
            </button>
          ))}
        </Card>
      )}

      {showSuggestions && input.length >= 3 && suggestions.length === 0 && !isLoading && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 p-4 text-center text-sm text-muted-foreground">
          Nenhum endereço encontrado
        </Card>
      )}
    </div>
  );
}
