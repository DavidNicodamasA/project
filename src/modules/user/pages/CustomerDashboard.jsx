/**
 * Customer Dashboard View & Service Portal
 * Path: src/modules/user/pages/CustomerDashboard.jsx
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar';
import { useAuth } from '../../../hooks/useAuth';
import dataStore, { LOCATIONS, SERVICE_CATEGORIES } from '../../../services/dataStore';
import {
  TAMIL_NADU_DISTRICTS,
  getDistrictById,
  getPlacesForDistrict,
  formatFullAddress,
} from '../../../data/tamilNaduLocations';
import CustomerAIChatBot from '../components/CustomerAIChatBot';
import ImageProblemDetector from '../components/ImageProblemDetector';
import LiveTrackingMap from '../components/LiveTrackingMap';
import MaintenanceSubscriptions from '../components/MaintenanceSubscriptions';
import DigitalWarrantyCertificate from '../components/DigitalWarrantyCertificate';
import axios from 'axios';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  X,
  Phone,
  ArrowRight,
  SlidersHorizontal,
  Send,
  AlertCircle,
  User,
  Edit3,
  Check,
  Compass,
  Zap,
  Receipt,
  FileText,
  Printer,
  DollarSign,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Camera,
  Navigation,
  Award,
  ChevronDown,
} from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Customer Profile State
  const [customerProfile, setCustomerProfile] = useState(() => dataStore.getCustomerProfile());
  const [isEditingCustomerProfile, setIsEditingCustomerProfile] = useState(false);
  const [customerProfileForm, setCustomerProfileForm] = useState({ ...customerProfile });
  const [customProfileDistrictInput, setCustomProfileDistrictInput] = useState(
    customerProfile.customLocation || ''
  );

  // Sync profile name with logged in user name
  const activeCustomerName = user?.name || customerProfile.name || 'Customer';

  // Location & Service filtering state
  const [selectedLocation, setSelectedLocation] = useState(customerProfile.locationId || 'chennai');
  const [customLocationText, setCustomLocationText] = useState(customerProfile.customLocation || '');
  const [maxDistance, setMaxDistance] = useState(50);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [providers, setProviders] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my_bookings' | 'invoices'
  const [notificationToast, setNotificationToast] = useState('');

  // Interactive Modals state
  const [viewingProviderDetails, setViewingProviderDetails] = useState(null);
  const [zoomedWorkImage, setZoomedWorkImage] = useState(null);
  const [ratingBooking, setRatingBooking] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handleRespondReschedule = (bookingId, accept) => {
    const updated = dataStore.respondBookingTime(bookingId, accept);
    if (accept) {
      setNotificationToast(`✅ Appointment time confirmed for ${updated.scheduledTime}!`);
    } else {
      setNotificationToast(`Preserved original appointment time (${updated.scheduledTime}).`);
    }
    loadData();
    setTimeout(() => setNotificationToast(''), 4500);
  };

  // Predictive Maintenance state
  const [appliances, setAppliances] = useState([]);

  // AI Price Estimator state
  const [isPriceEstimatorOpen, setIsPriceEstimatorOpen] = useState(false);
  const [priceEstimateParams, setPriceEstimateParams] = useState({
    category: 'plumbing',
    complexity: 'standard',
    isEmergency: false,
    distanceKm: 3.5,
  });
  const [priceEstimateResult, setPriceEstimateResult] = useState(null);
  const [isCalculatingEstimate, setIsCalculatingEstimate] = useState(false);

  // Live Payment Modal state
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Booking Modal state
  const [selectedProviderForBooking, setSelectedProviderForBooking] = useState(null);
  const [bookingSuccessAlert, setBookingSuccessAlert] = useState(null);
  const [bookingFormData, setBookingFormData] = useState({
    serviceTitle: '',
    customerAddress: customerProfile.address || 'No. 12, Panagal Park Road, T. Nagar, Chennai',
    customerPhone: customerProfile.phone || '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '10:30 AM',
    notes: '',
    isEmergency: false,
  });

  // Advanced AI Features states
  const [isImageProblemDetectorOpen, setIsImageProblemDetectorOpen] = useState(false);
  const [liveTrackingBookingId, setLiveTrackingBookingId] = useState(null);
  const [activeWarrantyModal, setActiveWarrantyModal] = useState(null);

  const handleOpenWarranty = async (booking) => {
    try {
      // First try fetching existing warranty
      let res = await axios.get(`/api/v1/warranties/${booking.id}`).catch(() => null);
      if (res?.data?.success && res.data.data) {
        setActiveWarrantyModal(res.data.data);
      } else {
        // Automatically issue 90-day warranty if completed
        const issueRes = await axios.post('/api/v1/warranties/issue', {
          bookingId: booking.id,
          customerId: booking.customerId || user?.id || 'cust-user',
          customerName: booking.customerName || user?.name || 'Customer',
          customerEmail: booking.customerEmail || user?.email || '',
          providerId: booking.providerId,
          providerName: booking.providerName,
          serviceCategory: booking.category || 'general',
          serviceTitle: booking.serviceTitle,
          durationDays: 90,
        });
        if (issueRes?.data?.success) {
          setActiveWarrantyModal(issueRes.data.data);
        }
      }
    } catch (err) {
      console.warn('Warranty fetch error:', err.message);
      // Fallback local warranty object for instant view
      setActiveWarrantyModal({
        warrantyId: `WAR-2026-${booking.id.replace('BK-', '')}`,
        bookingId: booking.id,
        customerName: booking.customerName || user?.name || 'Customer',
        providerName: booking.providerName,
        serviceCategory: booking.category,
        serviceTitle: booking.serviceTitle,
        startDate: booking.scheduledDate,
        expiryDate: new Date(Date.now() + 90 * 86400000).toISOString(),
        durationDays: 90,
        terms: [
          '100% Workmanship Guarantee: Free re-inspection and corrective repairs for the exact serviced issue.',
          'Installed replacement parts carry certified manufacturer coverage.',
          '24/7 Priority claims response via HandyPro Customer Support.',
        ],
      });
    }
  };

  const handleCancelBooking = (bookingId) => {
    dataStore.cancelBooking(bookingId, 'Cancelled by customer from dashboard');
    setNotificationToast('Booking request cancelled successfully.');
    setTimeout(() => setNotificationToast(''), 4000);
  };

  const handleOpenReviewModal = (booking) => {
    setRatingBooking(booking);
    setReviewForm({ rating: 5, comment: '' });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!ratingBooking) return;
    const res = await dataStore.submitReviewWithAI(ratingBooking.id, reviewForm.rating, reviewForm.comment);
    setRatingBooking(null);
    if (res?.sentiment) {
      setNotificationToast(`Feedback saved! AI Sentiment: ${res.sentiment.sentiment} (${Math.round(res.sentiment.score * 100)}%) • Detected aspects: ${res.sentiment.aspects?.join(', ')}`);
    } else {
      setNotificationToast('Thank you! Your feedback and rating have been recorded.');
    }
    setTimeout(() => setNotificationToast(''), 5000);
    loadData();
  };

  const handleOpenPriceEstimator = (category = 'plumbing', distanceKm = 3.5) => {
    setPriceEstimateParams((prev) => ({
      ...prev,
      category,
      distanceKm: Number(distanceKm) || 3.5,
    }));
    setIsPriceEstimatorOpen(true);
    triggerPriceCalculation(category, priceEstimateParams.complexity, priceEstimateParams.isEmergency, distanceKm);
  };

  const triggerPriceCalculation = async (cat, complexity, isEmergency, dist) => {
    setIsCalculatingEstimate(true);
    try {
      const res = await dataStore.estimatePrice({
        category: cat,
        complexity,
        isEmergency,
        distanceKm: Number(dist) || 3.5,
      });
      setPriceEstimateResult(res);
    } finally {
      setIsCalculatingEstimate(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!paymentBooking) return;
    setIsProcessingPayment(true);
    try {
      const res = await dataStore.processPayment(paymentBooking.id, selectedPaymentMethod);
      setPaymentBooking(null);
      setNotificationToast(`Payment completed successfully! Digital invoice issued.`);
      setTimeout(() => setNotificationToast(''), 4000);
      loadData();
    } catch (e) {
      alert('Payment processing failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Load and subscribe to live store updates
  useEffect(() => {
    dataStore.syncProvidersFromApi();
    loadData();
    const unsubscribe = dataStore.subscribe(() => {
      loadData();
    });

    const handlePortfolioUpdated = (e) => {
      loadData();
      if (viewingProviderDetails && e.detail?.providerId === viewingProviderDetails.id) {
        const fresh = dataStore.getProviderById(viewingProviderDetails.id);
        if (fresh) setViewingProviderDetails(fresh);
      }
    };
    window.addEventListener('handypro_portfolio_updated', handlePortfolioUpdated);

    return () => {
      unsubscribe();
      window.removeEventListener('handypro_portfolio_updated', handlePortfolioUpdated);
    };
  }, [selectedLocation, customLocationText, selectedCategory, searchQuery, maxDistance]);

  const loadData = async () => {
    const list = dataStore.getProviders({
      location: selectedLocation,
      customLocationName: selectedLocation === 'other' ? customLocationText : '',
      category: selectedCategory,
      searchQuery,
      maxDistance,
    });
    setProviders(list);

    const allBookings = dataStore.getBookings();
    setMyBookings(allBookings);

    const prof = dataStore.getCustomerProfile();
    setCustomerProfile(prof);

    // Load predictive maintenance appliances
    const apps = await dataStore.getAppliances(prof?.id || user?.id);
    setAppliances(apps || []);
  };

  const selectedLocationObj = useMemo(() => {
    return LOCATIONS.find((l) => l.id === selectedLocation) || LOCATIONS[0];
  }, [selectedLocation]);

  const currentActiveLocationDisplay = useMemo(() => {
    if (selectedLocation === 'other' && customLocationText.trim()) {
      return customLocationText.trim();
    }
    return selectedLocationObj.name;
  }, [selectedLocation, customLocationText, selectedLocationObj]);

  // Customer Invoices & Expense Summary
  const invoiceData = useMemo(() => {
    return dataStore.getCustomerInvoices(activeCustomerName);
  }, [myBookings, activeCustomerName]);

  const handleOpenCustomerProfileModal = () => {
    setCustomerProfileForm({ ...customerProfile, name: activeCustomerName });
    setCustomProfileDistrictInput(customerProfile.customLocation || '');
    setIsEditingCustomerProfile(true);
  };

  const handleSaveCustomerProfile = (e) => {
    e.preventDefault();
    const districtObj = getDistrictById(customerProfileForm.district || customerProfileForm.locationId || 'chennai');
    const updated = dataStore.updateCustomerProfile({
      ...customerProfileForm,
      state: 'Tamil Nadu',
      district: districtObj.name,
      place: customerProfileForm.place || 'Central',
      locationId: districtObj.id,
      locationName: `${districtObj.name} (${customerProfileForm.place || 'Central'})`,
      address: customerProfileForm.address || '',
      pincode: customerProfileForm.pincode || '',
      customLocation: customerProfileForm.locationId === 'other' ? customProfileDistrictInput : '',
    });
    setCustomerProfile(updated);
    if (updated.locationId) {
      setSelectedLocation(updated.locationId);
    }
    setIsEditingCustomerProfile(false);
    setNotificationToast('Customer profile & address updated successfully.');
    setTimeout(() => setNotificationToast(''), 4000);
  };

  // Handle Booking Modal Open
  const handleOpenBookingModal = (provider) => {
    setSelectedProviderForBooking(provider);
    setBookingFormData({
      serviceTitle: `${provider.categoryLabel} Appointment`,
      customerAddress: customerProfile.address || 'Apartment 8C, Westview Residences, Downtown',
      customerPhone: customerProfile.phone || '+1 (555) 987-6543',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '10:30 AM',
      notes: '',
      isEmergency: false,
    });
  };

  // Submit New Booking
  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!selectedProviderForBooking) return;

    const newBooking = dataStore.createBooking({
      customerId: user?.id || 'cust-demo-1',
      customerName: activeCustomerName,
      customerPhone: bookingFormData.customerPhone,
      customerAddress: bookingFormData.customerAddress,
      customerLocation: currentActiveLocationDisplay,
      providerId: selectedProviderForBooking.id,
      providerName: selectedProviderForBooking.name,
      serviceTitle: bookingFormData.serviceTitle,
      category: selectedProviderForBooking.category,
      scheduledDate: bookingFormData.scheduledDate,
      scheduledTime: bookingFormData.scheduledTime,
      notes: bookingFormData.notes,
      amount: selectedProviderForBooking.hourlyRate + (bookingFormData.isEmergency ? 25 : 0),
      isEmergency: bookingFormData.isEmergency,
    });

    setSelectedProviderForBooking(null);
    setBookingSuccessAlert(newBooking);
    setActiveTab('my_bookings');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 pb-20">
      <Navbar onOpenCustomerProfile={handleOpenCustomerProfileModal} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header Card */}
        <div className="relative rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-card overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/50 via-indigo-50/30 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/80 shadow-2xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  <span>Customer Portal</span>
                </span>
                <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200/60">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  <span>{currentActiveLocationDisplay}</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
                Welcome back, {activeCustomerName}
              </h1>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Connect with verified local technicians near you, get instant AI problem diagnosis, and track live repairs in real-time.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 p-2 sm:p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 backdrop-blur-xs">
              <div className="text-center px-2 sm:px-4 py-2">
                <p className="text-2xl sm:text-3xl font-black text-slate-900 font-display">{providers.length}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Online Techs</p>
              </div>
              <div className="text-center px-2 sm:px-4 py-2 border-x border-slate-200/80">
                <p className="text-2xl sm:text-3xl font-black text-blue-600 font-display">{myBookings.length}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">My Bookings</p>
              </div>
              <div className="text-center px-2 sm:px-4 py-2">
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 font-display">${invoiceData.totalSpent}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Total Spent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'browse'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Find Service Providers</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my_bookings')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'my_bookings'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>My Bookings ({myBookings.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('appliances')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'appliances'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Predictive Maintenance ({appliances.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'invoices'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>Invoices & Receipts</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Image Problem Detector Button */}
            <button
              type="button"
              onClick={() => setIsImageProblemDetectorOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <Camera className="h-4 w-4" />
              <span>AI Photo Diagnosis</span>
            </button>

            {/* Quick AI Price Estimator Trigger */}
            <button
              type="button"
              onClick={() => handleOpenPriceEstimator('plumbing', 3.5)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Price Estimator</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {notificationToast && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs font-bold text-blue-900 flex items-center justify-between">
            <span>{notificationToast}</span>
            <button onClick={() => setNotificationToast('')} className="text-blue-500 hover:text-blue-800">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* TAB 1: BROWSE SERVICE PROVIDERS */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            
            {/* Search & Location Filter Box with Service Dropdown */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-card space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1.1fr_220px_160px] gap-4 items-end">
                {/* Search Service Dropdown with ALL services */}
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5 text-blue-600" />
                      <span>Service Search Dropdown</span>
                    </span>
                    <span className="text-[10px] text-blue-600 bg-blue-50/80 px-2.5 py-0.5 rounded-full font-bold border border-blue-200/60">
                      All Home Services
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full rounded-xl border border-blue-200/90 bg-blue-50/30 px-3.5 py-2.5 text-xs font-black text-slate-800 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none appearance-none cursor-pointer pr-9 shadow-2xs transition-all"
                    >
                      <option value="all">✨ All Services (Browse All Home Specialists)</option>
                      
                      <optgroup label="🛋️ Interior Design & Modular Architecture">
                        <option value="interior-design">🛋️ Interior Design & Modular Kitchen</option>
                        <option value="interior-design">📐 3D Room Planning, False Ceiling & Decor</option>
                      </optgroup>

                      <optgroup label="🪚 Carpentry & Custom Furniture">
                        <option value="carpentry">🪚 Carpentry & Wooden Furniture Making</option>
                        <option value="carpentry">🚪 Door, Lock, Hinge & Window Fitting</option>
                        <option value="carpentry">🪑 Cupboards, Wardrobes & Wood Polishing</option>
                      </optgroup>

                      <optgroup label="🎨 Painting & Waterproofing">
                        <option value="painting">🎨 Painting (Single Specialist & Wall Repainting)</option>
                        <option value="painting">🏡 Full House Painting & Damp Proofing</option>
                        <option value="team-services">👥 Painting Crew (Group of People / Multi-Painter Team)</option>
                      </optgroup>

                      <optgroup label="👥 Group of People / Team Crew Services">
                        <option value="team-services">👥 Multi-Painter Squad (Full House Painting)</option>
                        <option value="team-services">🧹 Deep House Cleaning Crew (3-5 Workers Team)</option>
                        <option value="team-services">📦 Packers, Movers & Shifting Crew</option>
                        <option value="team-services">🛠️ Renovation & Structural Demolition Crew</option>
                      </optgroup>

                      <optgroup label="⚡ Electrical & Power Systems">
                        <option value="electrical">⚡ Electrical Wiring, MCB & Switchboards</option>
                        <option value="solar-inverter">🔋 Solar Panels & Inverter Battery Setup</option>
                        <option value="cctv-security">📹 CCTV Camera & Smart Security Locks</option>
                      </optgroup>

                      <optgroup label="🔧 Plumbing & Water Infrastructure">
                        <option value="plumbing">🔧 Plumbing, Pipe Leakage & Water Heaters</option>
                        <option value="water-purifier">💧 Water Purifier, RO Membrane & Service</option>
                      </optgroup>

                      <optgroup label="❄️ Cooling & Appliances">
                        <option value="hvac">❄️ AC Servicing, Gas Refill & Cooling Fix</option>
                        <option value="appliance">🔌 Washing Machine, Fridge & Microwave</option>
                      </optgroup>

                      <optgroup label="🌿 Environment & Maintenance">
                        <option value="pest-control">🐜 Pest Control & Fumigation</option>
                        <option value="gardening">🌱 Lawn Care, Landscaping & Tree Pruning</option>
                        <option value="handyman">🛠️ General Handyman & Drill Works</option>
                      </optgroup>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Free Text / Name Search */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Filter by Keyword or Technician
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Paint crew, interior, David, pipe leak..."
                      className="w-full rounded-xl border border-slate-300/80 bg-white pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-2xs transition-all"
                    />
                  </div>
                </div>

                {/* Location Select */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Tamil Nadu District
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300/80 px-3.5 py-2.5 text-xs font-bold text-slate-800 bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:outline-none shadow-2xs transition-all cursor-pointer"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        📍 {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Distance Slider */}
                <div className="flex flex-col justify-center px-1">
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
                    <span>Radius</span>
                    <span className="text-blue-600 font-extrabold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">{maxDistance} km</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(Number(e.target.value))}
                    className="h-2 w-full bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              {/* Custom District Input if "other" is selected */}
              {selectedLocation === 'other' && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-700">Custom Operating District:</label>
                  <input
                    type="text"
                    value={customLocationText}
                    onChange={(e) => setCustomLocationText(e.target.value)}
                    placeholder="Type custom location (e.g. Harrington Road)"
                    className="max-w-md rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium focus:border-blue-600 focus:outline-none"
                  />
                </div>
              )}

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                {SERVICE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                        : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Provider Grid Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 font-display tracking-tight">
                  Available Online Technicians ({providers.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Showing active verified service providers ready for dispatch in {currentActiveLocationDisplay}
                </p>
              </div>
            </div>

            {/* Provider Cards Directory */}
            {providers.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3 shadow-subtle">
                <AlertCircle className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 font-display">No Online Technicians Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  There are no service providers currently online matching your search filters or location radius. Try increasing the radius or resetting filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-subtle hover:shadow-card-hover hover:border-blue-300 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between space-y-4 group"
                  >
                    <div>
                      {/* Provider Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-12 w-12 rounded-2xl ${p.avatarBg || 'bg-gradient-to-tr from-blue-600 to-indigo-600'} text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform`}
                          >
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-base leading-tight font-display group-hover:text-blue-600 transition-colors">
                              {p.name}
                            </h3>
                            <span className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-0.5">
                              <span>{p.categoryLabel}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500 font-medium">{p.experienceYears || 5}+ yrs</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Online</span>
                          </span>
                        </div>
                      </div>

                      {/* AI Match Score Badge & Emergency Indicator */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-[11px] shadow-xs">
                          <Sparkles className="h-3 w-3" />
                          <span>{p.aiMatchScore || 96}% AI Match</span>
                        </span>
                        {p.supportsEmergency && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px] font-extrabold border border-red-200">
                            🚨 24/7 SOS
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-extrabold border border-blue-200">
                          ✓ Verified Pro
                        </span>
                      </div>

                      {/* Match Reasons Pills */}
                      {p.matchReasons && p.matchReasons.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          {p.matchReasons.slice(0, 2).map((r, rIdx) => (
                            <span key={rIdx} className="px-2 py-0.5 rounded-md bg-indigo-50/80 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed font-medium">
                        {p.bio}
                      </p>

                      {/* Location & Details */}
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-semibold text-slate-800 truncate max-w-[180px]">
                            <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            <span>{p.place ? `${p.place}, ${p.district || p.locationName}` : p.locationName}</span>
                          </span>
                          <span className="font-bold text-slate-700 bg-slate-100/80 px-2.5 py-0.5 rounded-full text-[11px] border border-slate-200/60">
                            ~{p.calculatedDistanceMiles.toFixed(1)} km away
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-medium">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            <strong className="text-slate-900 font-extrabold">{p.rating}</strong> ({p.reviewsCount} reviews)
                          </span>
                          <span className="font-black text-slate-900 text-sm">
                            <span className="text-blue-600 text-base font-black">${p.hourlyRate}</span>/hr
                          </span>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {p.skills.slice(0, 3).map((sk, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-600 border border-slate-200/40">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3.5 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPriceEstimator(p.category, p.calculatedDistanceKm || 3.5)}
                        className="px-2.5 py-2 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold transition flex items-center justify-center gap-1 border border-indigo-200/70"
                        title="AI Dynamic Price Estimator"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>AI Price</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewingProviderDetails(p)}
                        className="flex-1 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-extrabold transition text-center"
                      >
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenBookingModal(p)}
                        className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition shadow-sm shadow-blue-600/25 flex items-center justify-center gap-1"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Book</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY BOOKINGS */}
        {activeTab === 'my_bookings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight font-display">
                  Service Appointment Activity
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Track pending requests, accepted appointments, and past completed services in real time.
                </p>
              </div>
            </div>

            {myBookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300/90 bg-white p-12 sm:p-16 text-center space-y-4 shadow-subtle">
                <div className="h-16 w-16 mx-auto rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <div className="max-w-sm mx-auto space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 font-display">No Bookings Yet</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    You haven't scheduled any service appointments. Select a technician from the directory to book.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('browse')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/25 transition"
                >
                  Browse Service Providers
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {myBookings.map((b) => {
                  const stepIndex =
                    b.status === 'COMPLETED'
                      ? 4
                      : b.status === 'IN_PROGRESS'
                      ? 3
                      : b.status === 'ACCEPTED'
                      ? 2
                      : b.status === 'CANCELLED'
                      ? 0
                      : 1;

                  const isPaid = b.payment?.status === 'PAID';

                  return (
                    <div
                      key={b.id}
                      className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 shadow-card hover:shadow-card-hover hover:border-blue-200/80 transition-all duration-200 space-y-5"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        <div className="space-y-2.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80 font-display shadow-2xs">
                              {b.id}
                            </span>
                            {b.isEmergency && (
                              <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 text-xs font-black flex items-center gap-1.5 animate-pulse">
                                🚨 24/7 Emergency Dispatch
                              </span>
                            )}
                            {b.status === 'PENDING' && (
                              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-bold flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>Pending Provider Acceptance</span>
                              </span>
                            )}
                            {b.status === 'ACCEPTED' && (
                              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200/80 text-xs font-bold flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                <span>Accepted & Scheduled</span>
                              </span>
                            )}
                            {b.status === 'IN_PROGRESS' && (
                              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200/80 text-xs font-bold flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                                <span>Technician En Route / Working</span>
                              </span>
                            )}
                            {b.status === 'COMPLETED' && (
                              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                <span>Job Completed</span>
                              </span>
                            )}
                            {b.status === 'CANCELLED' && (
                              <span className="px-3 py-1 rounded-full bg-red-50 text-red-800 border border-red-200 text-xs font-bold">
                                ❌ Cancelled
                              </span>
                            )}
                            {isPaid ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                                💳 Paid
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200/60">
                                Unpaid
                              </span>
                            )}
                          </div>

                          <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl font-display">
                            {b.serviceTitle}
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 font-medium bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
                            <p className="flex items-center gap-1.5">
                              <span className="text-slate-400 font-bold">Specialist:</span>
                              <strong className="text-slate-900 font-bold">{b.providerName}</strong>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <span className="text-slate-400 font-bold">Scheduled:</span>
                              <span className="font-bold text-blue-700">{b.scheduledDate} at {b.scheduledTime}</span>
                            </p>
                            <p className="sm:col-span-2 flex items-center gap-1.5 text-slate-500">
                              <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                              <span>{b.customerAddress} ({b.customerLocation})</span>
                            </p>
                          </div>

                          {/* Provider Propose Reschedule Prompt */}
                          {b.rescheduleStatus === 'PROPOSED_BY_PROVIDER' && (
                            <div className="mt-3 rounded-2xl bg-amber-50/90 border border-amber-300 p-4 sm:p-5 space-y-3 shadow-xs animate-fadeIn">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-5 w-5 text-amber-600 animate-pulse" />
                                  <span className="font-extrabold text-amber-950 text-xs sm:text-sm">
                                    ⏱️ Provider Requested a Time Change
                                  </span>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] uppercase tracking-wide">
                                  Response Needed
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white/90 p-3 rounded-xl border border-amber-200">
                                <div>
                                  <span className="text-slate-500 font-bold block text-[11px]">Original Slot:</span>
                                  <span className="text-slate-500 font-bold line-through">
                                    {b.scheduledDate} at {b.scheduledTime}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-amber-800 font-bold block text-[11px]">Proposed New Slot:</span>
                                  <span className="text-amber-900 font-black text-sm">
                                    📅 {b.proposedDate || b.scheduledDate} at 🕒 {b.proposedTime}
                                  </span>
                                </div>
                              </div>

                              {b.rescheduleReason && (
                                <p className="text-xs text-amber-900 italic bg-amber-100/60 p-2.5 rounded-xl border border-amber-200/60">
                                  <strong>Technician Note:</strong> "{b.rescheduleReason}"
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleRespondReschedule(b.id, true)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                                >
                                  <Check className="h-4 w-4" />
                                  <span>Accept New Time ({b.proposedTime})</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRespondReschedule(b.id, false)}
                                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                                >
                                  <X className="h-4 w-4" />
                                  <span>Keep Original Time ({b.scheduledTime})</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 border-t lg:border-t-0 pt-4 lg:pt-0">
                          <div className="text-left lg:text-right">
                            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-display">${b.amount}.00</span>
                            <span className="text-[11px] text-slate-400 block font-semibold">Total Price</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2">
                            {!isPaid && b.status !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentBooking(b);
                                  setSelectedPaymentMethod('card');
                                }}
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-sm shadow-emerald-600/25 flex items-center gap-1.5 transition"
                              >
                                <DollarSign className="h-4 w-4" />
                                <span>Pay Now</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const inv = invoiceData.invoices.find((i) => i.bookingId === b.id) || {
                                  invoiceNumber: `INV-2026-${b.id.replace('BK-', '')}`,
                                  bookingId: b.id,
                                  serviceTitle: b.serviceTitle,
                                  category: b.category,
                                  providerName: b.providerName,
                                  customerName: b.customerName,
                                  scheduledDate: b.scheduledDate,
                                  status: b.status,
                                  totalAmount: b.amount,
                                  baseFee: Math.round(b.amount * 0.85),
                                  serviceTax: Math.round(b.amount * 0.10),
                                  platformFee: b.amount - Math.round(b.amount * 0.85) - Math.round(b.amount * 0.10),
                                  paymentStatus: isPaid ? 'PAID' : 'PENDING',
                                  paymentMethod: b.payment?.method || 'card',
                                  transactionId: b.payment?.transactionId || 'TXN-PENDING',
                                  issuedDate: b.scheduledDate,
                                };
                                setSelectedInvoice(inv);
                              }}
                              className="px-3.5 py-2.5 rounded-xl border border-slate-200/90 hover:bg-slate-50 text-slate-700 text-xs font-extrabold transition flex items-center gap-1.5 shadow-2xs"
                            >
                              <Receipt className="h-3.5 w-3.5 text-slate-500" />
                              <span>Digital Invoice</span>
                            </button>

                            {b.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => handleCancelBooking(b.id)}
                                className="px-3.5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-extrabold transition"
                              >
                                Cancel
                              </button>
                            )}

                            {b.status === 'COMPLETED' && !b.userRating && (
                              <button
                                type="button"
                                onClick={() => handleOpenReviewModal(b)}
                                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold transition shadow-sm flex items-center gap-1.5"
                              >
                                <Star className="h-3.5 w-3.5 fill-white" />
                                <span>Rate & AI Review</span>
                              </button>
                            )}

                            {/* Live GPS Dispatch Tracking Button */}
                            {['ACCEPTED', 'IN_PROGRESS'].includes(b.status) && (
                              <button
                                type="button"
                                onClick={() => setLiveTrackingBookingId(b.id)}
                                className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/25 transition flex items-center gap-1.5"
                              >
                                <Navigation className="h-3.5 w-3.5 animate-pulse" />
                                <span>Live GPS Tracking</span>
                              </button>
                            )}

                            {/* Digital Service Warranty Certificate Button */}
                            {b.status === 'COMPLETED' && (
                              <button
                                type="button"
                                onClick={() => handleOpenWarranty(b)}
                                className="px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold transition flex items-center gap-1.5"
                              >
                                <Award className="h-3.5 w-3.5 text-indigo-600" />
                                <span>Digital Warranty</span>
                              </button>
                            )}

                            {b.userRating && (
                              <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <span>⭐ {b.userRating}/5</span>
                                {b.reviewSentiment?.label && (
                                  <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded-md font-black border border-emerald-200 ml-1">
                                    {b.reviewSentiment.label}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* LIVE STEPPING STATUS TRACKER */}
                      {b.status !== 'CANCELLED' && (
                        <div className="pt-4 border-t border-slate-100">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-blue-600" />
                            <span>Live Service Tracking Progress</span>
                          </div>

                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div className={`p-2.5 rounded-2xl border transition ${stepIndex >= 1 ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-extrabold shadow-2xs' : 'bg-slate-50 border-slate-200/60 text-slate-400'}`}>
                              <div className="text-sm font-black mb-0.5">{stepIndex >= 1 ? '✓' : '1'}</div>
                              <div className="text-[11px] font-bold">Requested</div>
                            </div>
                            <div className={`p-2.5 rounded-2xl border transition ${stepIndex >= 2 ? 'bg-blue-50/80 border-blue-200 text-blue-900 font-extrabold shadow-2xs' : 'bg-slate-50 border-slate-200/60 text-slate-400'}`}>
                              <div className="text-sm font-black mb-0.5">{stepIndex >= 2 ? '✓' : '2'}</div>
                              <div className="text-[11px] font-bold">Accepted</div>
                            </div>
                            <div className={`p-2.5 rounded-2xl border transition ${stepIndex >= 3 ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 font-extrabold shadow-2xs' : 'bg-slate-50 border-slate-200/60 text-slate-400'}`}>
                              <div className="text-sm font-black mb-0.5">{stepIndex >= 3 ? '✓' : '3'}</div>
                              <div className="text-[11px] font-bold">In Progress</div>
                            </div>
                            <div className={`p-2.5 rounded-2xl border transition ${stepIndex >= 4 ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 font-extrabold shadow-2xs' : 'bg-slate-50 border-slate-200/60 text-slate-400'}`}>
                              <div className="text-sm font-black mb-0.5">{stepIndex >= 4 ? '✓' : '4'}</div>
                              <div className="text-[11px] font-bold">Completed</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXPENSE & INVOICING HUB */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight font-display">
                  Customer Expense & Invoicing Hub
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Itemized receipts and financial breakdown for completed home services
                </p>
              </div>
            </div>

            {/* Invoicing Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover transition-all duration-200 space-y-1">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total Lifetime Expenditure</span>
                <p className="text-3xl font-black text-slate-900 font-display">${invoiceData.totalSpent}.00</p>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <span>✓</span> Calculated from completed jobs
                </span>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover transition-all duration-200 space-y-1">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Completed Service Invoices</span>
                <p className="text-3xl font-black text-blue-600 font-display">{invoiceData.completedCount}</p>
                <span className="text-[11px] text-slate-500 font-medium">Paid and fulfilled</span>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-card hover:shadow-card-hover transition-all duration-200 space-y-1">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Active Appointments</span>
                <p className="text-3xl font-black text-indigo-600 font-display">{invoiceData.activeCount}</p>
                <span className="text-[11px] text-slate-500 font-medium">Pending & in progress</span>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-card overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base font-display">Receipts & Transactions</h3>
                  <p className="text-xs text-slate-500 font-medium">Track your service payment history and receipts</p>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Total: {invoiceData.invoices.length} entries
                </span>
              </div>

              {invoiceData.invoices.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 font-medium">
                  No invoices available yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-medium text-slate-700">
                    <thead className="bg-slate-50/80 text-slate-900 font-extrabold border-b border-slate-200/80 uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Invoice No</th>
                        <th className="px-6 py-4">Service Details</th>
                        <th className="px-6 py-4">Provider</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoiceData.invoices.map((inv) => (
                        <tr key={inv.invoiceNumber} className="hover:bg-slate-50/70 transition">
                          <td className="px-6 py-4 font-bold text-slate-900 font-display">{inv.invoiceNumber}</td>
                          <td className="px-6 py-4 font-bold text-blue-700">{inv.serviceTitle}</td>
                          <td className="px-6 py-4 text-slate-800 font-medium">{inv.providerName}</td>
                          <td className="px-6 py-4 text-slate-500">{inv.issuedDate}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              inv.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-black text-slate-900 text-sm font-display">${inv.totalAmount}.00</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(inv)}
                              className="px-3.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-800 text-xs font-extrabold rounded-xl border border-slate-200/80 transition"
                            >
                              View Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PREDICTIVE APPLIANCE MAINTENANCE */}
        {activeTab === 'appliances' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs uppercase tracking-wider mb-1">
                  <Sparkles className="h-4 w-4" />
                  <span>AI Predictive Health & RUL Monitoring</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 font-display">
                  Home Appliance Health & Maintenance Forecast
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Continuous AI health tracking based on runtime wear, age, and service history to prevent catastrophic breakdowns.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenPriceEstimator('hvac', 3.5)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-500/20 transition self-start sm:self-auto"
              >
                <Sparkles className="h-4 w-4" />
                <span>Estimate Tune-Up Cost</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {appliances.map((app) => {
                const isDue = app.status === 'MAINTENANCE_DUE' || app.healthScore <= 75;
                const healthColor =
                  app.healthScore >= 85
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                    : app.healthScore >= 65
                    ? 'text-amber-600 bg-amber-50 border-amber-200'
                    : 'text-red-600 bg-red-50 border-red-200';

                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {app.category.toUpperCase()} • {app.brand || 'HOME APPLIANCE'}
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-base leading-tight mt-0.5">
                            {app.name}
                          </h3>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black border ${healthColor}`}
                        >
                          {app.healthScore}% Health
                        </span>
                      </div>

                      {/* Health Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                          <span>Appliance Health Score</span>
                          <span>{app.status}</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              app.healthScore >= 85
                                ? 'bg-emerald-500'
                                : app.healthScore >= 65
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${app.healthScore}%` }}
                          />
                        </div>
                      </div>

                      {/* AI Diagnostic Prediction */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <AlertTriangle className={`h-3.5 w-3.5 ${isDue ? 'text-amber-600' : 'text-slate-400'}`} />
                          <span>AI Predictive Diagnostics:</span>
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">
                          {app.recommendationAction || 'Standard preventative inspection recommended.'}
                        </p>
                        {app.predictedIssues?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {app.predictedIssues.map((issue, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-700">
                                ⚠ {issue}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(app.category === 'water_purifier' ? 'plumbing' : app.category);
                          setActiveTab('browse');
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Schedule Tune-Up</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: HOME PROTECTION & MAINTENANCE SUBSCRIPTIONS */}
      </main>

      {/* AI IMAGE PROBLEM DETECTOR MODAL */}
      {isImageProblemDetectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-auto">
            <ImageProblemDetector
              onClose={() => setIsImageProblemDetectorOpen(false)}
              onSelectServiceCategory={(cat) => {
                setSelectedCategory(cat);
                setActiveTab('browse');
                setIsImageProblemDetectorOpen(false);
              }}
              onBookSpecialist={(result) => {
                setSelectedCategory(result.predictedCategory);
                setActiveTab('browse');
                setIsImageProblemDetectorOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* LIVE TECHNICIAN GPS TRACKING MODAL */}
      {liveTrackingBookingId && (
        <LiveTrackingMap
          bookingId={liveTrackingBookingId}
          onClose={() => setLiveTrackingBookingId(null)}
        />
      )}

      {/* DIGITAL SERVICE WARRANTY CERTIFICATE MODAL */}
      {activeWarrantyModal && (
        <DigitalWarrantyCertificate
          warranty={activeWarrantyModal}
          onClose={() => setActiveWarrantyModal(null)}
          onClaimSuccess={(claimData) => {
            if (claimData.revisitBooking) {
              setMyBookings((prev) => [claimData.revisitBooking, ...prev]);
            }
          }}
        />
      )}

      {/* AI PRICE ESTIMATOR MODAL */}
      {isPriceEstimatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg font-display">AI Service Price Estimator</h3>
                  <p className="text-xs text-slate-500 font-medium">Scikit-Learn dynamic price calculation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPriceEstimatorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Service Category</label>
                  <select
                    value={priceEstimateParams.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setPriceEstimateParams({ ...priceEstimateParams, category: newCat });
                      triggerPriceCalculation(newCat, priceEstimateParams.complexity, priceEstimateParams.isEmergency, priceEstimateParams.distanceKm);
                    }}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="hvac">AC & HVAC</option>
                    <option value="cleaning">Deep Cleaning</option>
                    <option value="carpentry">Carpentry</option>
                    <option value="painting">Painting</option>
                    <option value="appliance">Appliance Repair</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Complexity Level</label>
                  <select
                    value={priceEstimateParams.complexity}
                    onChange={(e) => {
                      const newComp = e.target.value;
                      setPriceEstimateParams({ ...priceEstimateParams, complexity: newComp });
                      triggerPriceCalculation(priceEstimateParams.category, newComp, priceEstimateParams.isEmergency, priceEstimateParams.distanceKm);
                    }}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="minor">Minor Fix / Tune-Up (0.85x)</option>
                    <option value="standard">Standard Repair / Diagnostic (1.0x)</option>
                    <option value="major">Major Overhaul / Replacement (1.55x)</option>
                    <option value="emergency">24/7 Priority Emergency (1.80x)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Estimated Distance from Provider: {priceEstimateParams.distanceKm} km</label>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="0.5"
                  value={priceEstimateParams.distanceKm}
                  onChange={(e) => {
                    const newDist = Number(e.target.value);
                    setPriceEstimateParams({ ...priceEstimateParams, distanceKm: newDist });
                    triggerPriceCalculation(priceEstimateParams.category, priceEstimateParams.complexity, priceEstimateParams.isEmergency, newDist);
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Price Calculation Output Box */}
              {isCalculatingEstimate ? (
                <div className="p-8 text-center text-slate-400 font-medium">Calculating ML regression estimate...</div>
              ) : priceEstimateResult ? (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Predicted Fair Price</span>
                    <span className="text-2xl font-black text-indigo-950 font-display">
                      ${priceEstimateResult.estimatedAmount}
                    </span>
                  </div>

                  <div className="text-xs text-indigo-800 font-semibold flex items-center justify-between">
                    <span>Expected Range:</span>
                    <span className="font-black">${priceEstimateResult.minEstimate} - ${priceEstimateResult.maxEstimate}</span>
                  </div>

                  <div className="pt-2 border-t border-indigo-200/70 space-y-1 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Base Labor ({priceEstimateResult.estimatedDurationMinutes || 60} mins):</span>
                      <span className="font-bold">${priceEstimateResult.breakdown?.baseLaborCost}</span>
                    </div>
                    {priceEstimateResult.breakdown?.travelFee > 0 && (
                      <div className="flex justify-between">
                        <span>Distance / Travel allowance:</span>
                        <span className="font-bold">${priceEstimateResult.breakdown?.travelFee}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Platform Assurance & Guarantee:</span>
                      <span className="font-bold">${priceEstimateResult.breakdown?.platformFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Tax (8%):</span>
                      <span className="font-bold">${priceEstimateResult.breakdown?.serviceTax}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPriceEstimatorOpen(false)}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPriceEstimatorOpen(false);
                  setSelectedCategory(priceEstimateParams.category);
                  setActiveTab('browse');
                }}
                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md transition"
              >
                Find Specialists with this Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE PAYMENT CHECKOUT MODAL */}
      {paymentBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  💳
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg font-display">Secure Digital Checkout</h3>
                  <p className="text-xs text-slate-500 font-medium">HandyPro Instant Invoicing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentBooking(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Booking ID:</span>
                  <span className="font-bold text-slate-900">{paymentBooking.id}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Service:</span>
                  <span className="font-bold text-slate-900">{paymentBooking.serviceTitle}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Technician:</span>
                  <span className="font-bold text-slate-900">{paymentBooking.providerName}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                  <span className="font-extrabold text-slate-900">Total Payable:</span>
                  <span className="font-black text-emerald-700 text-base">${paymentBooking.amount}.00</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-2">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'card', label: 'Credit Card', icon: '💳' },
                    { id: 'upi', label: 'Instant UPI', icon: '⚡' },
                    { id: 'cash', label: 'Pay on Site', icon: '💵' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(m.id)}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                        selectedPaymentMethod === m.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-extrabold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-[11px] font-bold">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPaymentBooking(null)}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={isProcessingPayment}
                className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Pay ${paymentBooking.amount}.00</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {selectedProviderForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Schedule Appointment</h3>
                <p className="text-xs text-slate-500">With {selectedProviderForBooking.name} ({selectedProviderForBooking.categoryLabel})</p>
              </div>
              <button onClick={() => setSelectedProviderForBooking(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Service Description / Title</label>
                <input
                  type="text"
                  required
                  value={bookingFormData.serviceTitle}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, serviceTitle: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    required
                    value={bookingFormData.scheduledDate}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, scheduledDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Preferred Time</label>
                  <select
                    value={bookingFormData.scheduledTime}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, scheduledTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none bg-white"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="04:30 PM">04:30 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Service Address</label>
                <input
                  type="text"
                  required
                  value={bookingFormData.customerAddress}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, customerAddress: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={bookingFormData.customerPhone}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, customerPhone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Issue Details / Instructions</label>
                <textarea
                  rows="2"
                  value={bookingFormData.notes}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, notes: e.target.value })}
                  placeholder="Describe the issue or exact requirement..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <input
                  type="checkbox"
                  id="isEmergency"
                  checked={bookingFormData.isEmergency}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, isEmergency: e.target.checked })}
                  className="h-4 w-4 text-amber-600 rounded"
                />
                <label htmlFor="isEmergency" className="text-xs font-bold text-amber-900 cursor-pointer">
                  Mark as Emergency Dispatch (+$25 priority fee)
                </label>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProviderForBooking(null)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  Confirm & Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RATING & REVIEW MODAL */}
      {ratingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Rate Technician Service</h3>
              <button onClick={() => setRatingBooking(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-2">Select Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="p-1 text-2xl hover:scale-110 transition"
                    >
                      <Star className={`h-8 w-8 ${star <= reviewForm.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Feedback Comment</label>
                <textarea
                  rows="3"
                  required
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Share feedback on technician punctuality and work quality..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE / RECEIPT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                  H
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">HandyPro Official Receipt</h3>
                  <span className="text-xs text-slate-500">{selectedInvoice.invoiceNumber}</span>
                </div>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium text-slate-700">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold block">Customer</span>
                  <strong className="text-slate-900 text-sm">{selectedInvoice.customerName}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold block">Technician</span>
                  <strong className="text-slate-900 text-sm">{selectedInvoice.providerName}</strong>
                </div>
              </div>

              <div className="border-t border-b border-slate-200 py-3 space-y-2">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{selectedInvoice.serviceTitle}</span>
                  <span>${selectedInvoice.baseFee}.00</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>State Service Tax (10%)</span>
                  <span>${selectedInvoice.serviceTax}.00</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Platform & Processing Fee</span>
                  <span>${selectedInvoice.platformFee}.00</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1">
                <span>Total Amount Paid</span>
                <span className="text-lg text-emerald-700">${selectedInvoice.totalAmount}.00</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-center gap-2 text-xs"
              >
                <Printer className="h-4 w-4" />
                <span>Print Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER PROFILE MODAL */}
      {isEditingCustomerProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Edit Customer Profile</h3>
              <button onClick={() => setIsEditingCustomerProfile(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerProfile} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={customerProfileForm.name || activeCustomerName}
                  onChange={(e) => setCustomerProfileForm({ ...customerProfileForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={customerProfileForm.phone}
                  onChange={(e) => setCustomerProfileForm({ ...customerProfileForm, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Tamil Nadu District & Area */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tamil Nadu District</label>
                  <select
                    value={customerProfileForm.district || customerProfileForm.locationId || 'chennai'}
                    onChange={(e) => {
                      const dId = e.target.value;
                      const pls = getPlacesForDistrict(dId);
                      setCustomerProfileForm({
                        ...customerProfileForm,
                        district: dId,
                        locationId: dId,
                        place: pls[0] || 'Central Area',
                      });
                    }}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-semibold bg-white focus:border-blue-600 focus:outline-none"
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
                    value={customerProfileForm.place || ''}
                    onChange={(e) => setCustomerProfileForm({ ...customerProfileForm, place: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-semibold bg-white focus:border-blue-600 focus:outline-none"
                  >
                    {getPlacesForDistrict(customerProfileForm.district || customerProfileForm.locationId || 'chennai').map((pl) => (
                      <option key={pl} value={pl}>
                        {pl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Address, Flat / Door No.</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. No. 12, Panagal Park Road"
                  value={customerProfileForm.address}
                  onChange={(e) => setCustomerProfileForm({ ...customerProfileForm, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 600017"
                  value={customerProfileForm.pincode || ''}
                  onChange={(e) => setCustomerProfileForm({ ...customerProfileForm, pincode: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCustomerProfile(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PROVIDER DETAILS QUICK MODAL */}
      {viewingProviderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-2xl ${viewingProviderDetails.avatarBg || 'bg-blue-600'} text-white flex items-center justify-center font-black text-xl shadow-md`}>
                  {viewingProviderDetails.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base font-display">{viewingProviderDetails.name}</h3>
                  <p className="text-xs text-blue-600 font-bold">{viewingProviderDetails.categoryLabel} Specialist</p>
                </div>
              </div>
              <button onClick={() => setViewingProviderDetails(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium max-h-[60vh] overflow-y-auto pr-1">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1 text-amber-500 font-extrabold text-sm">
                  ★ {viewingProviderDetails.rating || 4.9} ({viewingProviderDetails.reviewsCount || 40} reviews)
                </span>
                <span className="font-black text-emerald-700 text-base">${viewingProviderDetails.hourlyRate}/hr</span>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 mb-1">Bio & Experience Overview</h4>
                <p className="text-slate-600 leading-relaxed font-medium">{viewingProviderDetails.bio}</p>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 mb-1.5">Specialized Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewingProviderDetails.skills?.map((sk, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 text-[11px] font-extrabold border border-blue-200">
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Completed Work / Portfolio Showcase */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <span>🖼️ Previous Completed Work</span>
                    <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                      Portfolio ({((viewingProviderDetails.portfolio?.length ? viewingProviderDetails.portfolio : null) || dataStore.getProviderPortfolio(viewingProviderDetails.id) || []).length})
                    </span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Click photo to zoom</span>
                </div>

                {(((viewingProviderDetails.portfolio?.length ? viewingProviderDetails.portfolio : null) || dataStore.getProviderPortfolio(viewingProviderDetails.id) || []).length > 0) ? (
                  <div className="grid grid-cols-2 gap-2">
                    {((viewingProviderDetails.portfolio?.length ? viewingProviderDetails.portfolio : null) || dataStore.getProviderPortfolio(viewingProviderDetails.id) || []).map((work) => (
                      <div
                        key={work.id}
                        onClick={() => setZoomedWorkImage(work)}
                        className="rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:border-blue-400 transition bg-slate-50 flex flex-col group"
                      >
                        <div className="h-24 bg-slate-100 overflow-hidden relative">
                          <img
                            src={work.imageUrl}
                            alt={work.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                            {work.category}
                          </span>
                        </div>
                        <div className="p-2 space-y-0.5">
                          <p className="font-bold text-slate-900 truncate text-[11px]">{work.title}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{work.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        title: `${viewingProviderDetails.categoryLabel} Project Finished`,
                        category: viewingProviderDetails.categoryLabel,
                        imageUrl:
                          viewingProviderDetails.category === 'painting'
                            ? 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80'
                            : viewingProviderDetails.category === 'carpentry'
                            ? 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'
                            : viewingProviderDetails.category === 'interior-design'
                            ? 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80'
                            : viewingProviderDetails.category === 'electrical'
                            ? 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80'
                            : 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
                        description: `Certified verified delivery for recent residential assignment.`,
                      },
                      {
                        title: `Safety Tested & Completed Job`,
                        category: viewingProviderDetails.categoryLabel,
                        imageUrl:
                          viewingProviderDetails.category === 'painting'
                            ? 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80'
                            : 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
                        description: `Inspected and approved to manufacturer and safety codes.`,
                      },
                    ].map((sample, idx) => (
                      <div
                        key={idx}
                        onClick={() => setZoomedWorkImage(sample)}
                        className="rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:border-blue-400 transition bg-slate-50 flex flex-col group"
                      >
                        <div className="h-24 bg-slate-100 overflow-hidden relative">
                          <img
                            src={sample.imageUrl}
                            alt={sample.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                            Verified Work
                          </span>
                        </div>
                        <div className="p-2 space-y-0.5">
                          <p className="font-bold text-slate-900 truncate text-[11px]">{sample.title}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{sample.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comprehensive Provider Location Detail */}
              <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-blue-900 font-extrabold">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span>Technician Station & Location Details</span>
                  </span>
                  <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full text-[10px]">
                    ~{viewingProviderDetails.calculatedDistanceMiles?.toFixed(1) || 1.5} km from you
                  </span>
                </div>
                <div className="space-y-1 text-slate-600 text-[11px]">
                  <p>
                    <strong className="text-slate-800">Registered Workshop:</strong>{' '}
                    {viewingProviderDetails.address || `${viewingProviderDetails.place || 'Anna Salai'}, ${viewingProviderDetails.district || 'Chennai'}`}
                    {viewingProviderDetails.pincode ? ` (${viewingProviderDetails.pincode})` : ''}
                  </p>
                  <p>
                    <strong className="text-slate-800">Operating District:</strong>{' '}
                    <span className="text-blue-700 font-bold">{viewingProviderDetails.district || 'Chennai'} (Tamil Nadu)</span>
                    {' • '}{viewingProviderDetails.serviceRadiusKm || 20} km Hyperlocal Radius
                  </p>
                  {viewingProviderDetails.coveredPlaces?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {viewingProviderDetails.coveredPlaces.map((pl, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-blue-200 rounded text-[10px] text-blue-800 font-medium">
                          📍 {pl}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const pId = viewingProviderDetails.id;
                  setViewingProviderDetails(null);
                  navigate(`/user/provider/${pId}`);
                }}
                className="flex-1 py-2.5 rounded-2xl border border-slate-300 font-extrabold text-slate-700 hover:bg-slate-50 text-xs text-center flex items-center justify-center gap-1"
              >
                <span>View Full Profile & Portfolio</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = viewingProviderDetails;
                  setViewingProviderDetails(null);
                  handleOpenBookingModal(p);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md"
              >
                Book Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR ZOOMING COMPLETED WORK IMAGE */}
      {zoomedWorkImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setZoomedWorkImage(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-white overflow-hidden shadow-2xl border border-slate-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-72 sm:h-96 bg-black">
              <img
                src={zoomedWorkImage.imageUrl}
                alt={zoomedWorkImage.title}
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => setZoomedWorkImage(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                  {zoomedWorkImage.category || 'Finished Project'}
                </span>
                {zoomedWorkImage.completedDate && (
                  <span className="text-xs text-slate-400">📅 {zoomedWorkImage.completedDate}</span>
                )}
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 font-display">
                {zoomedWorkImage.title}
              </h3>
              {zoomedWorkImage.description && (
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {zoomedWorkImage.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING AI CHAT BOT (Customer Dashboard Only) */}
      <CustomerAIChatBot
        activeCustomerName={activeCustomerName}
        customerProfile={customerProfile}
        currentLocation={currentActiveLocationDisplay}
        providers={providers}
        myBookings={myBookings}
        invoiceData={invoiceData}
        onOpenBookingModal={handleOpenBookingModal}
        onSwitchTab={setActiveTab}
        onSelectCategory={setSelectedCategory}
        onSearchQuery={setSearchQuery}
      />

    </div>
  );
}