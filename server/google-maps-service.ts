import axios, { AxiosInstance } from 'axios';

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GeocodingResult {
  formatted_address: string;
  latitude: number;
  longitude: number;
  address_components: AddressComponent[];
  place_id: string;
}

export interface DirectionsResult {
  distance: number; // meters
  duration: number; // seconds
  polyline: string;
  steps: DirectionStep[];
}

export interface DirectionStep {
  distance: number;
  duration: number;
  instruction: string;
  latitude: number;
  longitude: number;
}

export interface DistanceMatrixResult {
  distance: number; // meters
  duration: number; // seconds
}

/**
 * Google Maps Service
 * Handles geocoding, directions, and distance calculations
 */
export class GoogleMapsService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn(`[GoogleMaps] No API key provided`);
    }
    this.apiKey = apiKey;
  }

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    try {
      if (!this.apiKey) {
        console.warn(`[GoogleMaps] Geocoding skipped: No API key`);
        return null;
      }

      console.log(`[GoogleMaps] Geocoding address: ${address}`);

      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK' || !response.data.results.length) {
        console.warn(`[GoogleMaps] Geocoding failed: ${response.data.status}`);
        return null;
      }

      const result = response.data.results[0];
      const geocoded: GeocodingResult = {
        formatted_address: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        address_components: result.address_components,
        place_id: result.place_id
      };

      console.log(`[GoogleMaps] Geocoded: ${geocoded.formatted_address}`);
      return geocoded;
    } catch (error) {
      console.error(`[GoogleMaps] Geocoding error:`, error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocodeCoordinates(
    latitude: number,
    longitude: number
  ): Promise<GeocodingResult | null> {
    try {
      if (!this.apiKey) {
        console.warn(`[GoogleMaps] Reverse geocoding skipped: No API key`);
        return null;
      }

      console.log(`[GoogleMaps] Reverse geocoding: ${latitude}, ${longitude}`);

      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK' || !response.data.results.length) {
        console.warn(`[GoogleMaps] Reverse geocoding failed: ${response.data.status}`);
        return null;
      }

      const result = response.data.results[0];
      const geocoded: GeocodingResult = {
        formatted_address: result.formatted_address,
        latitude,
        longitude,
        address_components: result.address_components,
        place_id: result.place_id
      };

      console.log(`[GoogleMaps] Reverse geocoded: ${geocoded.formatted_address}`);
      return geocoded;
    } catch (error) {
      console.error(`[GoogleMaps] Reverse geocoding error:`, error);
      return null;
    }
  }

  /**
   * Get directions between two points
   */
  async getDirections(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
  ): Promise<DirectionsResult | null> {
    try {
      if (!this.apiKey) {
        console.warn(`[GoogleMaps] Directions skipped: No API key`);
        // Fallback: calculate rough distance
        const distance = this.calculateDistance(startLat, startLng, endLat, endLng);
        const duration = Math.ceil((distance / 40) * 60); // Assume 40 km/h avg
        return {
          distance,
          duration,
          polyline: '',
          steps: []
        };
      }

      console.log(`[GoogleMaps] Getting directions (${mode})...`);

      const response = await axios.get(`${this.baseUrl}/directions/json`, {
        params: {
          origin: `${startLat},${startLng}`,
          destination: `${endLat},${endLng}`,
          mode,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK' || !response.data.routes.length) {
        console.warn(`[GoogleMaps] Directions failed: ${response.data.status}`);
        return null;
      }

      const route = response.data.routes[0].legs[0];
      const steps: DirectionStep[] = route.steps.map((step: any) => ({
        distance: step.distance.value,
        duration: step.duration.value,
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
        latitude: step.end_location.lat,
        longitude: step.end_location.lng
      }));

      const result: DirectionsResult = {
        distance: route.distance.value,
        duration: route.duration.value,
        polyline: response.data.routes[0].overview_polyline.points,
        steps
      };

      console.log(`[GoogleMaps] Directions: ${result.distance}m, ${result.duration}s`);
      return result;
    } catch (error) {
      console.error(`[GoogleMaps] Directions error:`, error);
      return null;
    }
  }

  /**
   * Get distance matrix between multiple points
   */
  async getDistanceMatrix(
    origins: Array<{ lat: number; lng: number }>,
    destinations: Array<{ lat: number; lng: number }>
  ): Promise<DistanceMatrixResult[][] | null> {
    try {
      if (!this.apiKey) {
        console.warn(`[GoogleMaps] Distance matrix skipped: No API key`);
        // Fallback: calculate distances
        return origins.map(origin =>
          destinations.map(dest => ({
            distance: this.calculateDistance(origin.lat, origin.lng, dest.lat, dest.lng),
            duration: Math.ceil((this.calculateDistance(origin.lat, origin.lng, dest.lat, dest.lng) / 40) * 60)
          }))
        );
      }

      console.log(`[GoogleMaps] Getting distance matrix...`);

      const originStrs = origins.map(o => `${o.lat},${o.lng}`).join('|');
      const destStrs = destinations.map(d => `${d.lat},${d.lng}`).join('|');

      const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
        params: {
          origins: originStrs,
          destinations: destStrs,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        console.warn(`[GoogleMaps] Distance matrix failed: ${response.data.status}`);
        return null;
      }

      const matrix: DistanceMatrixResult[][] = response.data.rows.map(
        (row: any) =>
          row.elements.map((element: any) => ({
            distance: element.distance?.value || 0,
            duration: element.duration?.value || 0
          }))
      );

      console.log(`[GoogleMaps] Distance matrix computed`);
      return matrix;
    } catch (error) {
      console.error(`[GoogleMaps] Distance matrix error:`, error);
      return null;
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance);
  }

  /**
   * Estimate delivery time
   */
  async estimateDeliveryTime(
    restaurantLat: number,
    restaurantLng: number,
    customerLat: number,
    customerLng: number,
    prepTimeMinutes: number = 15
  ): Promise<{ estimatedMinutes: number; distance: number }> {
    const distance = this.calculateDistance(
      restaurantLat,
      restaurantLng,
      customerLat,
      customerLng
    );

    // Get directions if API key available
    const directions = await this.getDirections(
      restaurantLat,
      restaurantLng,
      customerLat,
      customerLng,
      'driving'
    );

    const deliveryDurationMinutes = directions
      ? Math.ceil(directions.duration / 60)
      : Math.ceil((distance / 1000 / 30) * 60); // Fallback: assume 30 km/h

    const totalMinutes = prepTimeMinutes + deliveryDurationMinutes;

    console.log(
      `[GoogleMaps] ETA: ${totalMinutes}min (prep: ${prepTimeMinutes}min + delivery: ${deliveryDurationMinutes}min)`
    );

    return {
      estimatedMinutes: totalMinutes,
      distance
    };
  }

  /**
   * Calculate delivery fee based on distance
   */
  calculateDeliveryFee(distanceMeters: number, baseRate: number = 5.0): number {
    const kilometers = distanceMeters / 1000;
    const fee = baseRate + kilometers * 0.5; // R$ 5.00 + R$ 0.50 per km
    return Math.round(fee * 100) / 100; // Round to 2 decimals
  }
}

/**
 * Initialize Google Maps Service from environment
 */
export function initializeGoogleMapsService(): GoogleMapsService | null {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn(`[GoogleMaps] Service not fully initialized (no API key)`);
    console.warn(`[GoogleMaps] Will use fallback distance calculations`);
  }

  return new GoogleMapsService(apiKey || '');
}
