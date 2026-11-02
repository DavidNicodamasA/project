/**
 * Customer / User Module Routes
 * Path: src/modules/user/userRoutes.jsx
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerDashboard from './pages/CustomerDashboard';
import Search from './pages/Search';
import ProviderProfile from './pages/ProviderProfile';
import BookAppointment from './pages/BookAppointment';
import EmergencyRequest from './pages/EmergencyRequest';
import MyBookings from './pages/MyBookings';

export const UserRoutes = () => (
  <Routes>
    <Route path="dashboard" element={<CustomerDashboard />} />
    <Route path="home" element={<CustomerDashboard />} />
    <Route path="search" element={<Search />} />
    <Route path="provider/:providerId" element={<ProviderProfile />} />
    <Route path="provider/:id" element={<ProviderProfile />} />
    <Route path="book/:providerId" element={<BookAppointment />} />
    <Route path="emergency" element={<EmergencyRequest />} />
    <Route path="my-bookings" element={<MyBookings />} />
    <Route path="*" element={<Navigate to="dashboard" replace />} />
  </Routes>
);

export default UserRoutes;