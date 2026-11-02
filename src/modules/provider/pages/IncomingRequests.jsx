/**
 * Incoming Booking Requests Page
 * Path: src/modules/provider/pages/IncomingRequests.jsx
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar';
import { useAuth } from '../../../hooks/useAuth';
import dataStore from '../../../services/dataStore';
import {
  TAMIL_NADU_DISTRICTS,
  getDistrictById,
  calculateDistanceKm,
} from '../../../data/tamilNaduLocations';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ArrowLeft,
  XCircle,
  Zap,
  Calendar,
  User,
  Check,
  X,
  Sparkles,
  Filter,
  Search,
  Users,
  Navigation,
  Star,
  ShieldCheck,
  Compass,
} from 'lucide-react';

export default function IncomingRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'DECLINED'
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [searchLocality, setSearchLocality] = useState('');
  const [onlyNearbyUsers, setOnlyNearbyUsers] = useState(false);
  const [sortByClosest, setSortByClosest] = useState(true);
  const [requests, setRequests] = useState([]);
  const [allProviders, setAllProviders] = useState(() => dataStore.getProviders());
  const [profile, setProfile] = useState(() => dataStore.getProviderProfile());
  const [actionMessage, setActionMessage] = useState('');
  const [reschedulingBooking, setReschedulingBooking] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    newTime: '11:30 AM',
    newDate: '',
    reason: '',
  });

  const handleOpenReschedule = (booking) => {
    setReschedulingBooking(booking);
    setRescheduleForm({
      newTime: booking.proposedTime || '11:30 AM',
      newDate: booking.scheduledDate || new Date().toISOString().split('T')[0],
      reason: 'Currently completing another task nearby; will arrive shortly after.',
    });
  };

  const handleSubmitReschedule = (e) => {
    e.preventDefault();
    if (!reschedulingBooking) return;

    dataStore.proposeBookingTime(reschedulingBooking.id, {
      newTime: rescheduleForm.newTime,
      newDate: rescheduleForm.newDate,
      reason: rescheduleForm.reason,
    });

    setActionMessage(
      `Reschedule proposal for ${rescheduleForm.newTime} sent to ${reschedulingBooking.customerName}.`
    );
    setReschedulingBooking(null);
    loadRequests();
    setTimeout(() => setActionMessage(''), 5000);
  };

  useEffect(() => {
    dataStore.syncProvidersFromApi();
    loadRequests();
    const unsubscribe = dataStore.subscribe(() => {
      loadRequests();
    });
    return unsubscribe;
  }, [user]);

  const resolveCustomerDistrict = (booking) => {
    const locStr = `${booking.customerLocation || ''} ${booking.customerAddress || ''}`.toLowerCase();
    for (const d of TAMIL_NADU_DISTRICTS) {
      if (locStr.includes(d.id.toLowerCase()) || locStr.includes(d.name.toLowerCase())) {
        return d;
      }
      for (const pl of d.places) {
        if (locStr.includes(pl.toLowerCase())) {
          return d;
        }
      }
    }
    return TAMIL_NADU_DISTRICTS.find((d) => d.id === 'chennai') || TAMIL_NADU_DISTRICTS[0];
  };

  const getProviderDistanceToUser = (req) => {
    const prof = dataStore.getProviderProfile();
    const pLat = prof.latitude || 13.0827;
    const pLng = prof.longitude || 80.2707;
    const custDist = resolveCustomerDistrict(req);
    const custCoords = custDist?.coordinates || { lat: 13.0827, lng: 80.2707 };
    return calculateDistanceKm(pLat, pLng, custCoords.lat, custCoords.lng);
  };

  const getNearbyProvidersForUser = (req, maxLimit = 3) => {
    const custDist = resolveCustomerDistrict(req);
    const custCoords = custDist?.coordinates || { lat: 13.0827, lng: 80.2707 };
    const currentId = user?.id || profile?.id;

    return allProviders
      .map((p) => {
        const pLat = p.latitude || getDistrictById(p.district || p.locationId)?.coordinates?.lat || 13.0827;
        const pLng = p.longitude || getDistrictById(p.district || p.locationId)?.coordinates?.lng || 80.2707;
        const dist = calculateDistanceKm(custCoords.lat, custCoords.lng, pLat, pLng);
        const isCurrentProvider = (currentId && p.id === currentId) || (p.name && p.name.toLowerCase() === (user?.name || '').toLowerCase());
        return {
          ...p,
          distanceToUser: dist,
          isCurrentProvider,
        };
      })
      .sort((a, b) => a.distanceToUser - b.distanceToUser)
      .slice(0, maxLimit);
  };

  const loadRequests = () => {
    const prof = dataStore.getProviderProfile();
    setProfile(prof);
    setAllProviders(dataStore.getProviders());

    const pId = prof?.id || user?.id;
    const pName = prof?.name || user?.name;

    const all = dataStore.getBookings();
    const filtered = all.filter((b) => {
      if (dataStore.isBookingForProvider(b, pId, pName)) return true;
      if (b.isEmergency && prof.supportsEmergency) {
        const dist = resolveCustomerDistrict(b);
        const isSameDistrict =
          dist.id === (prof.district || prof.locationId || '').toLowerCase() ||
          dist.name.toLowerCase() === (prof.district || '').toLowerCase();
        if (isSameDistrict) return true;
      }
      return false;
    });

    setRequests(filtered);
  };

  const handleStatusUpdate = (bookingId, newStatus) => {
    dataStore.updateBookingStatus(bookingId, newStatus);
    setActionMessage(`Booking ${bookingId} updated to ${newStatus}.`);
    setTimeout(() => setActionMessage(''), 4000);
  };

  const filteredRequests = useMemo(() => {
    let list = requests.filter((item) => {
      const matchesTab = activeTab === 'ALL' || item.status?.toUpperCase() === activeTab.toUpperCase();
      const matchesDistrict =
        selectedDistrict === 'ALL' ||
        (item.customerLocation && item.customerLocation.toLowerCase().includes(selectedDistrict.toLowerCase())) ||
        (item.customerAddress && item.customerAddress.toLowerCase().includes(selectedDistrict.toLowerCase()));
      const matchesLocality =
        !searchLocality.trim() ||
        (item.customerAddress && item.customerAddress.toLowerCase().includes(searchLocality.toLowerCase())) ||
        (item.customerLocation && item.customerLocation.toLowerCase().includes(searchLocality.toLowerCase()));

      const distToUser = getProviderDistanceToUser(item);
      const matchesNearby = !onlyNearbyUsers || distToUser <= (profile.serviceRadiusKm || 25);

      return matchesTab && matchesDistrict && matchesLocality && matchesNearby;
    });

    if (sortByClosest) {
      list = [...list].sort((a, b) => getProviderDistanceToUser(a) - getProviderDistanceToUser(b));
    }

    return list;
  }, [requests, activeTab, selectedDistrict, searchLocality, onlyNearbyUsers, sortByClosest, profile]);

  const getStatusBadgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'DECLINED':
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header Title & Back Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              Job Request Station
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1 font-display">Customer Booking Requests</h1>
            <p className="text-xs text-slate-500 font-medium">
              Review, accept, or decline booking appointments submitted by customers
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

        {/* Action Feedback Banner */}
        {actionMessage && (
          <div className="p-3.5 rounded-2xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between shadow-xs">
            <span>{actionMessage}</span>
            <button
              type="button"
              onClick={() => setActionMessage('')}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter Navigation Tabs */}
        <div className="rounded-2xl bg-white p-2 border border-slate-200 shadow-xs flex flex-wrap gap-2">
          {[
            { key: 'ALL', label: `All Requests (${requests.length})` },
            { key: 'PENDING', label: `Pending Response (${requests.filter(r => r.status === 'PENDING').length})` },
            { key: 'ACCEPTED', label: `Accepted Jobs (${requests.filter(r => r.status === 'ACCEPTED' || r.status === 'IN_PROGRESS').length})` },
            { key: 'COMPLETED', label: `Completed (${requests.filter(r => r.status === 'COMPLETED').length})` },
            { key: 'DECLINED', label: `Declined / Cancelled (${requests.filter(r => r.status === 'DECLINED' || r.status === 'CANCELLED').length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                activeTab === tab.key
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tamil Nadu Location & Proximity Filter Bar */}
        <div className="rounded-2xl bg-white p-3.5 border border-slate-200 shadow-xs flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 shrink-0">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>Filter by Tamil Nadu Location:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setOnlyNearbyUsers(!onlyNearbyUsers)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  onlyNearbyUsers
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Filter requests strictly within your service radius"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Nearby Users (&lt; {profile.serviceRadiusKm || 25} km)</span>
              </button>

              <button
                type="button"
                onClick={() => setSortByClosest(!sortByClosest)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  sortByClosest
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Sort requests closest to your location first"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Sort: {sortByClosest ? 'Closest First' : 'Default'}</span>
              </button>

              {(selectedDistrict !== 'ALL' || searchLocality || onlyNearbyUsers) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDistrict('ALL');
                    setSearchLocality('');
                    setOnlyNearbyUsers(false);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:underline shrink-0 ml-auto sm:ml-0"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="text-xs font-bold p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:border-emerald-600"
            >
              <option value="ALL">📍 All 38 Tamil Nadu Districts</option>
              {TAMIL_NADU_DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.region} TN)
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search customer locality or street (e.g. T. Nagar, RS Puram)..."
                value={searchLocality}
                onChange={(e) => setSearchLocality(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center text-xs text-slate-400 border border-slate-200 space-y-3">
            <span className="text-4xl">📋</span>
            <h3 className="text-sm font-bold text-slate-800">No Service Requests Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no customer appointment requests matching your current status and proximity filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => {
              const distanceToUser = getProviderDistanceToUser(req);
              const isWithinRadius = distanceToUser <= (profile.serviceRadiusKm || 25);
              const customerDistrict = resolveCustomerDistrict(req);
              const nearbyProviders = getNearbyProvidersForUser(req, 3);

              return (
                <div
                  key={req.id}
                  className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs flex flex-col gap-5 transition hover:border-emerald-300"
                >
                  {/* Top Details & Action Row */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Details Section */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900 font-display">{req.customerName}</span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-mono">
                          {req.id}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadgeClass(
                            req.status
                          )}`}
                        >
                          {req.status}
                        </span>

                        {req.isEmergency && (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-black uppercase flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            <span>Emergency SOS</span>
                          </span>
                        )}

                        {/* Current Provider Distance Badge */}
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                            isWithinRadius
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <Navigation className="h-3 w-3 text-emerald-600" />
                          <span>{distanceToUser.toFixed(1)} km from your workshop ({isWithinRadius ? 'Nearby' : 'Extended Range'})</span>
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-emerald-800">{req.serviceTitle}</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">
                            {req.customerAddress} ({req.customerLocation || customerDistrict.name})
                          </span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{req.customerPhone}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{req.scheduledDate}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{req.scheduledTime}</span>
                        </p>
                      </div>

                      {req.notes && (
                        <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          "{req.notes}"
                        </p>
                      )}

                      {/* Reschedule Timer Status Notice */}
                      {req.rescheduleStatus === 'PROPOSED_BY_PROVIDER' && (
                        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-center justify-between gap-2 shadow-xs">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>
                              Time change proposal sent to customer: <strong>{req.proposedTime}</strong> on{' '}
                              <strong>{req.proposedDate || req.scheduledDate}</strong>.
                              {req.rescheduleReason && ` ("${req.rescheduleReason}")`}
                            </span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 shrink-0">
                            Awaiting Customer
                          </span>
                        </div>
                      )}
                      {req.rescheduleStatus === 'ACCEPTED_BY_CUSTOMER' && (
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-center gap-2 shadow-xs">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>
                            Customer accepted your adjusted time slot: <strong>{req.scheduledTime}</strong> on{' '}
                            <strong>{req.scheduledDate}</strong>.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex lg:flex-col items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 shrink-0">
                      <div className="text-left lg:text-right">
                        <span className="text-2xl font-black text-emerald-700">${req.amount}.00</span>
                        <span className="text-[11px] text-slate-500 block font-semibold">Estimated Pay</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {req.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(req.id, 'ACCEPTED')}
                              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-xs flex items-center gap-1.5"
                            >
                              <Check className="h-4 w-4" />
                              <span>Accept Job</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReschedule(req)}
                              className="px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                              title="Propose new appointment time slot"
                            >
                              <Clock className="h-4 w-4" />
                              <span>Change Time</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(req.id, 'DECLINED')}
                              className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <X className="h-4 w-4" />
                              <span>Decline</span>
                            </button>
                          </>
                        )}

                        {req.status === 'ACCEPTED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenReschedule(req)}
                              className="px-3.5 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold transition flex items-center gap-1.5"
                              title="Adjust scheduled arrival time"
                            >
                              <Clock className="h-4 w-4 text-amber-700" />
                              <span>Reschedule</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(req.id, 'COMPLETED')}
                              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition shadow-xs flex items-center gap-1.5"
                            >
                              <Sparkles className="h-4 w-4" />
                              <span>Mark Completed</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dedicated Nearby Providers to User Section */}
                  <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-3.5 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-600" />
                        <h4 className="text-xs font-black text-slate-800 tracking-tight">
                          Providers in Nearby Location to Customer
                        </h4>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          {customerDistrict.name} & Nearby
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Customer coordinate: {customerDistrict.name} ({customerDistrict.region} TN)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                      {nearbyProviders.map((pro) => (
                        <div
                          key={pro.id || pro.name}
                          className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 transition ${
                            pro.isCurrentProvider
                              ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-400/40 shadow-xs'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-extrabold text-slate-900 truncate">
                                  {pro.name}
                                </span>
                                {pro.isCurrentProvider && (
                                  <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 block font-medium">
                                {pro.category || pro.trade || 'Technician'} • {pro.district || customerDistrict.name}
                              </span>
                            </div>
                            <span className="text-[11px] font-black text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-lg shrink-0">
                              {pro.distanceToUser.toFixed(1)} km
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-600 border-t border-slate-100 pt-1.5">
                            <span className="flex items-center gap-1 font-semibold text-amber-600">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                              {pro.rating || '4.9'}
                            </span>
                            <span className="text-slate-500 truncate max-w-[130px]">
                              📍 {pro.place || (pro.coveredPlaces && pro.coveredPlaces[0]) || 'District Center'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reschedule Proposal Modal */}
        {reschedulingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6 animate-fadeIn">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 font-display">
                      Propose Reschedule Time
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Notify customer with an adjusted arrival time slot
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReschedulingBooking(null)}
                  className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Current Booking Overview */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Customer:</span>
                  <span className="font-extrabold text-slate-900">{reschedulingBooking.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Service:</span>
                  <span className="font-semibold text-emerald-800">{reschedulingBooking.serviceTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Customer's Requested Slot:</span>
                  <span className="font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md">
                    📅 {reschedulingBooking.scheduledDate} at 🕒 {reschedulingBooking.scheduledTime}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmitReschedule} className="space-y-4">
                {/* Date and Time Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      New Proposed Date:
                    </label>
                    <input
                      type="date"
                      required
                      value={rescheduleForm.newDate}
                      onChange={(e) =>
                        setRescheduleForm((prev) => ({ ...prev, newDate: e.target.value }))
                      }
                      className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      New Proposed Time:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 11:30 AM or 02:00 PM"
                      value={rescheduleForm.newTime}
                      onChange={(e) =>
                        setRescheduleForm((prev) => ({ ...prev, newTime: e.target.value }))
                      }
                      className="w-full text-xs font-bold p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Quick Time Presets */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1.5 uppercase">
                    Quick Time Presets:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM', '03:30 PM', '05:00 PM'].map(
                      (preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            setRescheduleForm((prev) => ({ ...prev, newTime: preset }))
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                            rescheduleForm.newTime === preset
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50'
                          }`}
                        >
                          {preset}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Reason / Note to Customer */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Reason & Explanation for Customer:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rescheduleForm.reason}
                    onChange={(e) =>
                      setRescheduleForm((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    placeholder="e.g. Currently finishing emergency repair nearby, can arrive by 11:30 AM..."
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setRescheduleForm((prev) => ({
                          ...prev,
                          reason:
                            'Currently completing a service in your neighborhood; will arrive directly after.',
                        }))
                      }
                      className="text-[10px] text-amber-700 hover:underline font-semibold"
                    >
                      + Finishing nearby job
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setRescheduleForm((prev) => ({
                          ...prev,
                          reason:
                            'Heavy traffic / transit delay on route. Adjusting arrival time for accuracy.',
                        }))
                      }
                      className="text-[10px] text-amber-700 hover:underline font-semibold"
                    >
                      + Transit delay
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setReschedulingBooking(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-md transition flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Send Time Change to Customer</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}