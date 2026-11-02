/**
 * AI Route Optimization Component for Technicians
 * Path: src/modules/provider/components/ProviderRouteOptimizer.jsx
 */

import React, { useState, useEffect } from 'react';
import {
  Navigation,
  MapPin,
  Clock,
  ArrowRight,
  TrendingDown,
  Sparkles,
  CheckCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import axios from 'axios';

export default function ProviderRouteOptimizer({ appointments = [], providerBaseLocation = { lat: 13.0827, lng: 80.2707, label: 'Base Workshop' } }) {
  const [routePlan, setRoutePlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLegIndex, setSelectedLegIndex] = useState(0);

  const calculateOptimizedRoute = async () => {
    if (!appointments || appointments.length === 0) return;
    setIsLoading(true);

    try {
      const response = await axios.post('/api/v1/ai/optimize-route', {
        startLocation: providerBaseLocation,
        appointments: appointments.map((a, i) => ({
          bookingId: a.id,
          customerName: a.customerName,
          address: a.address,
          serviceTitle: a.serviceTitle,
          scheduledTime: a.scheduledTime,
          latitude: a.latitude || (13.0827 + (i + 1) * 0.012),
          longitude: a.longitude || (80.2707 + (i + 1) * 0.009),
        })),
      });

      if (response.data?.success) {
        setRoutePlan(response.data.data);
      }
    } catch (error) {
      console.warn('[Route Optimizer Error]:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (appointments && appointments.length > 0) {
      calculateOptimizedRoute();
    }
  }, [appointments.length]);

  if (!appointments || appointments.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <Navigation className="mx-auto h-10 w-10 text-slate-300 mb-2" />
        <h4 className="text-sm font-bold text-slate-800">No Accepted Jobs Today</h4>
        <p className="text-xs text-slate-500 mt-1">
          When you accept customer bookings, AI will automatically sequence your travel route to minimize traffic and transit time.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/20 to-slate-50 p-6 shadow-md space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Navigation className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>AI Multi-Stop Route Sequencing</span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-700 uppercase">
                Active Itinerary
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Nearest-neighbor dispatch optimization for {appointments.length} assigned customer stops.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={calculateOptimizedRoute}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Recalculate Route</span>
        </button>
      </div>

      {/* Route Metric Cards */}
      {routePlan && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
              Optimized Total Distance
            </span>
            <div className="mt-1 text-2xl font-black text-blue-900">{routePlan.totalDistanceKm} km</div>
            <span className="text-[11px] text-blue-700 font-medium">Across all service stops</span>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">
              Estimated Total Transit Time
            </span>
            <div className="mt-1 text-2xl font-black text-indigo-900">{routePlan.totalDurationMinutes} mins</div>
            <span className="text-[11px] text-indigo-700 font-medium">Urban road speed & buffer</span>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
              <span>Efficiency Advantage</span>
            </span>
            <div className="mt-1 text-2xl font-black text-emerald-900">~{routePlan.estimatedSavingsPercent}%</div>
            <span className="text-[11px] text-emerald-700 font-medium">Transit time & fuel conserved</span>
          </div>
        </div>
      )}

      {/* Sequenced Stops List */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
          Suggested Stop Sequence:
        </h4>

        <div className="space-y-2.5">
          {routePlan?.orderedAppointments?.map((stop, index) => (
            <div
              key={index}
              className={`rounded-xl border p-4 transition flex flex-wrap items-center justify-between gap-3 ${
                selectedLegIndex === index
                  ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
              onClick={() => setSelectedLegIndex(index)}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-black text-xs">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">{stop.customerName}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      ETA: {stop.projectedETA}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">{stop.serviceTitle}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>{stop.address || 'Customer Service Location'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-black text-slate-900">{stop.legDistanceKm} km</div>
                  <div className="text-[10px] text-slate-500">~{stop.legDurationMinutes} min drive</div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    stop.address || `${stop.lat},${stop.lng}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg p-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition"
                  title="Open GPS Navigation"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

