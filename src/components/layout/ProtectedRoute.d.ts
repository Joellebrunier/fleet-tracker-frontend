import { ReactNode } from 'react';
import { UserRole } from '@/types/user';
interface ProtectedRouteProps {
    children: ReactNode;
    requiredRoles?: UserRole[];
}
export default function ProtectedRoute({ children, requiredRoles, }: ProtectedRouteProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ProtectedRoute.d.ts.map