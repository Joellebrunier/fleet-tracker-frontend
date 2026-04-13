/**
 * Reverse geocoding utility using TomTom Reverse Geocoding API
 * Provides caching and request throttling
 */
import { TOMTOM_API_KEY } from './constants';
const TOMTOM_REVERSE_URL = 'https://api.tomtom.com/search/2/reverseGeocode';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
const MIN_REQUEST_INTERVAL = 200; // 200ms (TomTom allows higher QPS than Nominatim)
// In-memory cache for reverse geocoding results
const geocodeCache = new Map();
// Throttling mechanism
let lastRequestTime = 0;
/**
 * Format coordinates as a cache key
 */
function getCacheKey(lat, lng) {
    return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}
/**
 * Wait for throttle delay if needed
 */
async function enforceThrottle() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();
}
/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry) {
    return Date.now() - entry.timestamp < CACHE_TTL;
}
/**
 * Format coordinates as "lat, lng" string
 */
export function formatCoordinates(lat, lng) {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
/**
 * Reverse geocode a single coordinate pair using TomTom API
 * Returns formatted address or "lat, lng" fallback on error
 */
export async function reverseGeocode(lat, lng) {
    // Validate input
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return formatCoordinates(lat, lng);
    }
    // Clamp latitude and longitude to valid ranges
    const clampedLat = Math.max(-90, Math.min(90, lat));
    const clampedLng = Math.max(-180, Math.min(180, lng));
    const cacheKey = getCacheKey(clampedLat, clampedLng);
    // Check cache first
    const cached = geocodeCache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
        return cached.address;
    }
    try {
        // Enforce throttling
        await enforceThrottle();
        const url = `${TOMTOM_REVERSE_URL}/${clampedLat},${clampedLng}.json?key=${TOMTOM_API_KEY}&language=fr-FR`;
        const response = await fetch(url);
        if (!response.ok) {
            return formatCoordinates(lat, lng);
        }
        const data = await response.json();
        // Extract address from TomTom response
        const addr = data.addresses?.[0]?.address;
        let address;
        if (addr) {
            // Build a readable address from TomTom fields
            const parts = [];
            if (addr.streetNumber && addr.streetName) {
                parts.push(`${addr.streetNumber} ${addr.streetName}`);
            }
            else if (addr.streetName) {
                parts.push(addr.streetName);
            }
            if (addr.municipality)
                parts.push(addr.municipality);
            address = parts.length > 0 ? parts.join(', ') : (addr.freeformAddress || formatCoordinates(lat, lng));
        }
        else {
            address = formatCoordinates(lat, lng);
        }
        // Cache the result
        geocodeCache.set(cacheKey, {
            address,
            timestamp: Date.now(),
        });
        return address;
    }
    catch (error) {
        console.warn(`Reverse geocoding failed for ${formatCoordinates(lat, lng)}:`, error);
        return formatCoordinates(lat, lng);
    }
}
/**
 * Batch reverse geocode multiple coordinates
 * Returns array of addresses in same order as input
 */
export async function reverseGeocodeBatch(coords) {
    if (!Array.isArray(coords) || coords.length === 0) {
        return [];
    }
    // Process coordinates sequentially to respect throttling
    const results = [];
    for (const coord of coords) {
        const address = await reverseGeocode(coord.lat, coord.lng);
        results.push(address);
    }
    return results;
}
/**
 * Clear the geocoding cache
 */
export function clearGeocodeCache() {
    geocodeCache.clear();
}
/**
 * Get cache statistics
 */
export function getGeocachStats() {
    return {
        size: geocodeCache.size,
        entries: Array.from(geocodeCache.keys()),
    };
}
/**
 * Remove expired entries from cache to manage memory
 */
export function pruneGeocodeCache() {
    let removed = 0;
    const now = Date.now();
    for (const [key, entry] of geocodeCache.entries()) {
        if (now - entry.timestamp > CACHE_TTL) {
            geocodeCache.delete(key);
            removed++;
        }
    }
    return removed;
}
//# sourceMappingURL=geocoding.js.map