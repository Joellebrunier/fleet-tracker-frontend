import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUnacknowledgedAlertsCount } from '@/hooks/useAlerts';
import { LogOut, User, Search } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import NotificationCenter from './NotificationCenter';
export default function Header() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const alertsCount = useUnacknowledgedAlertsCount();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const menuRef = useRef(null);
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    // Close menu on click outside
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    // Keyboard shortcut for search
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === 'Escape') {
                setSearchOpen(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);
    return (_jsxs("header", { className: "sticky top-0 z-40 border-b border-[#1F1F2E] bg-[#0A0A0F]/80 backdrop-blur-xl", children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-3", children: [_jsx("div", { className: "flex items-center flex-1", children: _jsxs("button", { onClick: () => setSearchOpen(true), className: "flex items-center gap-3 rounded-[var(--tz-radius)] bg-[#12121A] border border-[#1F1F2E] px-4 py-2 text-[#44445A] hover:border-[#2A2A3D] hover:text-[#6B6B80] transition-all duration-200 max-w-sm w-full group", children: [_jsx(Search, { size: 16, className: "shrink-0" }), _jsx("span", { className: "text-sm font-medium", children: "Rechercher..." }), _jsx("div", { className: "ml-auto flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity", children: _jsx("kbd", { className: "text-[10px] font-mono bg-[#1A1A25] border border-[#2A2A3D] rounded px-1.5 py-0.5", children: "\u2318K" }) })] }) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(NotificationCenter, {}), _jsxs("div", { className: "relative", ref: menuRef, children: [_jsxs("button", { onClick: () => setUserMenuOpen(!userMenuOpen), className: "flex items-center gap-3 rounded-[var(--tz-radius-sm)] px-3 py-1.5 hover:bg-[#1A1A25] transition-all duration-200 group", children: [_jsx("div", { className: "h-8 w-8 rounded-full bg-gradient-to-br from-[#00E5CC] to-[#00C4B0] text-[#0A0A0F] flex items-center justify-center text-xs font-bold font-syne shadow-[0_0_12px_rgba(0,229,204,0.2)] group-hover:shadow-[0_0_20px_rgba(0,229,204,0.3)] transition-shadow", children: user && getInitials(`${user.firstName} ${user.lastName}`) }), _jsxs("div", { className: "hidden text-left md:block", children: [_jsxs("p", { className: "text-sm font-semibold text-[#F0F0F5] font-syne leading-none", children: [user?.firstName, " ", user?.lastName] }), _jsx("p", { className: "text-[11px] text-[#44445A] font-mono mt-0.5", children: user?.role })] })] }), userMenuOpen && (_jsxs("div", { className: "absolute right-0 mt-2 w-52 rounded-[var(--tz-radius)] border border-[#1F1F2E] bg-[#12121A] shadow-[0_8px_48px_rgba(0,0,0,0.5)] animate-fade-in overflow-hidden", children: [_jsxs("button", { onClick: () => { navigate('/settings'); setUserMenuOpen(false); }, className: "flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#6B6B80] hover:bg-[#1A1A25] hover:text-[#F0F0F5] transition-colors", children: [_jsx(User, { size: 16 }), _jsx("span", { className: "font-medium", children: "Profil" })] }), _jsx("div", { className: "h-px bg-[#1F1F2E]" }), _jsxs("button", { onClick: handleLogout, className: "flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[#FF4D6A] hover:bg-[rgba(255,77,106,0.08)] transition-colors", children: [_jsx(LogOut, { size: 16 }), _jsx("span", { className: "font-medium", children: "D\u00E9connexion" })] })] }))] })] })] }), searchOpen && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-start justify-center pt-[15vh]", onClick: () => { setSearchOpen(false); setSearchQuery(''); }, children: [_jsx("div", { className: "absolute inset-0 bg-black/60 backdrop-blur-sm" }), _jsxs("div", { className: "relative w-full max-w-lg mx-4 rounded-[var(--tz-radius-lg)] border border-[#2A2A3D] bg-[#12121A] shadow-[0_8px_48px_rgba(0,0,0,0.5)] animate-fade-in", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center gap-3 px-5 py-4 border-b border-[#1F1F2E]", children: [_jsx(Search, { size: 18, className: "text-[#00E5CC] shrink-0" }), _jsx("input", { type: "text", placeholder: "Rechercher v\u00E9hicules, conducteurs, alertes...", className: "flex-1 bg-transparent text-[#F0F0F5] text-sm font-medium placeholder:text-[#44445A] focus:outline-none font-syne", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), autoFocus: true }), _jsx("kbd", { className: "text-[10px] font-mono text-[#44445A] bg-[#1A1A25] border border-[#2A2A3D] rounded px-1.5 py-0.5", children: "ESC" })] }), _jsx("div", { className: "p-4 text-center text-sm text-[#44445A]", children: "Tapez pour rechercher..." })] })] }))] }));
}
//# sourceMappingURL=Header.js.map