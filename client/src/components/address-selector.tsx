import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Loader } from "lucide-react";

interface AddressSuggestion {
  osm_id: string;
  display_name: string;
  lat: string;
  lon: string;
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
  placeholder = "Digite seu endereço em Ouricuri, PE...",
  value = "",
}: AddressSelectorProps) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Free OpenStreetMap Nominatim API - no key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Ouricuri, Pernambuco, Brasil&limit=5`,
        {
          headers: { 'User-Agent': 'FoodFlow-App' }
        }
      );
      
      const results = await response.json();
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    await searchAddresses(value);
  };

  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    const address = {
      address: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
      reference: suggestion.display_name,
    };
    
    setInput(suggestion.display_name);
    setShowSuggestions(false);
    onAddressSelect(address);
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
