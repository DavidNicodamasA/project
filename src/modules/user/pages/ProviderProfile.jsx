/**
 * Public Technician / Service Provider Profile Page
 * Path: src/modules/user/pages/ProviderProfile.jsx
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar';
import dataStore from '../../../services/dataStore';
import {
  Star,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  Briefcase,
  Check,
  Calendar,
  ArrowLeft,
  AlertTriangle,
  Image as ImageIcon,
  Eye,
  X,
} from 'lucide-react';

export default function ProviderProfile() {
  const navigate = useNavigate();
  const { providerId, id } = useParams();
  const [searchParams] = useSearchParams();
  const targetId = providerId || id;
  const initialTab = searchParams.get('tab') || 'services';

  const [provider, setProvider] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab); // 'services' | 'portfolio' | 'reviews' | 'about'
  const [zoomedWorkImage, setZoomedWorkImage] = useState(null);

  useEffect(() => {
    dataStore.syncProvidersFromApi();
    loadProviderData();
    const unsubscribe = dataStore.subscribe(() => {
      loadProviderData();
    });

    const handlePortfolioChange = () => {
      loadProviderData();
    };
    window.addEventListener('handypro_portfolio_updated', handlePortfolioChange);

    return () => {
      unsubscribe();
      window.removeEventListener('handypro_portfolio_updated', handlePortfolioChange);
    };
  }, [targetId]);

  const loadProviderData = () => {
    const found = targetId
      ? dataStore.getProviderById(targetId)
      : dataStore.getProviders()[0];
    if (found) {
      const livePortfolio = dataStore.getProviderPortfolio(found.id);
      setProvider({
        ...found,
        portfolio: (livePortfolio && livePortfolio.length) ? livePortfolio : (found.portfolio || []),
      });
    } else {
      setProvider(null);
    }
  };

  const analytics = useMemo(() => {
    if (!provider) return { reviews: [], reviewsCount: 0, avgRating: '4.9' };
    return dataStore.getProviderEarningsAnalytics(provider.id, provider.name);
  }, [provider]);

  if (!provider) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <span className="text-4xl">🛠️</span>
            <h2 className="text-lg font-bold text-slate-800">Technician Profile Not Found</h2>
            <button
              onClick={() => navigate('/user/dashboard')}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const offeredServices = [
    {
      id: `srv-${provider.id}-1`,
      title: `${provider.categoryLabel} Comprehensive Diagnostic & Repair`,
      category: provider.categoryLabel,
      basePrice: provider.hourlyRate,
      estimatedDuration: '1 - 2 Hours',
      description: `Complete diagnostic inspection, pressure test, hardware check, and certified fix by ${provider.name}.`,
    },
    {
      id: `srv-${provider.id}-2`,
      title: `Preventative Maintenance & Safety Inspection`,
      category: provider.categoryLabel,
      basePrice: Math.round(provider.hourlyRate * 1.2),
      estimatedDuration: '2 Hours',
      description: `Full routine safety audit, clean-up, component tightening, and performance tune-up.`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Navigation & Header Button */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate('/user/dashboard')}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-blue-50 transition shadow-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4 text-blue-600" />
            <span>Back to Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/user/emergency')}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-sm transition flex items-center gap-1.5"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Emergency SOS Dispatch</span>
          </button>
        </div>

        <div className="space-y-6">
          
          {/* Main Profile Header Card */}
          <div className="rounded-3xl bg-white p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              <div className="flex items-center gap-5">
                <div className={`relative h-20 w-20 md:h-24 md:w-24 rounded-2xl ${provider.avatarBg || 'bg-blue-600'} text-white flex items-center justify-center font-black text-2xl md:text-3xl shadow-md`}>
                  {provider.name.charAt(0)}
                  {provider.isVerified && (
                    <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center border-2 border-white shadow-md" title="Verified Technician">
                      ✓
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 font-display">
                      {provider.name}
                    </h1>
                    {provider.isVerified && (
                      <span className="px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase tracking-wider">
                        Verified Pro
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-extrabold text-blue-600">{provider.categoryLabel} Technician</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{provider.locationName} • {provider.serviceRadiusKm || 20} km service radius</span>
                  </p>
                </div>
              </div>

              {/* Rates & Booking Action CTA */}
              <div className="w-full md:w-auto p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex md:flex-col justify-between items-center md:items-end gap-3 self-stretch md:self-auto">
                <div className="text-left md:text-right">
                  <span className="text-2xl font-black text-blue-700">${provider.hourlyRate}</span>
                  <span className="text-xs text-slate-500 font-semibold"> / hr</span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/user/book/${provider.id}`)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md transition active:scale-95 flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Book Appointment</span>
                </button>
              </div>

            </div>

            {/* Stats Highlights Bar */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-sm md:text-base font-black text-amber-600 flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{analytics.avgRating || provider.rating || 4.9}</span>
                </p>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">{analytics.reviewsCount || provider.reviewsCount || 42} Customer Reviews</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-sm md:text-base font-black text-slate-900">{provider.experienceYears || 6}+ Yrs</p>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">Field Experience</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-sm md:text-base font-black text-emerald-600">{analytics.completedJobsCount || provider.completedJobs || 120}</p>
                <p className="text-[11px] text-slate-500 font-bold mt-0.5">Completed Jobs</p>
              </div>
            </div>
          </div>

          {/* Profile Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            {[
              { id: 'services', label: `Services Offered (${offeredServices.length})` },
              { id: 'portfolio', label: `Done Work & Portfolio (${provider.portfolio?.length || 0})` },
              { id: 'about', label: 'About & Credentials' },
              { id: 'reviews', label: `Customer Reviews (${analytics.reviews.length || 3})` },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-blue-50 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Offered Services */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              {offeredServices.map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-3 transition hover:border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase">
                      {service.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{service.title}</h3>
                    <p className="text-xs text-slate-500 max-w-lg">{service.description}</p>
                    <p className="text-[11px] font-semibold text-slate-400">
                      ⏱️ Est. Time: {service.estimatedDuration}
                    </p>
                  </div>

                  <div className="flex items-center sm:flex-col justify-between sm:items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <span className="text-base font-black text-blue-700">${service.basePrice}.00</span>
                    <button
                      type="button"
                      onClick={() => navigate(`/user/book/${provider.id}`)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition shadow-xs"
                    >
                      Book Service
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab: Done Work & Portfolio */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-900 flex items-center justify-between">
                <div>
                  <span className="font-extrabold block text-sm">📸 Verified Completed Work Gallery</span>
                  <span className="text-blue-700">Photos and project records uploaded directly by {provider.name}.</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-black text-xs">
                  {provider.portfolio?.length || 0} Project{provider.portfolio?.length === 1 ? '' : 's'}
                </span>
              </div>

              {!provider.portfolio || provider.portfolio.length === 0 ? (
                <div className="rounded-2xl bg-white p-12 text-center border border-slate-200 space-y-3">
                  <div className="h-16 w-16 mx-auto rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base font-display">No Completed Projects Uploaded Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
                    This technician has not uploaded project photos yet. Check out their verified customer reviews and credentials above!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {provider.portfolio.map((work) => (
                    <div
                      key={work.id}
                      className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:border-blue-400 hover:shadow-md transition flex flex-col group"
                    >
                      {work.imageUrl ? (
                        <div
                          className="relative h-48 w-full bg-slate-900 cursor-pointer overflow-hidden"
                          onClick={() => setZoomedWorkImage(work)}
                        >
                          <img
                            src={work.imageUrl}
                            alt={work.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-1.5 font-bold text-xs backdrop-blur-[2px]">
                            <Eye className="h-4 w-4" />
                            <span>Click to Zoom</span>
                          </div>
                          <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white font-extrabold text-[10px] uppercase tracking-wider">
                            {work.category}
                          </span>
                        </div>
                      ) : (
                        <div className="h-40 w-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-blue-400">
                          <ImageIcon className="h-12 w-12" />
                        </div>
                      )}

                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition">
                              {work.title}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400 shrink-0">
                              {work.completedDate}
                            </span>
                          </div>
                          {work.description && (
                            <p className="text-xs text-slate-600 mt-1 line-clamp-3 font-medium">
                              {work.description}
                            </p>
                          )}
                        </div>

                        {work.customerLocation && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                            <span>📍 {work.customerLocation}</span>
                            <span className="text-emerald-600 font-bold">✓ Verified Job</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: About & Skills */}
          {activeTab === 'about' && (
            <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-2">Professional Biography</h2>
                <p className="text-xs text-slate-600 leading-relaxed">{provider.bio}</p>
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900 mb-2">Specialized Skills & Tools</h2>
                <div className="flex flex-wrap gap-2">
                  {provider.skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200 flex items-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5 text-blue-600" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <span className="text-slate-500 font-semibold">Registered Workshop Location:</span>
                  <span className="font-bold text-slate-800">
                    {provider.address || `${provider.place || ''}, ${provider.district || provider.locationName}`} {provider.pincode ? `(${provider.pincode})` : ''}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <span className="text-slate-500 font-semibold">Operating District:</span>
                  <span className="font-extrabold text-blue-700">
                    {provider.district || provider.locationName} (Tamil Nadu)
                  </span>
                </div>

                {provider.coveredPlaces && provider.coveredPlaces.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs text-slate-500 font-semibold block">
                      Localities & Places Covered ({provider.coveredPlaces.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {provider.coveredPlaces.map((pl, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200"
                        >
                          📍 {pl}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {(analytics.reviews.length > 0 ? analytics.reviews : [
                {
                  id: 'rev-1',
                  customerName: 'Kalidhass S',
                  rating: 5,
                  date: '2026-09-15',
                  comment: 'Arrived right on time. Diagnosed the leak in minutes and did a super clean pipe replacement.',
                },
                {
                  id: 'rev-2',
                  customerName: 'Vishal AS',
                  rating: 5,
                  date: '2026-09-14',
                  comment: 'Very polite technician, explained the charges upfront, and finished the job cleanly.',
                },
              ]).map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                        {rev.customerName.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-slate-900">{rev.customerName}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{rev.date}</span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    {'★'.repeat(rev.rating)}
                    {'☆'.repeat(5 - rev.rating)}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}

        </div>

      </main>

      {/* Lightbox Zoom Modal */}
      {zoomedWorkImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomedWorkImage(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomedWorkImage(null)}
              className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={zoomedWorkImage.imageUrl}
              alt={zoomedWorkImage.title}
              className="w-full max-h-[65vh] object-contain bg-black"
            />
            <div className="p-5 bg-slate-900 text-white space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-blue-600 text-[10px] font-black uppercase">
                  {zoomedWorkImage.category}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{zoomedWorkImage.completedDate}</span>
              </div>
              <h3 className="text-base font-extrabold text-white">{zoomedWorkImage.title}</h3>
              {zoomedWorkImage.description && (
                <p className="text-xs text-slate-300 font-medium">{zoomedWorkImage.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}