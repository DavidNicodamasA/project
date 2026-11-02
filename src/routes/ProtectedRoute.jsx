/**
 * Protected Route Guard
 * Path: src/routes/ProtectedRoute.jsx
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { USER_ROLES } from '../config/constants';

export const ProtectedRoute = ({ allowedRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Allow 'customer' to match 'customer' or 'user', and allow 'admin' for admin portal
  const isMatch =
    !allowedRole ||
    user.role === allowedRole ||
    user.role === 'admin' ||
    (allowedRole === USER_ROLES.CUSTOMER && user.role === 'customer') ||
    (allowedRole === USER_ROLES.USER && user.role === 'customer');

  if (!isMatch) {
    let redirectPath = '/user/dashboard';
    if (user.role === USER_ROLES.PROVIDER) redirectPath = '/provider/dashboard';
    if (user.role === USER_ROLES.ADMIN) redirectPath = '/admin/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;