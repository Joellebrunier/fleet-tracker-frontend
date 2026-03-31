import { type ClassValue } from 'clsx';
/**
 * Merge Tailwind CSS classes with proper override handling
 */
export declare function cn(...inputs: ClassValue[]): string;
/**
 * Format a date for display
 */
export declare function formatDate(date: Date | string | number): string;
/**
 * Format a datetime for display
 */
export declare function formatDateTime(date: Date | string | number): string;
/**
 * Format time for display
 */
export declare function formatTime(date: Date | string | number): string;
/**
 * Get relative time (e.g., "5 minutes ago")
 */
export declare function formatTimeAgo(date: Date | string | number | null | undefined): string;
/**
 * Format speed with unit
 */
export declare function formatSpeed(speed: number | null | undefined, unit?: string): string;
/**
 * Format distance with unit
 */
export declare function formatDistance(distance: number, unit?: string): string;
/**
 * Format large numbers with commas
 */
export declare function formatNumber(num: number, decimals?: number): string;
/**
 * Convert seconds to readable time format (HH:MM:SS)
 */
export declare function formatDuration(seconds: number): string;
/**
 * Calculate time difference in seconds
 */
export declare function getDurationInSeconds(from: Date | string, to?: Date | string): number;
/**
 * Get bearing from two coordinates
 */
export declare function getBearing(from: {
    lat: number;
    lng: number;
}, to: {
    lat: number;
    lng: number;
}): number;
/**
 * Calculate distance between two coordinates using Haversine formula (in km)
 */
export declare function getDistance(from: {
    lat: number;
    lng: number;
}, to: {
    lat: number;
    lng: number;
}): number;
/**
 * Get color for vehicle status
 */
export declare function getStatusColor(status: string): string;
/**
 * Get color for alert severity
 */
export declare function getSeverityColor(severity: string): string;
/**
 * Truncate text to specified length
 */
export declare function truncate(text: string, length: number): string;
/**
 * Convert HEX color to RGB
 */
export declare function hexToRgb(hex: string): {
    r: number;
    g: number;
    b: number;
} | null;
/**
 * Get initials from name
 */
export declare function getInitials(name: string): string;
/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export declare function isEmpty(value: any): boolean;
/**
 * Debounce function
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Throttle function
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Check if position is inside circle
 */
export declare function isPointInCircle(point: {
    lat: number;
    lng: number;
}, center: {
    lat: number;
    lng: number;
}, radiusKm: number): boolean;
/**
 * Check if position is inside polygon using ray casting algorithm
 */
export declare function isPointInPolygon(point: {
    lat: number;
    lng: number;
}, polygon: Array<{
    lat: number;
    lng: number;
}>): boolean;
//# sourceMappingURL=utils.d.ts.map