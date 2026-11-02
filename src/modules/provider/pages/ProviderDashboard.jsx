/**
 * Provider Dashboard View
 * Path: src/modules/provider/pages/ProviderDashboard.jsx
 */

import React, { useState } from 'react';
import { Calendar, Clock, DollarSign, Star, Briefcase, Settings } from 'lucide-react';

export default function ProviderDashboard() {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Provider Top Header */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Provider Station</span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Welcome back, Service Provider</h1>
            <p className="text-xs text-slate-500">Manage daily jobs, set rates, and review incoming requests.</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">
              Status: <span className={isOnline ? 'text-emerald-600' : 'text-slate-400'}>{isOnline ? 'Online & Available' : 'Offline'}</span>
            </span>
            <input
              type="checkbox"
              checked={isOnline}
              onChange={() => setIsOnline(!isOnline)}
              className="h-4 w-4 accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Today's Jobs</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">4</p>
              <span className="text-[10px] text-emerald-600 font-bold">Active tasks</span>
            </div>
            <Calendar className="h-8 w-8 text-blue-500 bg-blue-50 p-1.5 rounded-xl" />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Pending Requests</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">2</p>
              <span className="text-[10px] text-amber-600 font-bold">Requires action</span>
            </div>
            <Clock className="h-8 w-8 text-amber-500 bg-amber-50 p-1.5 rounded-xl" />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Total Earnings</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">$380</p>
              <span className="text-[10px] text-emerald-600 font-bold">+12% this week</span>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-500 bg-emerald-50 p-1.5 rounded-xl" />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Rating Score</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">4.8</p>
              <span className="text-[10px] text-slate-400">From 24 reviews</span>
            </div>
            <Star className="h-8 w-8 text-amber-400 bg-amber-50 p-1.5 rounded-xl" />
          </div>
        </div>

        {/* Recent Job Bookings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Booking Requests</h2>
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold text-slate-900">Kalidhass S</span>
                <p className="text-xs text-slate-600 mt-0.5">AC Pipe Repair & Leakage Check</p>
                <p className="text-[11px] text-slate-400 mt-1">🕒 10:30 AM Today • $85</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition">
                  Accept Job
                </button>
                <button className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition">
                  Decline
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-extrabold text-slate-900">Vishal AS</span>
                <p className="text-xs text-slate-600 mt-0.5">Main Circuit Breaker Inspection</p>
                <p className="text-[11px] text-slate-400 mt-1">🕒 2:00 PM Tomorrow • $70</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition">
                  Accept Job
                </button>
                <button className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition">
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}