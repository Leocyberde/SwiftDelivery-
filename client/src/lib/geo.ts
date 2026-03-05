/**
 * Geocodes an address into [latitude, longitude] using Nominatim OpenStreetMap API.
 */
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
      headers: {
        'User-Agent': 'SwiftDelivery-App/1.0',
        'Accept-Language': 'pt-BR'
      }
    });
    const data = await res.json();
    if (data && Array.isArray(data) && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch (error) {
    console.error("Failed to geocode address:", error);
    return null;
  }
}

export async function autocompleteAddress(query: string): Promise<any[]> {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=5&countrycodes=br`, {
      headers: {
        'User-Agent': 'SwiftDelivery-App/1.0',
        'Accept-Language': 'pt-BR'
      }
    });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to autocomplete address:", error);
    return [];
  }
}

/**
 * Calculates the great-circle distance between two points on the Earth's surface using the Haversine formula.
 * @returns distance in kilometers
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Platform pricing logic:
 * Up to 5km = 12 BRL
 * Above 5km = 12 BRL + 2 BRL per additional km
 */
export function calculateDeliveryPrice(distanceKm: number): number {
  if (distanceKm <= 5) {
    return 12;
  }
  const additionalKm = Math.ceil(distanceKm - 5);
  return 12 + (additionalKm * 2);
}
