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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-subtle transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">

        {/* Brand & Active Portal Identity */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to={isAdmin ? '/admin/dashboard' : isProvider ? '/provider/dashboard' : '/user/dashboard'}
            className="flex items-center gap-3 group"
          >
            <div
              className={`h-11 w-11 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md transition-transform duration-200 group-hover:scale-105 ${
                isAdmin
                  ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-indigo-500/25'
                  : isProvider
                  ? 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 shadow-emerald-500/25'
                  : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 shadow-blue-500/25'
              }`}
            >
              H
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight block leading-none font-display">
                Handy<span className={isProvider ? 'text-emerald-600' : 'text-blue-600'}>Pro</span>
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-slate-400 tracking-wider uppercase mt-1 block font-mono">
                {isAdmin ? 'Admin Intelligence' : isProvider ? 'Provider Station' : 'Customer Portal'}
              </span>
            </div>
          </Link>

          <div className="hidden lg:block h-7 w-px bg-slate-200" />

          {/* Strict Role Portal Badge */}
          <div className="hidden lg:flex items-center gap-2">
            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 text-indigo-900 bg-indigo-50/80 px-3 py-1 rounded-full text-xs font-extrabold border border-indigo-200/80 shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>Admin Intelligence Hub</span>
              </span>
            ) : isCustomer ? (
              <span className="inline-flex items-center gap-1.5 text-blue-800 bg-blue-50/80 px-3 py-1 rounded-full text-xs font-extrabold border border-blue-200/80 shadow-2xs">
                <User className="h-3.5 w-3.5 text-blue-600" />
                <span>Verified Customer Portal</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-900 bg-emerald-50/80 px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-200/80 shadow-2xs">
                <Briefcase className="h-3.5 w-3.5 text-emerald-600" />
                <span>Service Provider Station</span>
              </span>
            )}
          </div>
        </div>

        {/* Navigation Links (Role-Specific) */}
        <nav className="hidden md:flex items-center gap-1.5">
          {isAdmin ? (
            <>
              <Link
                to="/admin/dashboard"
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150 ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                Admin Command Center
              </Link>
              <Link
                to="/user/dashboard"
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all duration-150"
              >
                Customer View
              </Link>
            </>
          ) : isCustomer ? (
            <>
              <Link
                to="/user/dashboard"
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150 flex items-center gap-1.5 ${
                  location.pathname === '/user/dashboard' || location.pathname === '/user/home'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <span>Find Services & Techs</span>
              </Link>
              <Link
                to="/user/my-bookings"
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150 flex items-center gap-1.5 ${
                  location.pathname === '/user/my-bookings'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
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
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150 ${
                  location.pathname === '/provider/dashboard'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                Station Dashboard
              </Link>
              <Link
                to="/provider/requests"
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-150 flex items-center gap-2 ${
                  location.pathname === '/provider/requests'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <span>Job Requests</span>
                {pendingRequests.length > 0 && (
                  <span className="h-5 px-2 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center animate-pulse">
                    {pendingRequests.length}
                  </span>
                )}
              </Link>
            </>
          )}
        </nav>

        {/* Right Side Actions: Notification Bell + User Profile + Logout */}
        <div className="flex items-center gap-3">

          {/* Real-time Notification Bell for Provider */}
          {isProvider && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2.5 rounded-xl bg-slate-100/80 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors shadow-2xs border border-slate-200/60"
                title="Customer Appointment Notifications"
              >
                <Bell className="h-5 w-5" />
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center shadow-md animate-bounce">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-88 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 sm:p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-emerald-600" />
                      <h4 className="text-sm font-extrabold text-slate-900 font-display">
                        Appointment Requests ({pendingRequests.length})
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {pendingRequests.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">
                      No new customer appointment requests at this moment.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-0.5">
                      {pendingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-sm font-display">
                              {req.customerName}
                            </span>
                            <span className="font-black text-emerald-700 text-sm">
                              ${req.amount}.00
                            </span>
                          </div>
                          <p className="font-bold text-blue-700">{req.serviceTitle}</p>
                          <p className="text-slate-600 flex items-center gap-1.5 text-[11px] font-medium">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{req.customerAddress} ({req.customerLocation})</span>
                          </p>
                          <p className="text-slate-600 flex items-center gap-1.5 text-[11px] font-medium">
                            <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>
                              {req.scheduledDate} at {req.scheduledTime}
                            </span>
                          </p>

                          <button
                            type="button"
                            onClick={() => handleQuickAccept(req.id)}
                            className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-xs flex items-center justify-center gap-1.5 mt-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
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

          {/* User Profile Pill */}
          <div
            onClick={isCustomer && onOpenCustomerProfile ? onOpenCustomerProfile : undefined}
            className={`flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200/80 ${
              isCustomer && onOpenCustomerProfile ? 'cursor-pointer group' : ''
            }`}
            title={isCustomer && onOpenCustomerProfile ? 'Click to Edit Customer Profile' : undefined}
          >
            <div
              className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm transition-transform duration-150 ${
                isProvider
                  ? 'bg-emerald-600'
                  : 'bg-blue-600 group-hover:scale-105'
              }`}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 block leading-tight truncate max-w-[130px] font-display">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-500 font-bold block leading-none mt-0.5">
                {isProvider ? 'Technician' : 'Customer'}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold transition border border-transparent hover:border-red-100"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  );
}
