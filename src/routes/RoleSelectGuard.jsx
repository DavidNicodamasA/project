/**
 * Role-Based Selection & Access Control Guard
 * Path: src/routes/RoleSelectGuard.jsx (or src/components/auth/RoleSelectGuard.jsx)
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROUTES } from '../config/routesConfig';

/**
 * RoleSelectGuard
 * 
 * @param {Array<string>} allowedRoles - Array of roles permitted to access child routes (e.g., ['customer', 'provider'])
 * @param {boolean} requireRoleSelection - Whether user MUST have selected a role to proceed
 */
export default function RoleSelectGuard({ allowedRoles = [], requireRoleSelection = true }) {
  const { tokens } = useTheme();
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. Loading State Screen
  if (isLoading) {
    return (
      <div className={`min-h-screen ${tokens.bgSecondary} flex flex-col items-center justify-center p-4`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className={`text-xs font-semibold ${tokens.textSecondary}`}>
            Verifying account permissions...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated -> Redirect to Login with return path
  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.AUTH.LOGIN} state={{ from: location }} replace />;
  }

  // 3. User logged in, but has not picked/assigned a role yet
  if (requireRoleSelection && (!user.role || user.role === 'pending')) {
    // Prevent infinite loop if already on the role selection route
    if (location.pathname !== ROUTES.AUTH.ROLE_SELECTION) {
      return <Navigate to={ROUTES.AUTH.ROLE_SELECTION} replace />;
    }
  }

  // 4. Role Authorization Check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Fallback navigation based on user's active role
    if (user.role === 'customer') {
      return <Navigate to={ROUTES.CUSTOMER.DASHBOARD} replace />;
    }
    if (user.role === 'provider') {
      return <Navigate to={ROUTES.PROVIDER.DASHBOARD} replace />;
    }
    if (user.role === 'admin') {
      return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    }

    // Default Unauthorized fallback
    return (
      <div className={`min-h-screen ${tokens.bgSecondary} flex items-center justify-center p-4`}>
        <div className={`max-w-md w-full rounded-2xl ${tokens.bgCard} p-8 border ${tokens.border} shadow-sm text-center space-y-4`}>
          <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 text-xl font-bold flex items-center justify-center mx-auto">
            🚫
          </div>
          <h2 className={`text-lg font-bold ${tokens.textPrimary}`}>Access Restricted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your account ({user.role}) does not have permission to access this portal section.
          </p>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Authorized -> Render Nested Route Content
  return <Outlet />;
}