/**
 * Customer Home Page / Landing Hub
 * Path: src/modules/customer/pages/Home.jsx
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../context/ThemeContext';
import { SERVICE_CATEGORIES } from '../../../config/constants';
import { ROUTES } from '../../../config/routesConfig';
import api from '../../../services/api';

export default function Home() {
  const { user } = useAuth();
  const { tokens } = useTheme();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProviders, setFeaturedProviders] = useState([
    {
      id: 'prov-201',
      name: 'David Nicodamas A',
      category: 'Plumbing & Pipe Repair',
      rating: 4.9,
      reviewsCount: 42,
      hourlyRate: 45,
      availability: 'Available Today',
    },
    {
      id: 'prov-202',
      name: 'Vishal AS',
      category: 'Electrical & AC Repair',
      rating: 4.8,
      reviewsCount: 29,
      hourlyRate: 50,
      availability: 'Available Now',
    },
    {
      id: 'prov-203',
      name: 'Kalidhass S',
      category: 'Carpentry & Furniture',
      rating: 4.7,
      reviewsCount: 19,
      hourlyRate: 40,
      availability: 'Next Day',
    },
  ]);

  const [activeBooking, setActiveBooking] = useState(null);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/customer/home-summary');
      if (response.data?.featuredProviders) {
        setFeaturedProviders(response.data.featuredProviders);
      }
      if (response.data?.activeBooking) {
        setActiveBooking(response.data.activeBooking);
      }
    } catch (err) {
      // Fallback retains clean default preview data
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`${ROUTES.CUSTOMER.SERVICES}?category=${categoryId}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.CUSTOMER.SERVICES}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className={`min-h-screen ${tokens.bgSecondary} p-4 md:p-8 transition-colors duration-200`}>
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Welcome Banner & Search Header */}
        <div className={`rounded-3xl ${tokens.bgCard} p-6 md:p-8 border ${tokens.border} shadow-sm bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white space-y-6`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-semibold tracking-wider uppercase backdrop-blur-sm">
                Instant On-Demand Services
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold mt-2">
                Hello, {user?.name || 'Customer'} 👋
              </h1>
              <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-md">
                Find trusted, verified technicians for plumbing, electrical, HVAC, and home maintenance.
              </p>
            </div>

            {/* Quick Emergency SOS CTA */}
            <button
              type="button"
              onClick={() => navigate(ROUTES.CUSTOMER.EMERGENCY)}
              className="px-5 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-black shadow-lg shadow-red-900/30 transition active:scale-95 flex items-center justify-center gap-2 self-start md:self-center"
            >
              <span className="animate-ping h-2 w-2 rounded-full bg-white"></span>
              <span>🚨 Need Urgent SOS Repair?</span>
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Search for services (e.g. Leak repair, AC maintenance, Wiring)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl bg-white p-4 pr-28 text-xs md:text-sm text-slate-800 outline-none shadow-md placeholder-slate-400 font-medium"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Active Ongoing Booking Alert (If Exists) */}
        {activeBooking && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛠️</span>
              <div>
                <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                  {activeBooking.status || 'Technician Assigned'}
                </span>
                <h3 className="text-xs font-bold text-slate-900 mt-0.5">
                  {activeBooking.serviceTitle || 'Plumbing Leak Repair'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Technician: {activeBooking.providerName || 'Service Provider'} • Scheduled: Today
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`${ROUTES.CUSTOMER.TRACKING}/${activeBooking.id}`)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-sm self-stretch sm:self-auto text-center"
            >
              Track Technician Status →
            </button>
          </div>
        )}

        {/* Service Categories Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className={`text-base font-bold ${tokens.textPrimary}`}>Explore Categories</h2>
            <button
              type="button"
              onClick={() => navigate(ROUTES.CUSTOMER.SERVICES)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              View All Services →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {SERVICE_CATEGORIES.slice(0, 8).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className={`p-5 rounded-2xl ${tokens.bgCard} border ${tokens.border} shadow-sm hover:border-blue-300 hover:shadow-md transition text-left flex flex-col justify-between group`}
              >
                <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {cat.providersCount || '15+'} Technicians
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Top-Rated Service Providers Preview */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className={`text-base font-bold ${tokens.textPrimary}`}>Top Verified Technicians</h2>
            <span className="text-xs text-slate-400">High Rating & Fast Arrival</span>
          </div>

          {isLoading ? (
            <div className={`rounded-2xl ${tokens.bgCard} p-8 text-center text-xs text-slate-400 border ${tokens.border}`}>
              Loading featured providers...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredProviders.map((prov) => (
                <div
                  key={prov.id}
                  className={`rounded-2xl ${tokens.bgCard} p-5 border ${tokens.border} shadow-sm space-y-4 flex flex-col justify-between`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-base">
                        {prov.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{prov.name}</h3>
                        <p className="text-[11px] text-slate-500">{prov.category}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-xl">
                      <span className="font-bold text-amber-600">★ {prov.rating} ({prov.reviewsCount})</span>
                      <span className="font-bold text-blue-700">${prov.hourlyRate}/hr</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`${ROUTES.CUSTOMER.BOOKING}/srv-101?providerId=${prov.id}`)}
                    className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition text-center"
                  >
                    Book Appointment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}