import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
const WS_BASE_URL = (import.meta.env.VITE_API_URL || 'https://balanced-endurance-production-6438.up.railway.app')
    .replace('https://', 'wss://')
    .replace('http://', 'ws://');
export function useGpsWebSocket(options = {}) {
    const { enabled = true, onPositionUpdate } = options;
    const token = useAuthStore((s) => s.token);
    const orgId = useAuthStore((s) => s.user?.organizationId) || '';
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(undefined);
    const reconnectAttemptsRef = useRef(0);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const callbackRef = useRef(onPositionUpdate);
    callbackRef.current = onPositionUpdate;
    const connect = useCallback(() => {
        if (!token || !orgId || !enabled)
            return;
        try {
            // Connect to Socket.IO compatible endpoint
            const url = `${WS_BASE_URL}/gps?token=${token}&orgId=${orgId}`;
            const ws = new WebSocket(url);
            ws.onopen = () => {
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;
                // Subscribe to org positions
                ws.send(JSON.stringify({ event: 'subscribe', data: { orgId } }));
            };
            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.event === 'position_update' && msg.data) {
                        const update = msg.data;
                        setLastUpdate(new Date());
                        callbackRef.current?.(update);
                    }
                }
                catch {
                    // Ignore parse errors from heartbeat or non-JSON messages
                }
            };
            ws.onclose = () => {
                setIsConnected(false);
                // Reconnect with exponential backoff
                if (enabled && reconnectAttemptsRef.current < 10) {
                    const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
                    reconnectAttemptsRef.current++;
                    reconnectTimeoutRef.current = setTimeout(connect, delay);
                }
            };
            ws.onerror = () => {
                ws.close();
            };
            wsRef.current = ws;
        }
        catch {
            // WebSocket construction failed — fallback to polling
            setIsConnected(false);
        }
    }, [token, orgId, enabled]);
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);
    useEffect(() => {
        if (enabled) {
            connect();
        }
        return () => {
            disconnect();
        };
    }, [connect, disconnect, enabled]);
    return { isConnected, lastUpdate, disconnect };
}
//# sourceMappingURL=useGpsWebSocket.js.map