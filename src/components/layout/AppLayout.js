import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import StatusBar from './StatusBar';
export default function AppLayout() {
    return (_jsxs("div", { className: "flex flex-col h-screen bg-gray-50", children: [_jsx(StatusBar, {}), _jsxs("div", { className: "flex flex-1 overflow-hidden", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "flex flex-1 flex-col overflow-hidden lg:ml-64", children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 overflow-auto", children: _jsx("div", { className: "container mx-auto p-4 sm:p-6 lg:p-8", children: _jsx(Outlet, {}) }) })] })] })] }));
}
//# sourceMappingURL=AppLayout.js.map