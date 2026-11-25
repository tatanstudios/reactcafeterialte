// components/auth/PermissionRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PermissionRouteProps {
    children: React.ReactNode;
    permission?: string;
    permissions?: string[];
    requireAll?: boolean;
    /** Exige ese rol (ej. "admin"), además de los permisos si se dan */
    role?: string;
    fallback?: React.ReactNode;
}

export const PermissionRoute = ({
                                    children,
                                    permission,
                                    permissions = [],
                                    requireAll = false,
                                    role,
                                    fallback
                                }: PermissionRouteProps) => {
    const { hasPermission, hasRole, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (role && !hasRole(role)) {
        return fallback ? <>{fallback}</> : <Navigate to="/dashboard" replace />;
    }

    // Si se proporciona un solo permiso
    if (permission && !hasPermission(permission)) {
        return fallback ? <>{fallback}</> : <Navigate to="/dashboard" replace />;
    }

    // Si se proporcionan múltiples permisos
    if (permissions.length > 0) {
        const hasAccess = requireAll
            ? permissions.every(p => hasPermission(p))
            : permissions.some(p => hasPermission(p));

        if (!hasAccess) {
            return fallback ? <>{fallback}</> : <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
};