export interface RealtimeConfig {
    projectUrl: string;
    anonKey: string;
}
export interface RealtimeChannel {
    on: (event: string, handler: (data: any) => void) => RealtimeChannel;
    subscribe: () => Promise<void>;
    unsubscribe: () => Promise<void>;
}
/**
 * Initialize Supabase Realtime connection
 * This would connect to Supabase for real-time vehicle position updates
 */
export declare function initializeRealtime(config: RealtimeConfig): RealtimeClient;
declare class RealtimeClient {
    private config;
    private channels;
    private connected;
    constructor(config: RealtimeConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    subscribe(channelName: string): RealtimeChannel;
    isConnected(): boolean;
}
/**
 * WebSocket event emitter for vehicle position updates
 * Alternative to Supabase when direct WebSocket is used
 */
export declare class PositionEmitter {
    private ws;
    private url;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private listeners;
    constructor(url: string);
    connect(): Promise<void>;
    on(event: string, handler: (data: any) => void): void;
    off(event: string, handler: (data: any) => void): void;
    private emit;
    private attemptReconnect;
    disconnect(): void;
    isConnected(): boolean;
}
export {};
//# sourceMappingURL=supabase.d.ts.map