import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import TabNavigation from './TabNavigation';
export default function AppLayout() {
    const location = useLocation();
    // Map page gets full height with no padding
    const isMapPage = location.pathname === '/map';
    return (_jsxs("div", { className: "flex h-screen bg-[#F8F9FC] overflow-hidden flex-col", children: [_jsx(Header, {}), _jsx(TabNavigation, {}), _jsx("main", { className: "flex-1 overflow-auto", children: isMapPage ? (_jsx("div", { className: "h-full", children: _jsx(Outlet, {}) })) : (_jsx("div", { className: "mx-auto px-4 py-5 sm:px-6 lg:px-8 max-w-[1600px]", children: _jsx(Outlet, {}) })) })] }));
}
//# sourceMappingURL=AppLayout.js.map