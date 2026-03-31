import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { DATE_FORMATS, SPEED_UNITS, DISTANCE_UNITS } from './constants';
/**
 * Merge Tailwind CSS classes with proper override handling
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
/**
 * Format a date for display
 */
export function formatDate(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date instanceof Date ? date : new Date(date);
    return format(dateObj, DATE_FORMATS.DISPLAY_DATE);
}
/**
 * Format a datetime for display
 */
export function formatDateTime(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date instanceof Date ? date : new Date(date);
    return format(dateObj, DATE_FORMATS.DISPLAY_DATETIME);
}
/**
 * Format time for display
 */
export function formatTime(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date instanceof Date ? date : new Date(date);
    return format(dateObj, DATE_FORMATS.DISPLAY_TIME);
}
/**
 * Get relative time (e.g., "5 minutes ago")
 */
export function formatTimeAgo(date) {
    if (!date)
        return 'Never';
    const dateObj = typeof date === 'string' ? new Date(date) : date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime()))
        return 'Unknown';
    return formatDistanceToNow(dateObj, { addSuffix: true });
}
/**
 * Format speed with unit
 */
export function formatSpeed(speed, unit = SPEED_UNITS.KMH) {
    if (speed == null)
        return `0 ${unit}`;
    return `${speed.toFixed(1)} ${unit}`;
}
/**
 * Format distance with unit
 */
export function formatDistance(distance, unit = DISTANCE_UNITS.KM) {
    if (distance < 1000 && unit === DISTANCE_UNITS.KM) {
        return `${distance.toFixed(0)} m`;
    }
    const displayDistance = unit === DISTANCE_UNITS.KM ? distance / 1000 : distance / 1609.34;
    return `${displayDistance.toFixed(1)} ${unit}`;
}
/**
 * Format large numbers with commas
 */
export function formatNumber(num, decimals = 0) {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}
/**
 * Convert seconds to readable time format (HH:MM:SS)
 */
export function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hours, minutes, secs]
        .map((val) => String(val).padStart(2, '0'))
        .join(':');
}
/**
 * Calculate time difference in seconds
 */
export function getDurationInSeconds(from, to = new Date()) {
    const fromDate = typeof from === 'string' ? new Date(from) : from;
    const toDate = typeof to === 'string' ? new Date(to) : to;
    return differenceInSeconds(toDate, fromDate);
}
/**
 * Get bearing from two coordinates
 */
export function getBearing(from, to) {
    const dLon = (to.lng - from.lng) * (Math.PI / 180);
    const lat1 = from.lat * (Math.PI / 180);
    const lat2 = to.lat * (Math.PI / 180);
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * (180 / Math.PI);
    return (bearing + 360) % 360;
}
/**
 * Calculate distance between two coordinates using Haversine formula (in km)
 */
export function getDistance(from, to) {
    const R = 6371; // Earth's radius in km
    const dLat = (to.lat - from.lat) * (Math.PI / 180);
    const dLon = (to.lng - from.lng) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(from.lat * (Math.PI / 180)) *
            Math.cos(to.lat * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
/**
 * Get color for vehicle status
 */
export function getStatusColor(status) {
    const colors = {
        active: 'bg-green-500',
        idle: 'bg-yellow-500',
        offline: 'bg-gray-500',
        maintenance: 'bg-red-500',
        inactive: 'bg-gray-400',
    };
    return colors[status] || 'bg-gray-500';
}
/**
 * Get color for alert severity
 */
export function getSeverityColor(severity) {
    const colors = {
        critical: 'text-red-600 bg-red-50 border-red-200',
        high: 'text-orange-600 bg-orange-50 border-orange-200',
        medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        low: 'text-blue-600 bg-blue-50 border-blue-200',
        info: 'text-gray-600 bg-gray-50 border-gray-200',
    };
    return colors[severity] || 'text-gray-600 bg-gray-50 border-gray-200';
}
/**
 * Truncate text to specified length
 */
export function truncate(text, length) {
    return text.length > length ? text.substring(0, length) + '...' : text;
}
/**
 * Convert HEX color to RGB
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
}
/**
 * Get initials from name
 */
export function getInitials(name) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value) {
    if (value === null || value === undefined)
        return true;
    if (typeof value === 'string')
        return value.trim() === '';
    if (Array.isArray(value))
        return value.length === 0;
    if (typeof value === 'object')
        return Object.keys(value).length === 0;
    return false;
}
/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
/**
 * Throttle function
 */
export function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
/**
 * Check if position is inside circle
 */
export function isPointInCircle(point, center, radiusKm) {
    return getDistance(point, center) <= radiusKm;
}
/**
 * Check if position is inside polygon using ray casting algorithm
 */
export function isPointInPolygon(point, polygon) {
    let isInside = false;
    let j = polygon.length - 1;
    for (let i = 0; i < polygon.length; i++) {
        const xi = polygon[i].lng, yi = polygon[i].lat;
        const xj = polygon[j].lng, yj = polygon[j].lat;
        const isIntersect = yi > point.lat !== yj > point.lat && point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
        if (isIntersect) {
            isInside = !isInside;
        }
        j = i;
    }
    return isInside;
}
//# sourceMappingURL=utils.js.map