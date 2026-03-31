import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
export default function ProtectedRoute({ children, requiredRoles, }) {
    const { isAuthenticated, user, isLoading } = useAuth();
    if (isLoading) {
        return (_jsx("div", { className: "flex h-screen items-center justify-center", children: _jsx("div", { className: "spinner" }) }));
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    // Check if user has required role
    if (requiredRoles && user) {
        if (!requiredRoles.includes(user.role)) {
            return _jsx(Navigate, { to: "/", replace: true });
        }
    }
    return _jsx(_Fragment, { children: children });
}
//# sourceMappingURL=ProtectedRoute.js.map