import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import StatusBar from './StatusBar';
export default function AppLayout() {
    return (_jsxs("div", { className: "flex h-screen bg-[#0A0A0F] overflow-hidden", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "flex flex-1 flex-col overflow-hidden lg:ml-[260px] transition-all duration-300", children: [_jsx(StatusBar, {}), _jsx(Header, {}), _jsx("main", { className: "flex-1 overflow-auto", children: _jsx("div", { className: "mx-auto p-4 sm:p-5 lg:p-6 max-w-[1600px]", children: _jsx(Outlet, {}) }) })] })] }));
}
//# sourceMappingURL=AppLayout.js.map