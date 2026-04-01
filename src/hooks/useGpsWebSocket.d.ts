interface GpsPositionUpdate {
    vehicleId: string;
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    timestamp: string;
    provider?: string;
}
interface UseGpsWebSocketOptions {
    enabled?: boolean;
    onPositionUpdate?: (update: GpsPositionUpdate) => void;
}
export declare function useGpsWebSocket(options?: UseGpsWebSocketOptions): {
    isConnected: boolean;
    lastUpdate: Date | null;
    disconnect: () => void;
};
export {};
//# sourceMappingURL=useGpsWebSocket.d.ts.map