/**
 * Maps Service - Open Source (OpenStreetMap / Nominatim)
 * Substitui Google Maps completamente sem custos
 * 
 * Estratégias:
 * 1. Nominatim API (OpenStreetMap) - Geolocalização gratuita
 * 2. Simple geohashing - Cálculo local de distância
 * 3. In-memory caching - Para melhor performance
 */

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
  complement?: string;
}

export interface GeocodingResult {
  address: string;
  latitude: number;
  longitude: number;
  accuracy?: string;
}

export interface RouteResult {
  distance: number; // em km
  duration: number; // em minutos
  routePoints?: Array<{ latitude: number; longitude: number }>;
}

class MapsService {
  private cache: Map<string, GeocodingResult> = new Map();
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa o serviço de maps
   */
  private initialize() {
    console.log('[MapsService] ✅ Serviço de Maps inicializado (OpenStreetMap)');
    console.log('[MapsService] Usando Nominatim API (Open Source & Gratuito)');
    console.log('[MapsService] Sem custos, sem API key necessária');
  }

  /**
   * Geocodifica um endereço para coordenadas
   */
  async geocodeAddress(address: Address | string): Promise<GeocodingResult | null> {
    const addressString =
      typeof address === 'string'
        ? address
        : `${address.street}, ${address.number}, ${address.city}, ${address.state}, ${address.zipCode}, Brazil`;

    // Verifica cache
    if (this.cache.has(addressString)) {
      console.log(`[MapsService] ✅ Endereço encontrado em cache: ${addressString}`);
      return this.cache.get(addressString)!;
    }

    try {
      console.log(`[MapsService] 🔍 Geocodificando: ${addressString}`);

      const response = await fetch(
        `${this.NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(addressString)}&limit=1`,
        {
          headers: {
            'User-Agent': 'FoodFlow/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const results = await response.json();

      if (!results || results.length === 0) {
        console.warn(`[MapsService] ⚠️ Endereço não encontrado: ${addressString}`);
        return null;
      }

      const result = results[0];
      const geocodingResult: GeocodingResult = {
        address: result.display_name,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        accuracy: result.type,
      };

      // Armazena em cache
      this.cache.set(addressString, geocodingResult);
      console.log(
        `[MapsService] ✅ Geocodificado: ${result.display_name} (${geocodingResult.latitude}, ${geocodingResult.longitude})`
      );

      return geocodingResult;
    } catch (error) {
      console.error(
        '[MapsService] ❌ Erro ao geocodificar:',
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }

  /**
   * Reverso geocodifica (coordenadas para endereço)
   */
  async reverseGeocode(location: GeoLocation): Promise<string | null> {
    const cacheKey = `${location.latitude},${location.longitude}`;

    try {
      const response = await fetch(
        `${this.NOMINATIM_URL}/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`,
        {
          headers: {
            'User-Agent': 'FoodFlow/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const result = await response.json();
      return result.address?.road || result.display_name || null;
    } catch (error) {
      console.error('[MapsService] ❌ Erro ao fazer reverso geocodificação:', error);
      return null;
    }
  }

  /**
   * Calcula distância entre dois pontos (Haversine)
   */
  calculateDistance(origin: GeoLocation, destination: GeoLocation): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRad(destination.latitude - origin.latitude);
    const dLon = this.toRad(destination.longitude - origin.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(origin.latitude)) *
        Math.cos(this.toRad(destination.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Arredonda para 2 casas decimais
  }

  /**
   * Calcula tempo de entrega estimado
   * Usa velocidade média de 30 km/h em zonas urbanas
   */
  calculateDeliveryTime(distanceKm: number): number {
    // Velocidade média: 30 km/h (zona urbana)
    // Tempo de preparo: 15 minutos
    const averageSpeed = 30;
    const deliveryTime = Math.ceil((distanceKm / averageSpeed) * 60); // Converte para minutos
    const prepTime = 15;

    return deliveryTime + prepTime;
  }

  /**
   * Calcula rota (versão simplificada sem cálculo real de rota)
   */
  async calculateRoute(origin: GeoLocation, destination: GeoLocation): Promise<RouteResult> {
    const distance = this.calculateDistance(origin, destination);
    const duration = this.calculateDeliveryTime(distance);

    console.log(
      `[MapsService] 📍 Rota: ${distance.toFixed(2)} km ~ ${duration} minutos`
    );

    return {
      distance,
      duration,
      routePoints: [origin, destination], // Simplificado: apenas origem e destino
    };
  }

  /**
   * Calcula melhor restaurante (mais próximo)
   */
  async findNearestRestaurants(
    customerLocation: GeoLocation,
    restaurants: Array<{
      id: string;
      name: string;
      address: string;
      location?: GeoLocation;
    }>
  ): Promise<
    Array<{
      id: string;
      name: string;
      address: string;
      distance: number;
      deliveryTime: number;
    }>
  > {
    const results = [];

    for (const restaurant of restaurants) {
      // Se a localização já está em cache/conhecida
      if (restaurant.location) {
        const distance = this.calculateDistance(customerLocation, restaurant.location);
        const deliveryTime = this.calculateDeliveryTime(distance);

        results.push({
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
          distance,
          deliveryTime,
        });
      } else {
        // Tenta geocodificar o endereço
        const geocoded = await this.geocodeAddress(restaurant.address);
        if (geocoded) {
          const distance = this.calculateDistance(customerLocation, {
            latitude: geocoded.latitude,
            longitude: geocoded.longitude,
          });
          const deliveryTime = this.calculateDeliveryTime(distance);

          results.push({
            id: restaurant.id,
            name: restaurant.name,
            address: restaurant.address,
            distance,
            deliveryTime,
          });
        }
      }
    }

    // Ordena por distância
    results.sort((a, b) => a.distance - b.distance);
    return results;
  }

  /**
   * Valida se um endereço é válido
   */
  async validateAddress(address: Address | string): Promise<boolean> {
    const result = await this.geocodeAddress(address);
    return result !== null;
  }

  /**
   * Obtém distância de entrega estimada para calculo de taxa
   */
  async calculateDeliveryFee(
    origin: GeoLocation | string,
    destination: GeoLocation | string,
    baseFee: number = 500 // 5 reais em centavos
  ): Promise<{ distance: number; fee: number }> {
    let originGeo: GeoLocation;
    let destGeo: GeoLocation;

    // Converte string para GeoLocation se necessário
    if (typeof origin === 'string') {
      const geo = await this.geocodeAddress(origin);
      if (!geo) throw new Error('Could not geocode origin address');
      originGeo = { latitude: geo.latitude, longitude: geo.longitude };
    } else {
      originGeo = origin;
    }

    if (typeof destination === 'string') {
      const geo = await this.geocodeAddress(destination);
      if (!geo) throw new Error('Could not geocode destination address');
      destGeo = { latitude: geo.latitude, longitude: geo.longitude };
    } else {
      destGeo = destination;
    }

    const distance = this.calculateDistance(originGeo, destGeo);
    // Taxa: R$5 + R$2 por km
    const fee = baseFee + Math.ceil(distance * 200);

    return { distance, fee };
  }

  /**
   * Helper: Converte graus para radianos
   */
  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Limpa cache
   */
  clearCache() {
    this.cache.clear();
    console.log('[MapsService] Cache limpo');
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats() {
    return {
      cachedAddresses: this.cache.size,
      addresses: Array.from(this.cache.keys()),
    };
  }

  /**
   * Testa a conexão
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[MapsService] Testando conexão com Nominatim...');
      const response = await fetch(`${this.NOMINATIM_URL}/about.php`, {
        headers: {
          'User-Agent': 'FoodFlow/1.0',
        },
      });

      if (response.ok) {
        console.log('[MapsService] ✅ Nominatim API disponível');
        return true;
      } else {
        console.warn('[MapsService] ⚠️ Nominatim API não respondeu bem');
        return false;
      }
    } catch (error) {
      console.error('[MapsService] ❌ Erro ao conectar em Nominatim:', error);
      console.log('[MapsService] ℹ️ Funcionará em modo offline com cálculos locais');
      return false;
    }
  }
}

const mapsService = new MapsService();
export default mapsService;
