/**
 * Top Navigation Bar for HandyPro
 * Path: src/components/layout/Navbar.jsx
 * 
 * Strict Role Isolation & Enlarged Navbar:
 * - Increased height and font sizes across all elements for high visual impact and clarity.
 * - Customers ONLY see customer views. No provider links or switch button.
 * - Providers ONLY see provider views, plus real-time customer appointment notifications.
 * - Bold modern typography ('Outfit' & 'Plus Jakarta Sans').
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../config/constants';
import dataStore from '../../services/dataStore';
import {
  User,
  Briefcase,
  LogOut,
  Bell,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function Navbar({ onOpenCustomerProfile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);

  useEffect(() => {
    if (user?.role === USER_ROLES.PROVIDER) {
      loadPendingRequests();
      const unsubscribe = dataStore.subscribe(() => {
        loadPendingRequests();
      });
      return unsubscribe;
    }
  }, [user]);

  const loadPendingRequests = () => {
    const prof = dataStore.getProviderProfile();
    const pId = prof?.id || user?.id;
    const pName = prof?.name || user?.name;

    const all = dataStore.getBookings();
    const pending = all.filter(
      (b) => b.status === 'PENDING' && dataStore.isBookingForProvider(b, pId, pName)
    );
    setPendingRequests(pending);
  };

  if (!user) return null;

  const isCustomer = user.role === USER_ROLES.CUSTOMER;
  const isProvider = user.role === USER_ROLES.PROVIDER;
  const isAdmin = user.role === USER_ROLES.ADMIN || user.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const handleQuickAccept = (bookingId) => {
    dataStore.updateBookingStatus(bookingId, 'ACCEPTED');
    setNotificationsOpen(false);
    navigate('/provider/dashboard');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-22 sm:h-24 flex items-center justify-between gap-4">

        {/* Brand & Active Portal Identity (Enlarged) */}
        <div className="flex items-center gap-5">
          <Link
            to={isAdmin ? '/admin/dashboard' : isProvider ? '/provider/dashboard' : '/user/dashboard'}
            className="flex items-center gap-3.5 group"
          >
            <div className={`h-12 w-12 sm:h-13 sm:w-13 rounded-2xl ${isAdmin ? 'bg-gradient-to-tr from-indigo-600 to-purple-600' : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700'} text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform`}>
              H
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block leading-none font-display">
                Handy<span className="text-blue-600">Pro</span>
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-400 tracking-wider uppercase mt-1 block">
                {isAdmin ? 'Admin Intelligence' : isProvider ? 'Technician Portal' : 'Home Services Portal'}
              </span>
            </div>
          </Link>

          <div className="hidden lg:block h-8 w-px bg-slate-200" />

          {/* Strict Role Portal Badge (Enlarged) */}
          <div className="hidden lg:flex items-center gap-2">
            {isAdmin ? (
              <span className="inline-flex items-center gap-2 text-indigo-900 bg-indigo-50 px-4 py-1.5 rounded-full text-sm font-extrabold border border-indigo-300 shadow-2xs">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Admin Intelligence Hub
              </span>
            ) : isCustomer ? (
              <span className="inline-flex items-center gap-2 text-blue-800 bg-blue-50 px-4 py-1.5 rounded-full text-sm font-extrabold border border-blue-200 shadow-2xs">
                <User className="h-4 w-4 text-blue-600" />
                Customer Portal
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-emerald-900 bg-emerald-50 px-4 py-1.5 rounded-full text-sm font-extrabold border border-emerald-300 shadow-2xs">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                Service Provider Station
              </span>
            )}
          </div>
        </div>

        {/* Navigation Links (Strictly Role-Specific with Larger Font & Sizing) */}
        <nav className="hidden md:flex items-center gap-2">
          {isAdmin ? (
            <>
              <Link
                to="/admin/dashboard"
                className={`px-5 py-2.5 rounded-2xl text-base font-extrabold transition-all ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Admin Command Center
              </Link>
              <Link
                to="/user/dashboard"
                className="px-5 py-2.5 rounded-2xl text-base font-extrabold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
              >
                Customer View
              </Link>
            </>
          ) : isCustomer ? (
            <>
              <Link
                to="/user/dashboard"
                className={`px-5 py-2.5 rounded-2xl text-base font-extrabold transition-all ${
                  location.pathname === '/user/dashboard' || location.pathname === '/user/home'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Find Services & Providers
              </Link>
              <Link
                to="/user/my-bookings"
                className={`px-5 py-2.5 rounded-2xl text-base font-extrabold transition-all flex items-center gap-2 ${
                  location.pathname === '/user/my-bookings'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>My Bookings</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/provider/dashboard"
                className={`px-5 py-2.5 rounded-2xl text-base font-extrabold transition-all ${
                  location.pathname === '/provider/dashboard'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Provider Dashboard
              </Link>
              <Link
                to="/provider/requests"
                className={`px-5 py-2.5 rounded-2xl text-base font-extrabold transition-all flex items-center gap-2 ${
                  location.pathname === '/provider/requests'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Customer Requests</span>
                {pendingRequests.length > 0 && (
                  <span className="h-5 px-2 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </Link>
            </>
          )}
        </nav>

        {/* Right Side Actions: Notification Bell + User Profile + Logout (Enlarged) */}
        <div className="flex items-center gap-3.5">

          {/* Real-time Notification Bell for Provider (Enlarged) */}
          {isProvider && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-3 sm:p-3.5 rounded-2xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition shadow-xs"
                title="Customer Appointment Notifications"
              >
                <Bell className="h-6 w-6" />
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center shadow-md animate-pulse">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel (Enlarged) */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-88 sm:w-96 rounded-3xl bg-white border border-slate-200 shadow-2xl p-5 z-50 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <Bell className="h-5 w-5 text-emerald-600" />
                      <h4 className="text-base font-black text-slate-900 font-display">
                        Appointment Requests ({pendingRequests.length})
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {pendingRequests.length === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-400">
                      No new customer appointment requests at this moment.
                    </div>
                  ) : (
                    <div className="mt-3.5 space-y-3.5 max-h-80 overflow-y-auto">
                      {pendingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition space-y-2.5 text-xs sm:text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-base font-display">
                              {req.customerName}
                            </span>
                            <span className="font-black text-emerald-700 text-base">
                              ${req.amount}.00
                            </span>
                          </div>
                          <p className="font-bold text-blue-700">{req.serviceTitle}</p>
                          <p className="text-slate-600 flex items-center gap-1.5 text-xs font-medium">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{req.customerAddress} ({req.customerLocation})</span>
                          </p>
                          <p className="text-slate-600 flex items-center gap-1.5 text-xs font-medium">
                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>
                              {req.scheduledDate} at {req.scheduledTime}
                            </span>
                          </p>

                          <button
                            type="button"
                            onClick={() => handleQuickAccept(req.id)}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2 mt-1"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Accept Customer Job</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User Profile Pill (Enlarged) */}
          <div
            onClick={isCustomer && onOpenCustomerProfile ? onOpenCustomerProfile : undefined}
            className={`flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200 ${
              isCustomer && onOpenCustomerProfile ? 'cursor-pointer group' : ''
            }`}
            title={isCustomer && onOpenCustomerProfile ? 'Click to Edit Customer Profile' : undefined}
          >
            <div
              className={`h-11 w-11 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md ${
                isProvider ? 'bg-emerald-600' : 'bg-blue-600 group-hover:scale-105 transition-transform'
              }`}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-sm sm:text-base font-black text-slate-900 block leading-tight truncate max-w-[150px] font-display">
                {user.name}
              </span>
              <span className="text-xs text-slate-500 font-bold block leading-none mt-1">
                {isProvider ? 'Service Provider' : 'Customer Profile'}
              </span>
            </div>
          </div>

          {/* Logout Button (Enlarged) */}
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl text-slate-600 hover:text-red-600 hover:bg-red-50 text-sm font-extrabold transition border border-transparent hover:border-red-100"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  );
}
