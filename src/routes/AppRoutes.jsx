/**
 * Application Routes Configuration
 * Path: src/routes/AppRoutes.jsx
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthRoutes } from '../modules/auth/authRoutes';
import { UserRoutes } from '../modules/user/userRoutes';
import { ProviderRoutes } from '../modules/provider/providerRoutes';
import { AdminRoutes } from '../modules/admin/adminRoutes';
import { USER_ROLES } from '../config/constants';
import { useAuth } from '../hooks/useAuth';

export const AppRoutes = () => {
  const { loading } = useAuth();

  // Show loading indicator only if global loading is explicitly active and not on auth
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-xs font-semibold text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <span>Loading HandyPro...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root Path - Always open Login page by default */}
      <Route path="/" element={<Navigate to="/auth/login" replace />} />

      {/* Public Auth Routes */}
      <Route path="/auth/*" element={<AuthRoutes />} />

      {/* Customer Module - Protected */}
      <Route element={<ProtectedRoute allowedRole={USER_ROLES.CUSTOMER} />}>
        <Route path="/user/*" element={<UserRoutes />} />
      </Route>

      {/* Service Provider Module - Protected */}
      <Route element={<ProtectedRoute allowedRole={USER_ROLES.PROVIDER} />}>
        <Route path="/provider/*" element={<ProviderRoutes />} />
      </Route>

      {/* Admin Intelligence Module */}
      <Route element={<ProtectedRoute allowedRole={USER_ROLES.ADMIN} />}>
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Route>

      {/* Fallback Route - Redirect to Login */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
