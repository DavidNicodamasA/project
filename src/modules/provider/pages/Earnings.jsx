/**
 * Provider Earnings & Financial Analytics Page
 * Path: src/modules/provider/pages/Earnings.jsx
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar';
import { useAuth } from '../../../hooks/useAuth';
import dataStore from '../../../services/dataStore';
import {
  DollarSign,
  TrendingUp,
  Star,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Receipt,
  Wallet,
  Building,
} from 'lucide-react';

export default function Earnings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile] = useState(() => dataStore.getProviderProfile());

  const activeProviderId = user?.id || profile?.id || 'prov-active';
  const activeProviderName = user?.name || profile?.name || 'Service Provider';

  const [bookings, setBookings] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'PENDING'

  useEffect(() => {
    loadEarnings();
    const unsubscribe = dataStore.subscribe(() => {
      loadEarnings();
    });
    return unsubscribe;
  }, [activeProviderId, activeProviderName]);

  const loadEarnings = () => {
    setBookings(dataStore.getBookings());
  };

  const analytics = useMemo(() => {
    return dataStore.getProviderEarningsAnalytics(activeProviderId, activeProviderName);
  }, [bookings, activeProviderId, activeProviderName]);

  const weeklyBreakdown = [
    { day: 'Mon', amount: Math.round(analytics.totalEarnings * 0.15), percentage: 50 },
    { day: 'Tue', amount: Math.round(analytics.totalEarnings * 0.25), percentage: 80 },
    { day: 'Wed', amount: Math.round(analytics.totalEarnings * 0.10), percentage: 35 },
    { day: 'Thu', amount: Math.round(analytics.totalEarnings * 0.30), percentage: 100 },
    { day: 'Fri', amount: Math.round(analytics.totalEarnings * 0.20), percentage: 65 },
    { day: 'Sat', amount: Math.round(analytics.totalEarnings * 0.10), percentage: 35 },
    { day: 'Sun', amount: 0, percentage: 0 },
  ];

  const filteredJobs = useMemo(() => {
    return analytics.allJobs.filter((b) => {
      if (selectedFilter === 'COMPLETED') return b.status === 'COMPLETED' || b.status === 'ACCEPTED';
      if (selectedFilter === 'PENDING') return b.status === 'PENDING';
      return true;
    });
  }, [analytics, selectedFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header Title & Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              Financial Station
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1 font-display">Earnings & Payout Statement</h1>
            <p className="text-xs text-slate-500 font-medium">
              Track completed job payouts, pending customer revenue, and weekly balance statements
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/provider/dashboard')}
            className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition shadow-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-600" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Top Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Revenue</span>
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 font-display">
              ${analytics.totalEarnings}.00
            </p>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Lifetime completed revenue</span>
            </span>
          </div>

          <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Available Balance</span>
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 font-display">
              ${Math.round(analytics.totalEarnings * 0.85)}.00
            </p>
            <span className="text-[11px] font-bold text-blue-600">Ready for direct bank payout</span>
          </div>

          <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Pending Requests</span>
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 font-display">
              {analytics.pendingJobsCount} Jobs
            </p>
            <span className="text-[11px] font-bold text-amber-600">Awaiting technician accept</span>
          </div>

          <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Rating Score</span>
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-500">
                <Star className="h-5 w-5 fill-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 font-display">
              {analytics.avgRating} ★
            </p>
            <span className="text-[11px] font-bold text-slate-500">From {analytics.reviewsCount || 4} customer reviews</span>
          </div>

        </div>

        {/* Weekly Income Bar Visualizer */}
        <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 font-display">Weekly Earnings Breakdown</h2>
              <p className="text-xs text-slate-500 font-medium">Daily payout estimates for this week</p>
            </div>
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Current Week
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-4 items-end h-40">
            {weeklyBreakdown.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-bold text-slate-600">${item.amount}</span>
                <div className="w-full max-w-[36px] bg-emerald-50 rounded-t-xl h-full flex items-end overflow-hidden border border-emerald-100">
                  <div
                    style={{ height: `${item.percentage}%` }}
                    className="w-full bg-emerald-600 rounded-t-xl transition-all duration-500"
                  />
                </div>
                <span className="text-[11px] font-extrabold text-slate-600">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Reviews Section */}
        {analytics.reviews.length > 0 && (
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-black text-slate-900 font-display border-b border-slate-100 pb-3">
              Customer Rating Reviews Received
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">{rev.customerName}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{rev.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    {'★'.repeat(rev.rating)}
                    {'☆'.repeat(5 - rev.rating)}
                  </div>
                  <p className="text-slate-700 italic font-medium">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Job Transactions Table */}
        <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 font-display">Customer Job Transactions</h2>
              <p className="text-xs text-slate-500 font-medium">Detailed log of service appointments and earnings</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
              {['ALL', 'COMPLETED', 'PENDING'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedFilter(type)}
                  className={`px-3 py-1 text-xs font-extrabold rounded-xl transition ${
                    selectedFilter === type
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type === 'ALL' ? 'All Jobs' : type === 'COMPLETED' ? 'Accepted / Paid' : 'Pending'}
                </button>
              ))}
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No job transactions match the filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-extrabold">
                    <th className="p-3">Job ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Service Title</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJobs.map((b) => (
                    <tr key={b.id} className="hover:bg-emerald-50/30 transition">
                      <td className="p-3 font-mono font-bold text-blue-700">{b.id}</td>
                      <td className="p-3 font-extrabold text-slate-900">{b.customerName}</td>
                      <td className="p-3 text-slate-600 font-medium">{b.serviceTitle}</td>
                      <td className="p-3 text-slate-500 font-medium">{b.scheduledDate}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            b.status === 'COMPLETED' || b.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-slate-900 text-sm">
                        ${b.amount}.00
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}