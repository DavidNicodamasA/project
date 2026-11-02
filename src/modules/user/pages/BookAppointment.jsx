/**
 * Customer Appointment Booking Page
 * Path: src/modules/user/pages/BookAppointment.jsx
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar';
import { useAuth } from '../../../hooks/useAuth';
import dataStore from '../../../services/dataStore';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';

const AVAILABLE_TIME_SLOTS = [
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
];

export default function BookAppointment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { providerId: paramProviderId } = useParams();
  const [searchParams] = useSearchParams();
  const providerIdQuery = searchParams.get('providerId');
  const targetProviderId = paramProviderId || providerIdQuery;

  const [customerProfile] = useState(() => dataStore.getCustomerProfile());
  const [provider, setProvider] = useState(() => {
    if (targetProviderId) return dataStore.getProviderById(targetProviderId);
    return dataStore.getProviders()[0] || null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Booking Form State
  const [bookingData, setBookingData] = useState({
    serviceTitle: '',
    selectedDate: new Date().toISOString().split('T')[0],
    selectedTimeSlot: '10:30 AM',
    serviceAddress: customerProfile.address || 'No. 12, Panagal Park Road, T. Nagar, Chennai - 600017',
    contactPhone: customerProfile.phone || '+91 98401 23456',
    notes: '',
    emergencySOS: false,
  });

  useEffect(() => {
    dataStore.syncProvidersFromApi();
    const loadProvider = () => {
      const p = targetProviderId
        ? dataStore.getProviderById(targetProviderId)
        : dataStore.getProviders()[0];
      if (p) {
        setProvider(p);
        setBookingData((prev) => ({
          ...prev,
          serviceTitle: prev.serviceTitle || `${p.categoryLabel || p.category} Appointment & Service`,
        }));
      }
    };

    loadProvider();
    const unsubscribe = dataStore.subscribe(() => {
      loadProvider();
    });
    return unsubscribe;
  }, [targetProviderId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBookingData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const calculateTotalPrice = () => {
    const base = provider?.hourlyRate || 45;
    const emergencyFee = bookingData.emergencySOS ? 25 : 0;
    const serviceFee = 5;
    return {
      base,
      emergencyFee,
      serviceFee,
      total: base + emergencyFee + serviceFee,
    };
  };

  const pricing = calculateTotalPrice();

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!bookingData.serviceAddress.trim()) {
      setErrorMessage('Please enter your service address.');
      return;
    }
    if (!bookingData.contactPhone.trim()) {
      setErrorMessage('Please enter a valid contact phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeCustomerName = user?.name || customerProfile.name || 'Customer';
      const created = dataStore.createBooking({
        customerId: user?.id || customerProfile.id || `cust-${Date.now()}`,
        customerName: activeCustomerName,
        customerPhone: bookingData.contactPhone,
        customerAddress: bookingData.serviceAddress,
        customerLocation: customerProfile.locationName || (customerProfile.district ? `${customerProfile.district} (${customerProfile.place || ''})` : 'Tamil Nadu'),
        providerId: provider.id,
        providerName: provider.name,
        serviceTitle: bookingData.serviceTitle || `${provider.categoryLabel} Appointment`,
        category: provider.category,
        scheduledDate: bookingData.selectedDate,
        scheduledTime: bookingData.selectedTimeSlot,
        notes: bookingData.notes,
        amount: pricing.total,
        isEmergency: bookingData.emergencySOS,
      });

      navigate(`/user/my-bookings?booked=${created.id}`);
    } catch (err) {
      setErrorMessage('Failed to place booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!provider) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <span className="text-4xl">🗓️</span>
            <h2 className="text-lg font-bold text-slate-800">Technician Details Loading...</h2>
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header Title & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-md bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              Appointment Scheduling
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1 font-display">Book Service Appointment</h1>
            <p className="text-xs text-slate-500 font-medium">
              Select your date, preferred slot, and location details to schedule your service
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 text-xs font-bold hover:bg-blue-50 transition shadow-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4 text-blue-600" />
            <span>Back</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleConfirmBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Booking Controls (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Service & Provider Overview Header */}
            <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
              <span className="inline-block px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase tracking-wider">
                {provider.categoryLabel}
              </span>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Service Title</label>
                <input
                  type="text"
                  name="serviceTitle"
                  value={bookingData.serviceTitle}
                  onChange={handleInputChange}
                  className="w-full text-base font-extrabold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <div className={`h-11 w-11 rounded-2xl ${provider.avatarBg || 'bg-blue-600'} text-white flex items-center justify-center font-black text-lg shadow-sm`}>
                  {provider.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-display">{provider.name}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    ★ {provider.rating || 4.9} ({provider.reviewsCount || 40} reviews) • ${provider.hourlyRate}/hr
                  </p>
                </div>
              </div>
            </div>

            {/* Date & Time Slot Selection */}
            <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 font-display">
                1. Select Schedule & Slot
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                    <span>Preferred Date</span>
                  </label>
                  <input
                    type="date"
                    name="selectedDate"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingData.selectedDate}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 font-bold outline-none transition focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>Available Time Slots</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {AVAILABLE_TIME_SLOTS.map((slot) => {
                      const isSelected = bookingData.selectedTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() =>
                            setBookingData((prev) => ({ ...prev, selectedTimeSlot: slot }))
                          }
                          className={`p-3 rounded-2xl text-xs font-extrabold transition border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-200'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Contact Information */}
            <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 font-display">
                2. Service Location & Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span>Full Service Address</span>
                  </label>
                  <input
                    type="text"
                    name="serviceAddress"
                    required
                    placeholder="e.g. No. 12, Panagal Park Road, T. Nagar, Chennai - 600017"
                    value={bookingData.serviceAddress}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 font-bold outline-none transition focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span>Contact Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    required
                    placeholder="+1 (555) 987-6543"
                    value={bookingData.contactPhone}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 font-bold outline-none transition focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Job Instructions / Issue Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    rows="3"
                    placeholder="Provide specific notes or symptoms about the required repair..."
                    value={bookingData.notes}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 font-medium outline-none transition focus:bg-white focus:border-blue-500"
                  />
                </div>

                {/* Emergency SOS Toggle */}
                <label className="flex items-start gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50/60 cursor-pointer">
                  <input
                    type="checkbox"
                    name="emergencySOS"
                    checked={bookingData.emergencySOS}
                    onChange={handleInputChange}
                    className="mt-1 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <div>
                    <p className="text-xs font-black text-amber-900">🚨 Mark as Priority / Emergency Request</p>
                    <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                      Adds an urgent response dispatch surcharge (+$25) for immediate priority scheduling.
                    </p>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Order Summary & Confirmation Side Card */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs space-y-5 sticky top-6">
              <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 font-display">
                Payment Summary
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Base Technician Hourly Rate</span>
                  <span className="font-extrabold text-slate-900">${pricing.base}.00</span>
                </div>

                {bookingData.emergencySOS && (
                  <div className="flex justify-between text-amber-800 font-extrabold">
                    <span>Priority SOS Dispatch Fee</span>
                    <span>+${pricing.emergencyFee}.00</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 font-medium">
                  <span>HandyPro Platform Fee</span>
                  <span className="font-extrabold text-slate-900">${pricing.serviceFee}.00</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>Total Payable</span>
                  <span className="text-blue-600 text-xl font-black">${pricing.total}.00</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-[11px] text-blue-900 space-y-1">
                <p className="font-black flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>Guaranteed Service Quality</span>
                </p>
                <p className="text-blue-700 font-medium">
                  Your request is immediately transmitted to the technician station.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isSubmitting ? 'Transmitting Request...' : 'Confirm & Book Appointment'}</span>
              </button>
            </div>
          </div>

        </form>

      </main>
    </div>
  );
}