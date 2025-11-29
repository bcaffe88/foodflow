// OSRM (Open Source Routing Machine) - ETA Calculation Service
// Uses OpenStreetMap data - completely FREE, no API keys needed

import axios from 'axios';

const OSRM_URL = process.env.OSRM_URL || 'http://router.project-osrm.org';

export interface ETAResult {
  durationSeconds: number;
  durationMinutes: number;
  distanceKm: string;
}

export interface MatrixResult {
  durations: number[][];
}

/**
 * Calculate ETA between two coordinates using OSRM
 * @param originLat Latitude of origin (e.g., restaurant)
 * @param originLng Longitude of origin
 * @param destLat Latitude of destination (e.g., customer address)
 * @param destLng Longitude of destination
 * @returns Duration and distance
 */
export async function calculateETA(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<ETAResult> {
  try {
    // OSRM uses [lng, lat] format (opposite of typical lat, lng)
    const url = `${OSRM_URL}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}`;

    const response = await axios.get(url, {
      params: { overview: 'false', steps: 'false' },
      timeout: 5000
    });

    if (response.data.code !== 'Ok') {
      console.error('OSRM routing error:', response.data.message);
      throw new Error(`OSRM error: ${response.data.message}`);
    }

    const route = response.data.routes[0];

    return {
      durationSeconds: Math.round(route.duration),
      durationMinutes: Math.round(route.duration / 60),
      distanceKm: (route.distance / 1000).toFixed(2)
    };
  } catch (error) {
    console.error('ETA calculation error:', error);
    throw error;
  }
}

/**
 * Calculate delivery times from one origin to multiple destinations
 * Useful for batch operations or multi-stop deliveries
 * @param originLat Latitude of warehouse/restaurant
 * @param originLng Longitude of warehouse/restaurant
 * @param destinations Array of { lat, lng } coordinates
 * @returns Array of durations in seconds (index 0 is omitted, index 1+ are destinations)
 */
export async function calculateDeliveryMatrix(
  originLat: number,
  originLng: number,
  destinations: Array<{ lat: number; lng: number }>
): Promise<number[]> {
  try {
    if (destinations.length === 0) {
      throw new Error('No destinations provided');
    }

    // Build coordinates string: origin;dest1;dest2;...
    let coords = `${originLng},${originLat}`;
    destinations.forEach(dest => {
      coords += `;${dest.lng},${dest.lat}`;
    });

    const url = `${OSRM_URL}/table/v1/driving/${coords}`;

    const response = await axios.get(url, {
      params: {
        annotations: 'duration,distance',
        sources: 0 // Only from first point (origin)
      },
      timeout: 5000
    });

    if (response.data.code !== 'Ok') {
      throw new Error(`OSRM matrix error: ${response.data.message}`);
    }

    // Return durations from origin (index 0) to each destination
    // Skip first element (origin to origin = 0)
    return response.data.durations[0].slice(1);
  } catch (error) {
    console.error('Matrix calculation error:', error);
    throw error;
  }
}

/**
 * Health check for OSRM service
 */
export async function osrmHealthCheck(): Promise<boolean> {
  try {
    const response = await axios.get(`${OSRM_URL}/status`, {
      timeout: 3000
    });
    return response.status === 200;
  } catch (error) {
    console.error('OSRM health check failed:', error);
    return false;
  }
}
