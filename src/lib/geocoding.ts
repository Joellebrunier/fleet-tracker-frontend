/**
 * Reverse geocoding utility using OpenStreetMap Nominatim API
 * Provides caching and request throttling to respect API limits
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours
const MIN_REQUEST_INTERVAL = 1000 // 1 second (Nominatim policy)

interface CacheEntry {
  address: string
  timestamp: number
}

interface ReverseGeocodeCoord {
  lat: number
  lng: number
}

// In-memory cache for reverse geocoding results
const geocodeCache = new Map<string, CacheEntry>()

// Throttling mechanism
let lastRequestTime = 0

/**
 * Format coordinates as a cache key
 */
function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`
}

/**
 * Wait for throttle delay if needed
 */
async function enforceThrottle(): Promise<void> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    )
  }

  lastRequestTime = Date.now()
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL
}

/**
 * Format coordinates as "lat, lng" string
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

/**
 * Reverse geocode a single coordinate pair
 * Returns formatted address or "lat, lng" fallback on error
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // Validate input
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return formatCoordinates(lat, lng)
  }

  // Clamp latitude and longitude to valid ranges
  const clampedLat = Math.max(-90, Math.min(90, lat))
  const clampedLng = Math.max(-180, Math.min(180, lng))

  const cacheKey = getCacheKey(clampedLat, clampedLng)

  // Check cache first
  const cached = geocodeCache.get(cacheKey)
  if (cached && isCacheValid(cached)) {
    return cached.address
  }

  try {
    // Enforce throttling to respect Nominatim API limits
    await enforceThrottle()

    const params = new URLSearchParams({
      lat: clampedLat.toString(),
      lon: clampedLng.toString(),
      format: 'json',
    })

    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        'Accept-Language': 'en',
      },
    })

    if (!response.ok) {
      return formatCoordinates(lat, lng)
    }

    const data = await response.json()

    // Extract address from Nominatim response
    const address =
      data.address?.name ||
      data.name ||
      data.display_name?.split(',')[0] ||
      formatCoordinates(lat, lng)

    // Cache the result
    geocodeCache.set(cacheKey, {
      address,
      timestamp: Date.now(),
    })

    return address
  } catch (error) {
    console.warn(`Reverse geocoding failed for ${formatCoordinates(lat, lng)}:`, error)
    return formatCoordinates(lat, lng)
  }
}

/**
 * Batch reverse geocode multiple coordinates
 * Returns array of addresses in same order as input
 */
export async function reverseGeocodeBatch(
  coords: Array<ReverseGeocodeCoord>
): Promise<string[]> {
  if (!Array.isArray(coords) || coords.length === 0) {
    return []
  }

  // Process coordinates sequentially to respect throttling
  const results: string[] = []

  for (const coord of coords) {
    const address = await reverseGeocode(coord.lat, coord.lng)
    results.push(address)
  }

  return results
}

/**
 * Clear the geocoding cache
 */
export function clearGeocodeCache(): void {
  geocodeCache.clear()
}

/**
 * Get cache statistics
 */
export function getGeocachStats(): { size: number; entries: string[] } {
  return {
    size: geocodeCache.size,
    entries: Array.from(geocodeCache.keys()),
  }
}

/**
 * Remove expired entries from cache to manage memory
 */
export function pruneGeocodeCache(): number {
  let removed = 0
  const now = Date.now()

  for (const [key, entry] of geocodeCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      geocodeCache.delete(key)
      removed++
    }
  }

  return removed
}
