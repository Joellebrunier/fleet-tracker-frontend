/**
 * Reverse geocoding utility using TomTom Reverse Geocoding API
 * Provides caching and request throttling
 */
interface ReverseGeocodeCoord {
    lat: number;
    lng: number;
}
/**
 * Format coordinates as "lat, lng" string
 */
export declare function formatCoordinates(lat: number, lng: number): string;
/**
 * Reverse geocode a single coordinate pair using TomTom API
 * Returns formatted address or "lat, lng" fallback on error
 */
export declare function reverseGeocode(lat: number, lng: number): Promise<string>;
/**
 * Batch reverse geocode multiple coordinates
 * Returns array of addresses in same order as input
 */
export declare function reverseGeocodeBatch(coords: Array<ReverseGeocodeCoord>): Promise<string[]>;
/**
 * Clear the geocoding cache
 */
export declare function clearGeocodeCache(): void;
/**
 * Get cache statistics
 */
export declare function getGeocachStats(): {
    size: number;
    entries: string[];
};
/**
 * Remove expired entries from cache to manage memory
 */
export declare function pruneGeocodeCache(): number;
export {};
//# sourceMappingURL=geocoding.d.ts.map