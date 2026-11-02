/**
 * Service Provider Module Routes with Integrated Provider AI Copilot
 * Path: src/modules/provider/providerRoutes.jsx
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import ManageSchedule from './pages/ManageSchedule';
import IncomingRequests from './pages/IncomingRequests';
import Earnings from './pages/Earnings';
import ProviderAIChatBot from './components/ProviderAIChatBot';

export const ProviderRoutes = () => (
  <div className="relative">
    <Routes>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="profile-setup" element={<ProfileSetup />} />
      <Route path="schedule" element={<ManageSchedule />} />
      <Route path="requests" element={<IncomingRequests />} />
      <Route path="earnings" element={<Earnings />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>

    {/* Floating AI Copilot for Service Provider Portal */}
    <ProviderAIChatBot />
  </div>
);

export default ProviderRoutes;