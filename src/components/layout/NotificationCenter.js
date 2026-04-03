import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Bell, AlertCircle, MapPin, Gauge, X } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
// Simple in-memory store for notifications (in real app, would use zustand)
const createNotificationStore = () => {
    const [notifications, setNotifications] = useState([
        {
            id: '1',
            type: 'alert',
            icon: _jsx(AlertCircle, { size: 16 }),
            title: 'Vehicle Speed Alert',
            message: 'Vehicle TR-001 exceeded speed limit on Highway 10',
            timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
            read: false,
            severity: 'high',
        },
        {
            id: '2',
            type: 'location',
            icon: _jsx(MapPin, { size: 16 }),
            title: 'Geofence Breach',
            message: 'Vehicle TR-045 left designated geofence zone',
            timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
            read: false,
            severity: 'critical',
        },
        {
            id: '3',
            type: 'status',
            icon: _jsx(Gauge, { size: 16 }),
            title: 'Low Fuel',
            message: 'Vehicle TR-032 fuel level below 25%',
            timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
            read: true,
        },
        {
            id: '4',
            type: 'system',
            icon: _jsx(Bell, { size: 16 }),
            title: 'Maintenance Due',
            message: 'Vehicle TR-089 maintenance schedule coming up',
            timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
            read: true,
        },
    ]);
    return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
        addNotification: (notification) => {
            const id = `n_${Date.now()}`;
            setNotifications((prev) => [{ ...notification, id, read: false }, ...prev]);
        },
        markAsRead: (id) => {
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        },
        markAllAsRead: () => {
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        },
        removeNotification: (id) => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        },
    };
};
export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const store = createNotificationStore();
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current &&
                !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const getNotificationColor = (type, severity) => {
        if (severity === 'critical')
            return 'text-[#FF4D6A]';
        if (severity === 'high')
            return 'text-[#FFB547]';
        if (type === 'alert')
            return 'text-[#FF4D6A]';
        if (type === 'location')
            return 'text-[#00E5CC]';
        if (type === 'status')
            return 'text-[#FFB547]';
        return 'text-[#6B6B80]';
    };
    const getNotificationBgColor = (type, severity) => {
        if (severity === 'critical')
            return 'bg-[rgba(255,77,106,0.15)]';
        if (severity === 'high')
            return 'bg-[rgba(255,181,71,0.15)]';
        if (type === 'alert')
            return 'bg-[rgba(255,77,106,0.15)]';
        if (type === 'location')
            return 'bg-[rgba(0,229,204,0.15)]';
        if (type === 'status')
            return 'bg-[rgba(255,181,71,0.15)]';
        return 'bg-[rgba(107,107,128,0.15)]';
    };
    return (_jsxs("div", { className: "relative", ref: dropdownRef, children: [_jsxs("button", { onClick: () => setIsOpen(!isOpen), className: "relative text-[#6B6B80] hover:text-[#F0F0F5] transition-colors", children: [_jsx(Bell, { size: 20 }), store.unreadCount > 0 && (_jsx("span", { className: "absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FF4D6A] text-xs font-bold text-white", children: store.unreadCount > 9 ? '9+' : store.unreadCount }))] }), isOpen && (_jsxs("div", { className: "absolute right-0 mt-2 w-96 max-h-96 rounded-lg border border-[#1F1F2E] bg-[#12121A] shadow-lg overflow-hidden flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b border-[#1F1F2E] bg-[#0A0A0F]", children: [_jsx("h3", { className: "font-semibold text-[#F0F0F5]", children: "Notifications" }), store.unreadCount > 0 && (_jsx("button", { onClick: () => store.markAllAsRead(), className: "text-xs text-[#00E5CC] hover:text-[#00D4B8] font-medium", children: "Mark all as read" }))] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: store.notifications.length > 0 ? (store.notifications.map((notification) => (_jsx("div", { className: `border-b border-[#1F1F2E] p-3 hover:bg-[#1A1A25] transition-colors cursor-pointer ${notification.read ? 'bg-[#12121A]' : 'bg-[rgba(0,229,204,0.08)]'}`, onClick: () => store.markAsRead(notification.id), children: _jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: `flex-shrink-0 rounded-full p-2 ${getNotificationBgColor(notification.type, notification.severity)}`, children: _jsx("div", { className: getNotificationColor(notification.type, notification.severity), children: notification.icon }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-[#F0F0F5]", children: notification.title }), _jsx("p", { className: "text-xs text-[#6B6B80] mt-0.5 line-clamp-2", children: notification.message })] }), !notification.read && (_jsx("div", { className: "flex-shrink-0 h-2 w-2 rounded-full bg-[#00E5CC] mt-1" }))] }), _jsx("p", { className: "text-xs text-[#44445A] mt-1", children: formatTimeAgo(notification.timestamp) })] }), _jsx("button", { onClick: (e) => {
                                            e.stopPropagation();
                                            store.removeNotification(notification.id);
                                        }, className: "flex-shrink-0 text-[#44445A] hover:text-[#6B6B80] p-1", children: _jsx(X, { size: 14 }) })] }) }, notification.id)))) : (_jsxs("div", { className: "flex flex-col items-center justify-center py-8 text-center", children: [_jsx(Bell, { size: 24, className: "text-[#44445A] mb-2" }), _jsx("p", { className: "text-sm text-[#6B6B80]", children: "No notifications" })] })) }), store.notifications.length > 0 && (_jsx("div", { className: "px-4 py-3 border-t border-[#1F1F2E] bg-[#0A0A0F]", children: _jsx("button", { className: "w-full text-center text-sm font-medium text-[#00E5CC] hover:text-[#00D4B8]", children: "View all notifications" }) }))] }))] }));
}
//# sourceMappingURL=NotificationCenter.js.map