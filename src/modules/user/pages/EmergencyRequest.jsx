/**
 * Customer Emergency SOS Service Request Page
 * Path: src/modules/user/pages/EmergencyRequest.jsx
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar';
import { useAuth } from '../../../hooks/useAuth';
import dataStore from '../../../services/dataStore';
import {
  AlertTriangle,
  MapPin,
  Phone,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Zap,
} from 'lucide-react';

const URGENT_CATEGORIES = [
  { id: 'plumbing', title: 'Severe Water Leak', icon: '🚰', desc: 'Burst pipes, major flooding, clogged main drain' },
  { id: 'electrical', title: 'Electrical Hazard', icon: '⚡', desc: 'Power outage, sparking, burning wire smell' },
  { id: 'hvac', title: 'AC / Heating Failure', icon: '❄️', desc: 'Complete cooling failure during extreme heat' },
  { id: 'appliance', title: 'Appliance Failure', icon: '🔌', desc: 'Washing machine leak, refrigerator breakdown' },
];

export default function EmergencyRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customerProfile] = useState(() => dataStore.getCustomerProfile());

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Emergency Form State
  const [emergencyData, setEmergencyData] = useState({
    category: 'plumbing',
    address: customerProfile.address || 'No. 12, Panagal Park Road, T. Nagar, Chennai - 600017',
    phone: customerProfile.phone || '+91 98401 23456',
    description: '',
    useLiveLocation: false,
  });

  useEffect(() => {
    dataStore.syncProvidersFromApi();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmergencyData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setEmergencyData((prev) => ({
          ...prev,
          useLiveLocation: true,
          address: `GPS Coords: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)} (Current GPS Location)`,
        }));
        setIsLocating(false);
      },
      () => {
        setErrorMessage('Unable to retrieve current location. Please enter your address manually.');
        setIsLocating(false);
      }
    );
  };

  const handleDispatchEmergency = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emergencyData.address.trim()) {
      setErrorMessage('Please provide a service location or detect your GPS location.');
      return;
    }
    if (!emergencyData.phone.trim()) {
      setErrorMessage('Please enter an active contact phone number for immediate dispatch.');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeCustomerName = user?.name || customerProfile.name || 'Customer';

      const result = await dataStore.createEmergencyBookingWithAI({
        category: emergencyData.category,
        address: emergencyData.address,
        phone: emergencyData.phone,
        customerName: activeCustomerName,
        description: emergencyData.description || '24/7 Rapid Emergency Dispatch Request',
        customerCoords: {
          lat: customerProfile.latitude || 13.0827,
          lng: customerProfile.longitude || 80.2707,
          locationId: customerProfile.locationId || 'chennai',
        },
      });

      if (result && result.data) {
        navigate(`/user/my-bookings?booked=${result.data.id}&emergency=true`);
      } else {
        throw new Error('Allocation returned empty');
      }
    } catch (err) {
      setErrorMessage('Failed to trigger emergency dispatch. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header Title & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 font-black text-xl animate-pulse">
              🚨
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 font-display">24/7 Emergency SOS Dispatch</h1>
              <p className="text-xs text-slate-500 font-medium">
                High-priority dispatch connects you with nearby available technicians in minutes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/user/dashboard')}
            className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 text-xs font-bold hover:bg-blue-50 transition shadow-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4 text-blue-600" />
            <span>Cancel</span>
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

        <form onSubmit={handleDispatchEmergency} className="space-y-6">
          
          {/* 1. Emergency Type Selection */}
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 font-display">
              1. Select Emergency Category
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {URGENT_CATEGORIES.map((cat) => {
                const isSelected = emergencyData.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setEmergencyData((prev) => ({ ...prev, category: cat.id }))}
                    className={`p-4 rounded-2xl text-left border transition flex items-start gap-3 ${
                      isSelected
                        ? 'bg-red-50/80 border-red-500 ring-2 ring-red-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-red-200 hover:bg-red-50/30'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900">{cat.title}</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{cat.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Dispatch Location & Contact */}
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 font-display">
              2. Service Location & Direct Contact Phone
            </h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-red-600" />
                    <span>Emergency Location</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    🎯 {isLocating ? 'Detecting GPS...' : 'Use Current GPS Location'}
                  </button>
                </div>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="Street address, building name, or apartment unit..."
                  value={emergencyData.address}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 font-bold outline-none transition focus:bg-white focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-red-600" />
                  <span>Active Phone Number (For Rapid Technician Callout)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+1 (555) 987-6543"
                  value={emergencyData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 font-bold outline-none transition focus:bg-white focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Brief Description of Emergency Problem
                </label>
                <textarea
                  name="description"
                  rows="3"
                  placeholder="Describe the issue (e.g., Main pipe burst in kitchen, water dripping fast)..."
                  value={emergencyData.description}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 font-medium outline-none transition focus:bg-white focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Guarantee Banner & Dispatch CTA */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 shadow-xs">
            <span className="text-xl">⏱️</span>
            <div className="text-xs">
              <p className="font-extrabold">Average Emergency Response: Under 15 Minutes</p>
              <p className="text-amber-800 text-[11px] font-medium mt-0.5">
                Priority service dispatch fee applies (+$25 SOS charge included in invoice).
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-black shadow-lg shadow-red-600/20 transition active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Broadcasting Emergency SOS...</span>
            ) : (
              <>
                <Zap className="h-5 w-5 fill-white" />
                <span>DISPATCH EMERGENCY SOS TECHNICIAN NOW</span>
              </>
            )}
          </button>

        </form>

      </main>
    </div>
  );
}