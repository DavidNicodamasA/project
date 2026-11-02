/**
 * Customer Service & Provider Search Page
 * Path: src/modules/user/pages/Search.jsx
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar';
import dataStore, { SERVICE_CATEGORIES } from '../../../services/dataStore';
import { TAMIL_NADU_DISTRICTS } from '../../../data/tamilNaduLocations';
import {
  Search as SearchIcon,
  Star,
  MapPin,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  ArrowLeft,
  Calendar,
  User,
} from 'lucide-react';

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Query state sync
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [maxPrice, setMaxPrice] = useState(100);
  const [minRating, setMinRating] = useState(0);
  const [onlyEmergency, setOnlyEmergency] = useState(false);
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    dataStore.syncProvidersFromApi();
    loadProviders();
    const unsubscribe = dataStore.subscribe(() => {
      loadProviders();
    });
    return unsubscribe;
  }, [selectedCategory, searchQuery]);

  const loadProviders = () => {
    const list = dataStore.getProviders({
      category: selectedCategory,
      searchQuery: searchQuery,
    });
    setProviders(list);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: searchQuery, category: selectedCategory });
    loadProviders();
  };

  // Filter logic
  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const matchesPrice = p.hourlyRate <= maxPrice;
      const matchesRating = (p.rating || 4.5) >= minRating;
      const matchesEmergency = !onlyEmergency || p.supportsEmergency;
      const matchesDistrict =
        selectedDistrict === 'all' ||
        (p.district && p.district.toLowerCase() === selectedDistrict.toLowerCase()) ||
        (p.locationId && p.locationId.toLowerCase() === selectedDistrict.toLowerCase());
      return matchesPrice && matchesRating && matchesEmergency && matchesDistrict;
    });
  }, [providers, maxPrice, minRating, onlyEmergency, selectedDistrict]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">

        {/* Top Header & Navigation Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-md bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              Provider Discovery Engine
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1 font-display">
              Search Service Professionals
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Find verified local technicians, compare rates, and book appointments instantly
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/user/dashboard')}
            className="self-start md:self-center px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-blue-600 text-xs font-bold hover:bg-blue-50 transition shadow-xs flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Search Input Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="rounded-2xl bg-white p-3 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by service name, provider, or skill (e.g. leak, wiring, AC)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md transition active:scale-95"
          >
            Search Now
          </button>
        </form>

        {/* Category Horizontal Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          {SERVICE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSearchParams({ q: searchQuery, category: cat.id });
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-blue-50 border border-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Layout (Sidebar Filters + Search Results) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Filters Sidebar */}
          <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Filters</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMaxPrice(100);
                  setMinRating(0);
                  setOnlyEmergency(false);
                  setSelectedDistrict('all');
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setSearchParams({});
                }}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Tamil Nadu District Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Tamil Nadu District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:border-blue-500"
              >
                <option value="all">📍 All Tamil Nadu Districts</option>
                {TAMIL_NADU_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.region} TN)
                  </option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-700">Max Hourly Rate</label>
                <span className="font-extrabold text-blue-600">${maxPrice}/hr</span>
              </div>
              <input
                type="range"
                min="20"
                max="150"
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Rating Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Minimum Rating</label>
              <div className="flex items-center gap-1">
                {[0, 3, 4, 4.5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMinRating(val)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition ${
                      minRating === val
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {val === 0 ? 'Any' : `${val}★+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Filter Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">SOS Emergency</p>
                <p className="text-[10px] text-slate-400">24/7 Rapid Response</p>
              </div>
              <input
                type="checkbox"
                checked={onlyEmergency}
                onChange={(e) => setOnlyEmergency(e.target.checked)}
                className="h-4 w-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Results Count Header */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Showing <strong className="text-slate-900 font-extrabold">{filteredProviders.length}</strong> matching specialists online
              </span>
            </div>

            {filteredProviders.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center border border-slate-200 space-y-3">
                <span className="text-3xl">🔍</span>
                <h3 className="text-sm font-bold text-slate-800">No Providers Found</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Try adjusting your search terms or lowering your filter criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-4 transition hover:border-blue-300 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      
                      {/* Provider Title & Avatar */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-xl ${provider.avatarBg || 'bg-blue-600'} text-white flex items-center justify-center font-black text-lg shadow-sm`}>
                            {provider.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-extrabold text-slate-900 font-display">{provider.name}</h3>
                              {provider.isVerified && (
                                <ShieldCheck className="h-4 w-4 text-blue-600" title="Verified Pro" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold">{provider.categoryLabel}</p>
                          </div>
                        </div>

                        {provider.supportsEmergency && (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-black uppercase flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            <span>SOS</span>
                          </span>
                        )}
                      </div>

                      {/* Ratings & Rates */}
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-slate-900 font-extrabold">{provider.rating || 4.9}</span>
                          <span className="text-slate-400 font-medium">({provider.reviewsCount || 30})</span>
                        </div>
                        <div className="text-slate-600 font-semibold">
                          <strong className="text-blue-700 text-sm font-black">${provider.hourlyRate}</strong> / hr
                        </div>
                      </div>

                      {/* Location & Bio */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-700">
                            {(provider.place ? `${provider.place}, ` : '') + (provider.district || provider.locationName)}
                          </span>
                          <span className="text-slate-400">
                            • {provider.calculatedDistanceMiles ? `${provider.calculatedDistanceMiles} km away` : 'Tamil Nadu'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 italic">
                          "{provider.bio}"
                        </p>
                      </div>

                      {/* Skills Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {provider.skills?.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-100"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/user/provider/${provider.id}`)}
                        className="flex-1 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-extrabold hover:bg-slate-50 transition"
                      >
                        View Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/user/book/${provider.id}`)}
                        className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Book Now</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}