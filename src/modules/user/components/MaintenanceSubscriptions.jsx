/**
 * Home Maintenance Subscription Plans Component
 * Path: src/modules/user/components/MaintenanceSubscriptions.jsx
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  Calendar,
  Sparkles,
  Zap,
  ArrowRight,
  Clock,
  Wrench,
  AlertCircle,
  Gift,
} from 'lucide-react';
import axios from 'axios';

export default function MaintenanceSubscriptions({ customerId = 'cust-user', customerName = 'Customer', onBookingCreated }) {
  const [plans, setPlans] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribingPlanId, setSubscribingPlanId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookingCategory, setBookingCategory] = useState('hvac');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, mySubsRes] = await Promise.all([
        axios.get('/api/v1/subscriptions/plans'),
        axios.get(`/api/v1/subscriptions/my-subscriptions?customerId=${customerId}`),
      ]);

      if (plansRes.data?.success) {
        setPlans(plansRes.data.data);
      }
      if (mySubsRes.data?.success && mySubsRes.data.data.length > 0) {
        // Find first active subscription
        const active = mySubsRes.data.data.find((s) => s.status === 'active');
        setActiveSubscription(active || mySubsRes.data.data[0]);
      }
    } catch (err) {
      console.warn('Subscription fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [customerId]);

  const handleSubscribe = async (planId) => {
    setSubscribingPlanId(planId);
    try {
      const res = await axios.post('/api/v1/subscriptions/subscribe', {
        customerId,
        customerName,
        planId,
      });

      if (res.data?.success) {
        setToastMessage(res.data.message || 'Subscription successfully activated!');
        fetchData();
      }
    } catch (err) {
      setToastMessage(err.response?.data?.message || 'Failed to activate subscription.');
    } finally {
      setSubscribingPlanId(null);
    }
  };

  const handleRedeemVisit = async (e) => {
    e.preventDefault();
    if (!activeSubscription) return;
    setIsBookingLoading(true);

    try {
      const res = await axios.post('/api/v1/subscriptions/book-maintenance', {
        subscriptionId: activeSubscription.id,
        serviceCategory: bookingCategory,
        scheduledDate: bookingDate,
        notes: bookingNotes,
      });

      if (res.data?.success) {
        setToastMessage('Maintenance inspection booked successfully! $0 charged.');
        setIsBookModalOpen(false);
        fetchData();
        if (onBookingCreated) {
          onBookingCreated(res.data.data.booking);
        }
      }
    } catch (err) {
      setToastMessage(err.response?.data?.message || 'Failed to book maintenance visit.');
    } finally {
      setIsBookingLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs font-bold text-blue-900 flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="text-blue-500 hover:text-blue-800">
            Dismiss
          </button>
        </div>
      )}

      {/* Active Subscription Banner (if subscribed) */}
      {activeSubscription && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-blue-50 p-6 shadow-md relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white uppercase tracking-wider">
                  Active Member
                </span>
                <span className="text-sm font-bold text-slate-600">ID: {activeSubscription.id}</span>
              </div>
              <h3 className="mt-2 text-xl font-black text-slate-900">{activeSubscription.planName}</h3>
              <p className="text-xs text-slate-600 mt-1">
                Valid until:{' '}
                <span className="font-bold text-slate-800">
                  {new Date(activeSubscription.expiryDate).toLocaleDateString()}
                </span>
              </p>
            </div>

            {/* Quota Progress */}
            <div className="rounded-xl bg-white/90 border border-emerald-200 p-4 text-center min-w-[200px] shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remaining Free Visits</span>
              <div className="text-3xl font-black text-emerald-700 mt-1">
                {activeSubscription.remainingVisits} / {activeSubscription.totalVisits}
              </div>
              <button
                type="button"
                onClick={() => setIsBookModalOpen(true)}
                disabled={activeSubscription.remainingVisits <= 0}
                className="mt-2.5 w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 transition shadow-sm disabled:opacity-50"
              >
                Book Routine Visit ($0)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Tier Selection Cards */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-6">
          <h3 className="text-xl font-black text-slate-900">HandyPro Home Protection Plans</h3>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Lock in routine appliance checkups, plumbing leak audits, AC coil deep cleaning, and priority emergency dispatch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = activeSubscription?.planId === plan.id;
            const isPopular = plan.tier === 'standard';

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 transition flex flex-col justify-between ${
                  isPopular
                    ? 'border-2 border-blue-600 bg-white shadow-xl shadow-blue-500/10 scale-105 z-10'
                    : 'border border-slate-200 bg-white hover:border-slate-300 shadow-md'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 text-[11px] font-black text-white uppercase tracking-wider shadow-md">
                    Most Popular Choice
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {plan.billingCycle} Plan
                    </span>
                    {plan.discountPercent > 0 && (
                      <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black">
                        Save {plan.discountPercent}%
                      </span>
                    )}
                  </div>

                  <h4 className="mt-2 text-lg font-black text-slate-900">{plan.name}</h4>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">${plan.price}</span>
                    <span className="text-xs font-bold text-slate-500">/{plan.billingCycle}</span>
                  </div>

                  <div className="mt-3 rounded-xl bg-blue-50/70 p-3 text-xs font-bold text-blue-900">
                    Includes {plan.includedVisits} Service Visits per cycle
                  </div>

                  {/* Feature Checklist */}
                  <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                    {plan.features?.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrent || subscribingPlanId === plan.id}
                    className={`w-full py-3 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 ${
                      isCurrent
                        ? 'bg-emerald-100 text-emerald-800 cursor-default'
                        : isPopular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Current Active Plan</span>
                      </>
                    ) : subscribingPlanId === plan.id ? (
                      <span>Activating...</span>
                    ) : (
                      <>
                        <span>Choose {plan.name}</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Routine Visit Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h4 className="text-base font-black text-slate-900">Book Routine Maintenance Visit</h4>
            <p className="text-xs text-slate-500 mt-1">
              Select service trade and preferred date. $0 will be charged against your remaining visit quota.
            </p>

            <form onSubmit={handleRedeemVisit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Trade</label>
                <select
                  value={bookingCategory}
                  onChange={(e) => setBookingCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="plumbing">Plumbing (Leak audit & pipe inspection)</option>
                  <option value="electrical">Electrical (Circuit test & breaker check)</option>
                  <option value="hvac">AC & HVAC (Coil wash & filter cleansing)</option>
                  <option value="cleaning">Deep Cleaning Routine</option>
                  <option value="appliance">Appliance Health Checkup</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="e.g. Please check master bedroom AC cooling pressure"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBookingLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black"
                >
                  {isBookingLoading ? 'Booking...' : 'Confirm Maintenance Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

