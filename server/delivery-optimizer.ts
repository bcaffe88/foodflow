import { GoogleMapsService } from './google-maps-service';
import { storage } from './storage';

export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  distance: number; // meters to destination
  eta: number; // minutes
}

export interface OptimizedRoute {
  orderId: string;
  driverId: string;
  distance: number;
  duration: number;
  eta: string;
  route: Array<{
    lat: number;
    lng: number;
    type: 'restaurant' | 'waypoint' | 'customer';
  }>;
}

/**
 * Delivery Optimizer Service
 * Handles route optimization and driver assignment
 */
export class DeliveryOptimizer {
  constructor(private mapsService: GoogleMapsService | null) {
    console.log(`[DeliveryOptimizer] Service initialized`);
  }

  /**
   * Find nearest drivers to delivery location
   */
  async findNearestDrivers(
    latitude: number,
    longitude: number,
    tenantId: string,
    limit: number = 5
  ): Promise<DriverLocation[]> {
    try {
      console.log(`[DeliveryOptimizer] Finding drivers near: ${latitude}, ${longitude}`);

      // Get available drivers
      const availableDrivers = await storage.getAvailableDrivers();
      const tenantDrivers = availableDrivers.filter(d => {
        // Check if driver belongs to tenant (assuming they service this tenant)
        return d.currentLatitude && d.currentLongitude;
      });

      if (tenantDrivers.length === 0) {
        console.warn(`[DeliveryOptimizer] No available drivers found`);
        return [];
      }

      // Calculate distances
      const driversWithDistance = tenantDrivers.map(driver => {
        const distance = this.calculateDistance(
          parseFloat(driver.currentLatitude!.toString()),
          parseFloat(driver.currentLongitude!.toString()),
          latitude,
          longitude
        );

        const eta = Math.ceil(distance / 1000 / 40 * 60); // 40 km/h average

        return {
          driverId: driver.userId,
          latitude: parseFloat(driver.currentLatitude!.toString()),
          longitude: parseFloat(driver.currentLongitude!.toString()),
          distance,
          eta
        };
      });

      // Sort by distance and return limit
      const nearest = driversWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      console.log(`[DeliveryOptimizer] Found ${nearest.length} nearest drivers`);
      return nearest;
    } catch (error) {
      console.error(`[DeliveryOptimizer] Error finding drivers:`, error);
      return [];
    }
  }

  /**
   * Optimize delivery route for driver with multiple orders
   */
  async optimizeRoute(
    driverId: string,
    driverLat: number,
    driverLng: number,
    orders: Array<{
      orderId: string;
      restaurantLat: number;
      restaurantLng: number;
      customerLat: number;
      customerLng: number;
    }>
  ): Promise<OptimizedRoute[]> {
    try {
      if (orders.length === 0) {
        return [];
      }

      console.log(`[DeliveryOptimizer] Optimizing route for ${orders.length} orders`);

      const optimizedRoutes: OptimizedRoute[] = [];

      for (const order of orders) {
        // Get directions
        const directions = await this.mapsService?.getDirections(
          order.restaurantLat,
          order.restaurantLng,
          order.customerLat,
          order.customerLng
        );

        const distance = directions?.distance || 
          this.calculateDistance(
            order.restaurantLat,
            order.restaurantLng,
            order.customerLat,
            order.customerLng
          );

        const duration = directions?.duration || Math.ceil((distance / 1000 / 40) * 60);
        const eta = new Date(Date.now() + duration * 1000).toISOString();

        optimizedRoutes.push({
          orderId: order.orderId,
          driverId,
          distance,
          duration,
          eta,
          route: [
            {
              lat: order.restaurantLat,
              lng: order.restaurantLng,
              type: 'restaurant'
            },
            {
              lat: order.customerLat,
              lng: order.customerLng,
              type: 'customer'
            }
          ]
        });
      }

      console.log(`[DeliveryOptimizer] Optimized ${optimizedRoutes.length} routes`);
      return optimizedRoutes;
    } catch (error) {
      console.error(`[DeliveryOptimizer] Error optimizing route:`, error);
      return [];
    }
  }

  /**
   * Calculate ETA for multiple orders
   */
  async calculateMultipleETAs(
    orders: Array<{
      orderId: string;
      restaurantLat: number;
      restaurantLng: number;
      customerLat: number;
      customerLng: number;
      prepTimeMinutes: number;
    }>
  ): Promise<Map<string, { eta: string; minutes: number }>> {
    try {
      const etas = new Map<string, { eta: string; minutes: number }>();

      for (const order of orders) {
        const result = await this.mapsService?.estimateDeliveryTime(
          order.restaurantLat,
          order.restaurantLng,
          order.customerLat,
          order.customerLng,
          order.prepTimeMinutes
        );

        const minutes = result?.estimatedMinutes || order.prepTimeMinutes + 30;
        const eta = new Date(Date.now() + minutes * 60000).toISOString();

        etas.set(order.orderId, { eta, minutes });
      }

      return etas;
    } catch (error) {
      console.error(`[DeliveryOptimizer] Error calculating ETAs:`, error);
      return new Map();
    }
  }

  /**
   * Calculate delivery fee based on distance
   */
  getDeliveryFeeEstimate(distanceMeters: number, baseRate: number = 5.0): number {
    return this.mapsService?.calculateDeliveryFee(distanceMeters, baseRate) || 
      (baseRate + (distanceMeters / 1000) * 0.5);
  }

  /**
   * Private: Calculate distance (Haversine)
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }
}

/**
 * Initialize Delivery Optimizer
 */
export function initializeDeliveryOptimizer(mapsService: GoogleMapsService | null): DeliveryOptimizer {
  return new DeliveryOptimizer(mapsService);
}
