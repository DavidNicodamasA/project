/**
 * Service Provider Command Center & Dashboard
 * Path: src/modules/provider/pages/Dashboard.jsx
 */

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../../../components/layout/Navbar';
import { useAuth } from '../../../hooks/useAuth';
import dataStore, { LOCATIONS, SERVICE_CATEGORIES, playChimeSound } from '../../../services/dataStore';
import {
  TAMIL_NADU_DISTRICTS,
  getDistrictById,
  getPlacesForDistrict,
} from '../../../data/tamilNaduLocations';
import ProviderRouteOptimizer from '../components/ProviderRouteOptimizer';
import axios from 'axios';
import {
  Briefcase,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit3,
  DollarSign,
  Star,
  ShieldCheck,
  Power,
  Bell,
  ArrowRight,
  Plus,
  Trash2,
  Check,
  Filter,
  List,
  LayoutGrid,
  TrendingUp,
  Receipt,
  MessageSquare,
  Users,
  Navigation,
  Radio,
  Award,
  Camera,
  Image as ImageIcon,
  UploadCloud,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  // Provider profile state
  const [profile, setProfile] = useState(() => dataStore.getProviderProfile());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileEditForm, setProfileEditForm] = useState({ ...profile });
  const [customDistrictInput, setCustomDistrictInput] = useState('');
  const [newSkillInput, setNewSkillInput] = useState('');

  // Active Provider ID
  const [activeProviderId, setActiveProviderId] = useState(profile?.id || user?.id || 'prov-active');
  const activeProviderName = user?.name || profile?.name || 'Service Provider';

  // Bookings state & Navigation
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('ACCEPTED'); // 'ACCEPTED' | 'PENDING' | 'ALL' | 'EARNINGS' | 'ROUTE_OPTIMIZER'
  const [districtFilterOnly, setDistrictFilterOnly] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');
  const [viewLayout, setViewLayout] = useState('rows'); // 'rows' | 'cards'
  
  // Real-Time GPS Location Broadcasting state
  const [activeBroadcastingBookingId, setActiveBroadcastingBookingId] = useState(null);
  const [geoWatchId, setGeoWatchId] = useState(null);

  const handleToggleGpsBroadcast = (bookingId) => {
    if (activeBroadcastingBookingId === bookingId) {
      if (geoWatchId) navigator.geolocation.clearWatch(geoWatchId);
      setGeoWatchId(null);
      setActiveBroadcastingBookingId(null);
      axios.post(`/api/v1/tracking/${bookingId}/stop`).catch(() => {});
      setNotificationMsg(`Live GPS sharing stopped for booking ${bookingId}.`);
      setTimeout(() => setNotificationMsg(''), 3500);
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setNotificationMsg(`Acquiring high-accuracy GPS coordinates for booking ${bookingId}...`);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords;
        axios
          .post(`/api/v1/tracking/${bookingId}/location`, {
            providerId: activeProviderId,
            latitude,
            longitude,
            heading: heading || 0,
            speed: speed || 0,
            status: 'on_the_way',
          })
          .catch(() => {});
      },
      (err) => {
        console.warn('Geolocation watch error:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    setGeoWatchId(watchId);
    setActiveBroadcastingBookingId(bookingId);
    setNotificationMsg(`🛰️ Live GPS Broadcasting active for ${bookingId}! Customer is receiving real-time vehicle movement.`);
    setTimeout(() => setNotificationMsg(''), 5000);
  };

  const handleIssueWarranty = async (booking) => {
    try {
      const res = await axios.post('/api/v1/warranties/issue', {
        bookingId: booking.id,
        customerId: booking.customerId,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail || 'customer@handypro.com',
        providerId: activeProviderId,
        providerName: activeProviderName,
        serviceCategory: booking.category || 'general',
        serviceTitle: booking.serviceTitle,
        durationDays: 90,
      });

      if (res.data?.success) {
        alert(`✅ Digital Service Warranty ${res.data.data.warrantyId} successfully issued to ${booking.customerName}! Valid for 90 days.`);
        setNotificationMsg(`Warranty ${res.data.data.warrantyId} created and sent to customer!`);
        setTimeout(() => setNotificationMsg(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue warranty.');
    }
  };

  // Latest customer appointment alert
  const [latestAlert, setLatestAlert] = useState(() => {
    return dataStore.getLatestAlert(activeProviderId, activeProviderName);
  });

  // Load and subscribe to live store updates
  useEffect(() => {
    loadData();
    const unsubscribe = dataStore.subscribe((e) => {
      loadData();
      if (e?.detail) {
        if (dataStore.isBookingForProvider(e.detail, activeProviderId, activeProviderName)) {
          setLatestAlert(e.detail);
          playChimeSound();
        }
      } else {
        const storedAlert = dataStore.getLatestAlert(activeProviderId, activeProviderName);
        if (storedAlert) setLatestAlert(storedAlert);
      }
    });
    return unsubscribe;
  }, [activeProviderId, activeProviderName]);

  const loadData = () => {
    const prof = dataStore.getProviderProfile();
    setProfile(prof);

    const allBookings = dataStore.getBookings();
    setBookings(allBookings);

    const provs = dataStore.getProviders();
    const current = provs.find(
      (p) =>
        p.id === activeProviderId ||
        (p.email && user?.email && p.email.toLowerCase() === user?.email.toLowerCase())
    );
    if (current?.portfolio) {
      setPortfolioList(current.portfolio);
    }
  };

  // Reschedule state & handlers
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

    setNotificationMsg(
      `⏱️ Reschedule proposal for ${rescheduleForm.newTime} sent to ${reschedulingBooking.customerName}!`
    );
    setReschedulingBooking(null);
    loadData();
    setTimeout(() => setNotificationMsg(''), 5000);
  };

  // Provider Done Work / Portfolio state
  const [portfolioList, setPortfolioList] = useState([]);
  const [isUploadWorkOpen, setIsUploadWorkOpen] = useState(false);
  const [uploadWorkForm, setUploadWorkForm] = useState({
    title: '',
    category: profile.category || 'carpentry',
    description: '',
    imageUrl: '',
    completedDate: new Date().toISOString().split('T')[0],
    customerLocation: profile.place || profile.locationName || 'T. Nagar, Chennai',
  });
  const [isUploadingWork, setIsUploadingWork] = useState(false);

  const compressImage = (file, maxWidth = 1000, maxHeight = 1000, quality = 0.72) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImage(file);
      if (compressedDataUrl) {
        setUploadWorkForm((prev) => ({ ...prev, imageUrl: compressedDataUrl }));
      }
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadWorkForm((prev) => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompletedWork = async (e) => {
    e.preventDefault();
    if (!uploadWorkForm.title || !uploadWorkForm.imageUrl) {
      alert('Please provide a project title and upload an image.');
      return;
    }

    setIsUploadingWork(true);
    try {
      const payload = {
        title: uploadWorkForm.title,
        category: uploadWorkForm.category,
        description: uploadWorkForm.description,
        imageUrl: uploadWorkForm.imageUrl,
        completedDate: uploadWorkForm.completedDate,
        customerLocation: uploadWorkForm.customerLocation,
        providerEmail: user?.email,
      };

      const result = await dataStore.uploadProviderPortfolio(activeProviderId, payload);
      setPortfolioList((prev) => [
        {
          id: `work_${Date.now()}`,
          ...payload,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      setNotificationMsg(`✅ Project "${uploadWorkForm.title}" published to your customer portfolio!`);
      setIsUploadWorkOpen(false);
      setUploadWorkForm({
        title: '',
        category: profile.category || 'carpentry',
        description: '',
        imageUrl: '',
        completedDate: new Date().toISOString().split('T')[0],
        customerLocation: profile.place || profile.locationName || 'T. Nagar, Chennai',
      });
      setTimeout(() => setNotificationMsg(''), 4500);
    } catch (err) {
      console.error('Portfolio publish error:', err);
      alert('Portfolio published locally and submitted to server.');
      setIsUploadWorkOpen(false);
    } finally {
      setIsUploadingWork(false);
    }
  };

  const handleDeleteWork = (workId) => {
    if (!window.confirm('Delete this completed work item from your portfolio?')) return;
    dataStore.deleteProviderPortfolio(activeProviderId, workId);
    setPortfolioList((prev) => prev.filter((w) => w.id !== workId));
    setNotificationMsg('Portfolio work item deleted.');
    setTimeout(() => setNotificationMsg(''), 3000);
  };

  // Provider Analytics & Ratings data
  const earningsAnalytics = useMemo(() => {
    return dataStore.getProviderEarningsAnalytics(activeProviderId, activeProviderName);
  }, [bookings, activeProviderId, activeProviderName]);

  // Filter Bookings for Current Provider
  const providerBookings = useMemo(() => {
    return bookings.filter((b) => dataStore.isBookingForProvider(b, activeProviderId, activeProviderName));
  }, [bookings, activeProviderId, activeProviderName]);

  const filteredBookings = useMemo(() => {
    let list = providerBookings;

    if (activeTab === 'ACCEPTED') {
      list = list.filter((b) => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS');
    } else if (activeTab === 'PENDING') {
      list = list.filter((b) => b.status === 'PENDING');
    }

    if (districtFilterOnly && profile.locationId) {
      list = list.filter(
        (b) =>
          b.customerLocation &&
          b.customerLocation.toLowerCase().includes((profile.locationName || profile.locationId).toLowerCase())
      );
    }

    return list;
  }, [providerBookings, activeTab, districtFilterOnly, profile]);

  // Toggle Online / Offline Availability
  const handleToggleOnlineStatus = () => {
    const updatedStatus = !profile.isAvailable;
    const updated = dataStore.updateProviderProfile({ isAvailable: updatedStatus });
    setProfile(updated);
    setNotificationMsg(
      updatedStatus
        ? 'You are now ONLINE. Customers can view your profile and book appointments.'
        : 'You are now OFFLINE. Your profile is hidden from customer searches.'
    );
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  // Update Booking Status Workflow
  const handleUpdateStatus = (bookingId, status) => {
    dataStore.updateBookingStatus(bookingId, status);
    setNotificationMsg(`Booking status updated to ${status}.`);
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  // Profile Edit Handlers
  const handleOpenEditModal = () => {
    setProfileEditForm({ ...profile });
    setCustomDistrictInput(profile.customLocation || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const districtObj = getDistrictById(profileEditForm.district || profileEditForm.locationId || 'chennai');
    const updated = dataStore.updateProviderProfile({
      ...profileEditForm,
      state: 'Tamil Nadu',
      district: districtObj.name,
      place: profileEditForm.place || 'Central',
      address: profileEditForm.address || '',
      pincode: profileEditForm.pincode || '',
      locationId: districtObj.id,
      locationName: `${districtObj.name} (${profileEditForm.place || 'Central'})`,
      latitude: districtObj.coordinates?.lat || 13.0827,
      longitude: districtObj.coordinates?.lng || 80.2707,
      customLocation: profileEditForm.locationId === 'other' ? customDistrictInput : '',
    });
    setProfile(updated);
    setIsEditingProfile(false);
    setNotificationMsg('Provider profile & workshop address updated successfully.');
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    const currentSkills = profileEditForm.skills || [];
    setProfileEditForm({
      ...profileEditForm,
      skills: [...currentSkills, newSkillInput.trim()],
    });
    setNewSkillInput('');
  };

  const handleRemoveSkill = (index) => {
    const currentSkills = profileEditForm.skills || [];
    setProfileEditForm({
      ...profileEditForm,
      skills: currentSkills.filter((_, i) => i !== index),
    });
  };

  const currentDistrictObj = useMemo(() => {
    return getDistrictById(profile.district || profile.locationId || 'chennai');
  }, [profile.district, profile.locationId]);

  const currentDistrictPlaces = useMemo(() => {
    return getPlacesForDistrict(profile.district || profile.locationId || 'chennai');
  }, [profile.district, profile.locationId]);

  const handleQuickDistrictSwitch = (e) => {
    const newDistrictId = e.target.value;
    const distObj = getDistrictById(newDistrictId);
    const places = getPlacesForDistrict(newDistrictId);
    const primaryPlace = places[0] || 'Central';

    const updated = dataStore.updateProviderProfile({
      state: 'Tamil Nadu',
      district: distObj.name,
      place: primaryPlace,
      locationId: distObj.id,
      locationName: `${distObj.name} (${primaryPlace})`,
      latitude: distObj.coordinates?.lat || 13.0827,
      longitude: distObj.coordinates?.lng || 80.2707,
      coveredPlaces: places.slice(0, 8),
    });
    setProfile(updated);
    setNotificationMsg(`Operating district switched to ${distObj.name}, Tamil Nadu (${places.length} localities available).`);
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  const handleTogglePlaceCoverage = (placeName) => {
    const currentCovered = Array.isArray(profile.coveredPlaces) && profile.coveredPlaces.length > 0
      ? [...profile.coveredPlaces]
      : [profile.place || 'Central'];

    let nextCovered;
    if (currentCovered.includes(placeName)) {
      if (placeName === profile.place) {
        setNotificationMsg(`"${placeName}" is your base workshop town and cannot be removed.`);
        setTimeout(() => setNotificationMsg(''), 3000);
        return;
      }
      nextCovered = currentCovered.filter((p) => p !== placeName);
      setNotificationMsg(`Removed "${placeName}" from service coverage.`);
    } else {
      nextCovered = [...currentCovered, placeName];
      setNotificationMsg(`Added "${placeName}" to your active Tamil Nadu service territory!`);
    }

    const updated = dataStore.updateProviderProfile({ coveredPlaces: nextCovered });
    setProfile(updated);
    setTimeout(() => setNotificationMsg(''), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header Command Bar */}
        <div className="relative rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-card overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-100/50 via-teal-50/30 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/80 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Service Provider Command Center</span>
                </span>
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200/60">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Base: {profile.locationName}</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
                {activeProviderName} Dashboard
              </h1>
              <p className="text-sm text-slate-600 font-medium">
                Primary Trade: <strong className="text-slate-800 font-bold">{profile.categoryLabel}</strong> • Hourly Rate: <span className="font-extrabold text-emerald-700">${profile.hourlyRate}/hr</span>
              </p>
            </div>

            {/* Right Actions: Online Toggle & Edit Profile */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleToggleOnlineStatus}
                className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 border transition shadow-sm ${
                  profile.isAvailable
                    ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <Power className="h-4 w-4" />
                <span>{profile.isAvailable ? '● ONLINE (Accepting Jobs)' : '○ OFFLINE (Hidden)'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenEditModal}
                className="px-4 py-2.5 rounded-2xl font-extrabold text-xs bg-white text-slate-800 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs flex items-center gap-1.5"
              >
                <Edit3 className="h-4 w-4 text-slate-500" />
                <span>Edit Profile & Skills</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAMIL NADU SERVICE TERRITORY & COVERAGE PLACES */}
        <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-card space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                <MapPin className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 font-display">
                    Tamil Nadu Operating Territory & Service Places
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    {currentDistrictObj?.region || 'Tamil Nadu'} Region
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Base Workshop: <strong className="text-slate-800 font-bold">{profile.address || `${profile.place || 'Central'}, ${currentDistrictObj?.name || profile.district}`}</strong> • PIN: <strong className="text-slate-800 font-bold">{profile.pincode || '600017'}</strong>
                </p>
              </div>
            </div>

            {/* Quick District Selector for Provider */}
            <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50/90 p-2 rounded-2xl border border-slate-200/80">
              <label className="text-xs font-bold text-slate-600 whitespace-nowrap flex items-center gap-1 pl-1">
                <Filter className="h-3.5 w-3.5 text-emerald-600" />
                <span>District:</span>
              </label>
              <select
                value={profile.district || profile.locationId || 'chennai'}
                onChange={handleQuickDistrictSwitch}
                className="text-xs font-extrabold py-2 px-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 focus:outline-none shadow-2xs cursor-pointer"
              >
                {TAMIL_NADU_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.region} TN)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Places of this District in Tamil Nadu */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-extrabold text-slate-800">
                Service Localities in {currentDistrictObj?.name || profile.district} ({currentDistrictPlaces.length} Prominent Localities Available):
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Operating Radius: <strong className="text-emerald-700 font-bold">{profile.serviceRadiusKm || 25} km</strong> • Active Places: <strong className="text-emerald-700 font-bold">{Array.isArray(profile.coveredPlaces) ? profile.coveredPlaces.length : 1}</strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {currentDistrictPlaces.map((pl) => {
                const isBasePlace = profile.place === pl;
                const isCovered = (profile.coveredPlaces && profile.coveredPlaces.includes(pl)) || isBasePlace;
                return (
                  <button
                    key={pl}
                    type="button"
                    onClick={() => handleTogglePlaceCoverage(pl)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-150 flex items-center gap-1.5 border ${
                      isBasePlace
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : isCovered
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100/70'
                        : 'bg-slate-50/90 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                    title={isBasePlace ? 'Your Registered Workshop Base (Cannot be disabled)' : isCovered ? 'Active Service Place (Click to remove from service)' : 'Click to add to your service places'}
                  >
                    <span>{isBasePlace ? '📍 Base: ' : isCovered ? '✓ ' : '+ '}</span>
                    <span>{pl}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 font-medium italic">
              💡 <strong>Instant Local Coverage</strong>: Click any place to toggle service coverage across {currentDistrictObj?.name}. Customers in green places will see your profile first in nearby searches.
            </p>
          </div>
        </div>

        {/* Live Incoming Alert Banner */}
        {latestAlert && (
          <div className="rounded-3xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white p-6 shadow-card space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                  <Bell className="h-5 w-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-black text-emerald-950 text-base font-display">
                    NEW APPOINTMENT BROADCAST!
                  </h3>
                  <span className="text-xs font-bold text-emerald-800">
                    From: {latestAlert.customerName} ({latestAlert.customerPhone})
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-medium text-emerald-950 bg-white/80 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-bold block">Service Requested</span>
                <strong className="text-sm font-extrabold text-slate-900 font-display">{latestAlert.serviceTitle}</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-bold block">Address & Location</span>
                <span className="text-slate-700 font-semibold">{latestAlert.customerAddress}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-bold block">Scheduled Time</span>
                <span className="text-emerald-700 font-extrabold">{latestAlert.scheduledDate} at {latestAlert.scheduledTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleUpdateStatus(latestAlert.id, 'ACCEPTED');
                  setLatestAlert(null);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm shadow-emerald-600/25 transition"
              >
                Accept Appointment
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUpdateStatus(latestAlert.id, 'CANCELLED');
                  setLatestAlert(null);
                }}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
              >
                Decline Request
              </button>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {notificationMsg && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 flex items-center justify-between shadow-2xs">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{notificationMsg}</span>
            </span>
            <button onClick={() => setNotificationMsg('')} className="text-emerald-500 hover:text-emerald-800 p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Executive Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover transition-all duration-200 space-y-1">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total Revenue</span>
            <p className="text-3xl font-black text-slate-900 font-display">${earningsAnalytics.totalEarnings}.00</p>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <span>✓</span> Earned from bookings
            </span>
          </div>
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover transition-all duration-200 space-y-1">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Active Appointments</span>
            <p className="text-3xl font-black text-emerald-700 font-display">{earningsAnalytics.acceptedJobsCount}</p>
            <span className="text-[11px] text-slate-500 font-medium">Accepted & en-route</span>
          </div>
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover transition-all duration-200 space-y-1">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Pending Requests</span>
            <p className="text-3xl font-black text-amber-600 font-display">{earningsAnalytics.pendingJobsCount}</p>
            <span className="text-[11px] text-slate-500 font-medium">Awaiting your response</span>
          </div>
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover transition-all duration-200 space-y-1">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Average Customer Rating</span>
            <p className="text-3xl font-black text-slate-900 flex items-center gap-1.5 font-display">
              <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
              <span>{earningsAnalytics.avgRating}</span>
            </p>
            <span className="text-[11px] text-slate-500 font-medium">From verified customer reviews</span>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="p-1.5 bg-slate-100/80 border border-slate-200/80 rounded-2xl flex flex-wrap gap-1.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('ACCEPTED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'ACCEPTED'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Accepted Jobs ({earningsAnalytics.acceptedJobsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PENDING')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'PENDING'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Pending Requests ({earningsAnalytics.pendingJobsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>All Jobs ({providerBookings.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('EARNINGS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'EARNINGS'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Earnings Analytics & Reviews</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ROUTE_OPTIMIZER')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'ROUTE_OPTIMIZER'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Navigation className="h-4 w-4" />
              <span>AI Route Optimizer</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('PORTFOLIO')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'PORTFOLIO'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Award className="h-4 w-4" />
              <span>Done Work & Portfolio ({portfolioList.length})</span>
            </button>
          </div>

          {/* District Filter Toggle */}
          {activeTab !== 'EARNINGS' && (
            <button
              type="button"
              onClick={() => setDistrictFilterOnly(!districtFilterOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition border shadow-2xs self-start sm:self-auto ${
                districtFilterOnly
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50'
              }`}
            >
              🎯 District Only Filter ({districtFilterOnly ? 'ON' : 'OFF'})
            </button>
          )}
        </div>

        {/* TAB CONTENT 1: APPOINTMENTS LIST */}
        {activeTab !== 'EARNINGS' && activeTab !== 'ROUTE_OPTIMIZER' && (
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300/90 bg-white p-12 sm:p-16 text-center space-y-3 shadow-subtle">
                <div className="h-16 w-16 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
                  <Briefcase className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 font-display">No Appointments Found</h3>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  There are no customer bookings in this status section for {activeProviderName}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover hover:border-emerald-200/80 transition-all duration-200 flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 font-display">
                          {b.id}
                        </span>
                        <span className="font-black text-slate-900 text-xl font-display">${b.amount}.00</span>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-lg font-display">{b.serviceTitle}</h3>

                      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 text-xs font-medium space-y-2">
                        <p className="flex items-center gap-2 font-bold text-slate-800">
                          <User className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Customer: <strong className="text-slate-900 font-extrabold">{b.customerName}</strong> ({b.customerPhone})</span>
                        </p>
                        <p className="flex items-center gap-2 text-slate-600">
                          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{b.customerAddress} ({b.customerLocation})</span>
                        </p>
                        <p className="flex items-center gap-2 text-slate-600">
                          <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="font-bold text-emerald-800">{b.scheduledDate} at {b.scheduledTime}</span>
                        </p>
                      </div>

                      {b.notes && (
                        <p className="text-xs text-slate-600 bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 font-medium">
                          <strong className="text-amber-900 font-extrabold">Notes:</strong> {b.notes}
                        </p>
                      )}

                      {/* Reschedule Proposal Notice */}
                      {b.rescheduleStatus === 'PROPOSED_BY_PROVIDER' && (
                        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>
                              Proposed time change: <strong>{b.proposedTime}</strong> ({b.proposedDate || b.scheduledDate}). Awaiting customer response.
                            </span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 shrink-0">
                            Sent to Customer
                          </span>
                        </div>
                      )}
                      {b.rescheduleStatus === 'ACCEPTED_BY_CUSTOMER' && (
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 flex items-center gap-2 shadow-2xs">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>
                            Customer confirmed your proposed time: <strong>{b.scheduledTime}</strong> on{' '}
                            <strong>{b.scheduledDate}</strong>.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status Actions */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs">
                        <span className="font-bold text-slate-400 block text-[11px] uppercase">Status:</span>
                        <span className="font-extrabold text-slate-900">{b.status}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Change Time / Reschedule Option */}
                        {['PENDING', 'ACCEPTED'].includes(b.status) && (
                          <button
                            type="button"
                            onClick={() => handleOpenReschedule(b)}
                            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                            title="Propose adjusted appointment time"
                          >
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                            <span>Change Time</span>
                          </button>
                        )}
                        {/* Live GPS Broadcast Toggle Button */}
                        {['ACCEPTED', 'IN_PROGRESS'].includes(b.status) && (
                          <button
                            type="button"
                            onClick={() => handleToggleGpsBroadcast(b.id)}
                            className={`px-3.5 py-2 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                              activeBroadcastingBookingId === b.id
                                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                            }`}
                          >
                            <Radio className="h-3.5 w-3.5" />
                            <span>
                              {activeBroadcastingBookingId === b.id
                                ? 'Stop GPS'
                                : 'Share Live GPS'}
                            </span>
                          </button>
                        )}

                        {/* Issue Digital Warranty Button */}
                        {b.status === 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => handleIssueWarranty(b)}
                            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                          >
                            <Award className="h-3.5 w-3.5" />
                            <span>Issue Warranty</span>
                          </button>
                        )}

                        {b.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(b.id, 'ACCEPTED')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm shadow-emerald-600/25 transition"
                          >
                            Accept Request
                          </button>
                        )}
                        {b.status === 'ACCEPTED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(b.id, 'IN_PROGRESS')}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-sm shadow-indigo-600/25 transition"
                          >
                            En Route
                          </button>
                        )}
                        {b.status === 'IN_PROGRESS' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm shadow-emerald-600/25 transition"
                          >
                            Complete Job
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: AI ROUTE OPTIMIZER */}
        {activeTab === 'ROUTE_OPTIMIZER' && (
          <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-card">
            <ProviderRouteOptimizer
              appointments={acceptedBookings}
              providerBaseLocation={{
                lat: profile.latitude || 13.0827,
                lng: profile.longitude || 80.2707,
                label: profile.place ? `${profile.place} Workshop` : 'Base Workshop',
              }}
            />
          </div>
        )}

        {/* TAB CONTENT 2: EARNINGS ANALYTICS & REVIEWS */}
        {activeTab === 'EARNINGS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight font-display">
                  Earnings Analytics & Customer Feedback
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Revenue tracking, completed job counts, and verified customer ratings for {activeProviderName}
                </p>
              </div>
            </div>

            {/* Financial Revenue Summary Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover transition-all duration-200 space-y-1">
                <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider block">Fulfillable Gross Revenue</span>
                <p className="text-3xl font-black text-emerald-700 font-display">${earningsAnalytics.totalEarnings}.00</p>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <span>✓</span> Direct platform earnings
                </span>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover transition-all duration-200 space-y-1">
                <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider block">Completed Jobs Count</span>
                <p className="text-3xl font-black text-slate-900 font-display">{earningsAnalytics.completedJobsCount}</p>
                <span className="text-[11px] text-slate-500 font-medium">Fulfilled customer orders</span>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover transition-all duration-200 space-y-1">
                <span className="text-[11px] text-slate-500 font-extrabold uppercase tracking-wider block">Active Customer Ratings</span>
                <p className="text-3xl font-black text-amber-500 font-display flex items-center gap-1.5">
                  <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                  <span>{earningsAnalytics.reviewsCount} reviews</span>
                </p>
                <span className="text-[11px] text-slate-500 font-medium">Average score: {earningsAnalytics.avgRating}/5</span>
              </div>
            </div>

            {/* Customer Review Feed */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-card space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base font-display">Customer Feedback & Rating Log</h3>
                  <p className="text-xs text-slate-500 font-medium">Verified customer sentiments and comments</p>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {earningsAnalytics.reviews.length} Verified Reviews
                </span>
              </div>

              {earningsAnalytics.reviews.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 font-medium">
                  No customer reviews received yet. Completed bookings with customer ratings will appear here.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {earningsAnalytics.reviews.map((rev) => (
                    <div key={rev.id} className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 text-sm font-bold">{rev.customerName}</strong>
                        <span className="flex items-center gap-1 font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          <span>{rev.rating}/5</span>
                        </span>
                      </div>
                      <p className="text-emerald-700 font-extrabold">{rev.serviceTitle}</p>
                      <p className="text-slate-700 italic leading-relaxed font-medium">"{rev.comment}"</p>
                      <span className="text-[11px] text-slate-400 block pt-1">{rev.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT: DONE WORK & PORTFOLIO SHOWCASE */}
        {activeTab === 'PORTFOLIO' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-card">
              <div>
                <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-extrabold border border-purple-200">
                  Technician Portfolio & Work Showcase
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2 font-display">
                  Upload Done Work & Previous Projects
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Customers view your completed projects before booking. Upload real photos to build trust and win higher-value jobs.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadWorkOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-md shadow-purple-600/25 transition flex items-center gap-2 self-start sm:self-center"
              >
                <Plus className="h-4 w-4" />
                <span>Upload Completed Work</span>
              </button>
            </div>

            {/* Portfolio Grid */}
            {portfolioList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300/90 bg-white p-12 sm:p-16 text-center space-y-4 shadow-subtle">
                <div className="mx-auto w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-2xs">
                  <ImageIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 font-display">No Projects Uploaded Yet</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Show off your craftsmanship! Upload photos of recent repairs, installations, painting, carpentry, or renovations you've successfully completed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadWorkOpen(true)}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-purple-600/20 transition"
                >
                  Upload First Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolioList.map((work) => (
                  <div
                    key={work.id}
                    className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-card hover:shadow-card-hover hover:border-purple-200 transition-all duration-200 flex flex-col group"
                  >
                    <div className="relative h-52 bg-slate-100 overflow-hidden">
                      <img
                        src={work.imageUrl}
                        alt={work.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider">
                        {work.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteWork(work.id)}
                        className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 text-red-600 hover:bg-red-50 transition shadow-sm"
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base font-display">{work.title}</h4>
                        {work.description && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed font-medium">
                            {work.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                        <span>📅 {work.completedDate}</span>
                        <span>📍 {work.customerLocation}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* EDIT PROFILE & SKILLS MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200/90 space-y-5 my-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-2xs">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base font-display">Edit Provider Profile & Skills</h3>
                  <p className="text-xs text-slate-500 font-medium">Update rates, service radius, and specialization skills</p>
                </div>
              </div>
              <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-xl">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Technician Name</label>
                <input
                  type="text"
                  required
                  value={profileEditForm.name || activeProviderName}
                  onChange={(e) => setProfileEditForm({ ...profileEditForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hourly Rate ($/hr)</label>
                  <input
                    type="number"
                    required
                    value={profileEditForm.hourlyRate}
                    onChange={(e) => setProfileEditForm({ ...profileEditForm, hourlyRate: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coverage Radius (km)</label>
                  <input
                    type="number"
                    required
                    value={profileEditForm.serviceRadiusKm}
                    onChange={(e) => setProfileEditForm({ ...profileEditForm, serviceRadiusKm: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Tamil Nadu District & Area */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operating District</label>
                  <select
                    value={profileEditForm.district || profileEditForm.locationId || 'chennai'}
                    onChange={(e) => {
                      const dId = e.target.value;
                      const pls = getPlacesForDistrict(dId);
                      setProfileEditForm({
                        ...profileEditForm,
                        district: dId,
                        locationId: dId,
                        place: pls[0] || 'Central Area',
                      });
                    }}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold bg-white text-slate-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition"
                  >
                    {TAMIL_NADU_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Town / Area</label>
                  <select
                    value={profileEditForm.place || ''}
                    onChange={(e) => setProfileEditForm({ ...profileEditForm, place: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold bg-white text-slate-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition"
                  >
                    {getPlacesForDistrict(profileEditForm.district || profileEditForm.locationId || 'chennai').map((pl) => (
                      <option key={pl} value={pl}>
                        {pl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Workshop / Base Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. No. 45, 1st Cross Street, Near Bus Stand"
                  value={profileEditForm.address || ''}
                  onChange={(e) => setProfileEditForm({ ...profileEditForm, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Postal PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 600017"
                  value={profileEditForm.pincode || ''}
                  onChange={(e) => setProfileEditForm({ ...profileEditForm, pincode: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition"
                />
              </div>

              {/* Skills Tags Manager */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Skills & Specializations</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="Add new skill..."
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-2xs transition"
                  >
                    Add Skill
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {(profileEditForm.skills || []).map((sk, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-700 flex items-center gap-1.5"
                    >
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-sm shadow-emerald-600/25 transition"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD COMPLETED WORK MODAL */}
      {isUploadWorkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 animate-fadeIn">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 font-display">
                    Upload Completed Work
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add photos of finished projects to showcase in your portfolio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadWorkOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompletedWork} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modular Teak Kitchen Cabinets, Living Room Repaint..."
                  value={uploadWorkForm.title}
                  onChange={(e) =>
                    setUploadWorkForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={uploadWorkForm.category}
                    onChange={(e) =>
                      setUploadWorkForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-800 bg-white focus:border-purple-600 focus:outline-none"
                  >
                    <option value="interior-design">🛋️ Interior Design</option>
                    <option value="carpentry">🪚 Carpentry & Furniture</option>
                    <option value="painting">🎨 Painting & Waterproofing</option>
                    <option value="team-services">👥 Team / Group Crew Services</option>
                    <option value="electrical">⚡ Electrical & Wiring</option>
                    <option value="plumbing">🔧 Plumbing & Pipe Fitting</option>
                    <option value="hvac">❄️ AC & HVAC Cooling</option>
                    <option value="cleaning">🧹 Deep Home Cleaning</option>
                    <option value="appliance">🔌 Appliance Repair</option>
                    <option value="general">🛠️ General Handyman</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Completion Date</label>
                  <input
                    type="date"
                    value={uploadWorkForm.completedDate}
                    onChange={(e) =>
                      setUploadWorkForm((prev) => ({ ...prev, completedDate: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-slate-800 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Project Description & Work Process
                </label>
                <textarea
                  rows={2}
                  placeholder="Detail the materials used, methods, customer satisfaction..."
                  value={uploadWorkForm.description}
                  onChange={(e) =>
                    setUploadWorkForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Photo Upload *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />

                {uploadWorkForm.imageUrl && (
                  <div className="mt-2 relative h-36 rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={uploadWorkForm.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-slate-900/70 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                      Image Loaded
                    </span>
                  </div>
                )}

                {/* Craftsmanship Presets */}
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-bold block mb-1">
                    Or select verified craftsmanship preset:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setUploadWorkForm((prev) => ({
                          ...prev,
                          title: 'Modular Teak Wood Kitchen & Profile Lighting',
                          category: 'interior-design',
                          description: 'Custom marine ply cabinetry with premium hydraulic soft-close hinges and acrylic finish.',
                          imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
                        }))
                      }
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-purple-50 text-[10px] font-bold text-slate-700"
                    >
                      🛋️ Modular Kitchen
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setUploadWorkForm((prev) => ({
                          ...prev,
                          title: 'Living Room 3-Coat Royal Emulsion & Damp Seal',
                          category: 'painting',
                          description: 'Putty sanding, moisture barrier primer, and 2 finish coats with geometric accent wall.',
                          imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
                        }))
                      }
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-purple-50 text-[10px] font-bold text-slate-700"
                    >
                      🎨 Wall Painting
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setUploadWorkForm((prev) => ({
                          ...prev,
                          title: 'Concealed 3-Phase MCB Panel & Copper Rewiring',
                          category: 'electrical',
                          description: 'Conduit wiring, earthing rod setup, load balancing, and industrial surge protection.',
                          imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
                        }))
                      }
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-purple-50 text-[10px] font-bold text-slate-700"
                    >
                      ⚡ Electrical Panel
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setUploadWorkForm((prev) => ({
                          ...prev,
                          title: 'Full House Renovation Crew Project',
                          category: 'team-services',
                          description: '4-technician crew completed interior painting, deep kitchen cleaning, and bathroom pipe overhaul.',
                          imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
                        }))
                      }
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-purple-50 text-[10px] font-bold text-slate-700"
                    >
                      👥 Group Crew Project
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadWorkOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingWork}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold shadow-md flex items-center justify-center gap-1.5"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>{isUploadingWork ? 'Publishing...' : 'Publish to Portfolio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE PROPOSAL MODAL */}
      {reschedulingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
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
              </div>

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

    </div>
  );
}