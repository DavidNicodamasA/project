/**
 * Live Technician GPS Tracking Component (Leaflet + Socket.IO)
 * Path: src/modules/user/components/LiveTrackingMap.jsx
 */

import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  MapPin,
  Navigation,
  Clock,
  Phone,
  ShieldCheck,
  Radio,
  X,
  Compass,
  Layers,
  ExternalLink,
  MessageSquare,
  Car,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import dataStore from '../../../services/dataStore';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet Default Icon Assets in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Technician Vehicle Marker Icon
const technicianIcon = L.divIcon({
  className: 'custom-technician-marker',
  html: `<div style="background-color: #2563eb; color: white; border: 2.5px solid white; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37,99,235,0.45); font-size: 18px; cursor: pointer;">🚗</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

// Customer Home Marker Icon
const customerIcon = L.divIcon({
  className: 'custom-customer-marker',
  html: `<div style="background-color: #10b981; color: white; border: 2.5px solid white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16,185,129,0.45); font-size: 18px; cursor: pointer;">🏠</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export default function LiveTrackingMap({ bookingId, onClose }) {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [providerDetails, setProviderDetails] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting | live | stopped
  const [lastUpdateText, setLastUpdateText] = useState('Just now');
  const [etaMinutes, setEtaMinutes] = useState(12);
  const [activeTrackingTab, setActiveTrackingTab] = useState('map'); // 'map' | 'telemetry'

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const technicianMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const socketRef = useRef(null);

  // 1. Fetch initial tracking position from API & local reactive store
  useEffect(() => {
    let isMounted = true;
    async function fetchTracking() {
      try {
        const res = await axios.get(`/api/v1/tracking/${bookingId}`);
        if (res.data?.success && isMounted) {
          setBookingData(res.data.data);
          const t = res.data.data.tracking;
          if (t) {
            setTrackingData(t);
            setEtaMinutes(t.estimatedArrivalMinutes || 12);
          }
          if (res.data.data.providerId) {
            const p = dataStore.getProviderById(res.data.data.providerId);
            if (p) setProviderDetails(p);
          }
        }
      } catch (err) {
        console.warn('Could not fetch tracking initial state:', err.message);
      }

      // Check local store for complete booking and provider info
      const localBooking = dataStore.getBookings().find((b) => b.id === bookingId);
      if (localBooking && isMounted) {
        setBookingData((prev) => prev || localBooking);
        const p = dataStore.getProviderById(localBooking.providerId);
        if (p) {
          setProviderDetails((prev) => prev || p);
          if (!trackingData) {
            setTrackingData({
              latitude: p.latitude || 13.0827,
              longitude: p.longitude || 80.2707,
              status: localBooking.status || 'IN_PROGRESS',
              estimatedArrivalMinutes: 12,
              distanceKm: p.calculatedDistanceMiles ? (p.calculatedDistanceMiles * 1.6).toFixed(1) : '2.4',
            });
          }
        }
      }
    }
    fetchTracking();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  // 2. Initialize Leaflet Map with robust resize invalidation
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      setTimeout(() => {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch {}
      }, 100);
      return;
    }

    const defaultLat = trackingData?.latitude || providerDetails?.latitude || 13.0827;
    const defaultLng = trackingData?.longitude || providerDetails?.longitude || 80.2707;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([defaultLat, defaultLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Create markers
    const provName = bookingData?.providerName || providerDetails?.name || 'Technician';
    technicianMarkerRef.current = L.marker([defaultLat, defaultLng], { icon: technicianIcon })
      .addTo(map)
      .bindPopup(`<b>🚗 ${provName}</b><br/>En route to your address`)
      .openPopup();

    const custLat = defaultLat - 0.008;
    const custLng = defaultLng + 0.007;
    customerMarkerRef.current = L.marker([custLat, custLng], { icon: customerIcon })
      .addTo(map)
      .bindPopup(`<b>🏠 Service Location</b><br/>${bookingData?.customerAddress || 'Customer Destination'}`);

    routeLineRef.current = L.polyline(
      [
        [defaultLat, defaultLng],
        [custLat, custLng],
      ],
      { color: '#2563eb', weight: 4, dashArray: '6, 8', opacity: 0.85 }
    ).addTo(map);

    try {
      map.fitBounds(
        [
          [defaultLat, defaultLng],
          [custLat, custLng],
        ],
        { padding: [50, 50] }
      );
    } catch {}

    // Invalidate size multiple times to ensure Leaflet renders in modal
    const t1 = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {}
    }, 200);

    const t2 = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {}
    }, 600);

    const handleResize = () => {
      try {
        map.invalidateSize();
      } catch {}
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
      try {
        map.remove();
      } catch {}
      mapInstanceRef.current = null;
    };
  }, [activeTrackingTab, trackingData?.latitude]);

  // 3. Setup Socket.IO Live Listener
  useEffect(() => {
    const socket = io(window.location.origin || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('live');
      socket.emit('join_booking_tracking', { bookingId });
    });

    socket.on('provider_location_updated', (data) => {
      if (data.bookingId === bookingId) {
        setTrackingData((prev) => ({ ...prev, ...data }));
        setLastUpdateText('A few seconds ago');

        // Move Leaflet technician marker smoothly
        if (technicianMarkerRef.current && mapInstanceRef.current) {
          const newLatLng = [data.latitude, data.longitude];
          technicianMarkerRef.current.setLatLng(newLatLng);

          if (customerMarkerRef.current && routeLineRef.current) {
            const custLatLng = customerMarkerRef.current.getLatLng();
            routeLineRef.current.setLatLngs([newLatLng, [custLatLng.lat, custLatLng.lng]]);
          }
        }
      }
    });

    socket.on('tracking_stopped', () => {
      setConnectionStatus('stopped');
    });

    return () => {
      socket.emit('leave_booking_tracking', { bookingId });
      socket.disconnect();
    };
  }, [bookingId]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'in_progress':
        return { label: 'In Progress (Repair Underway)', color: 'bg-indigo-600 text-white' };
      case 'arrived':
        return { label: 'Arrived at Location', color: 'bg-emerald-600 text-white' };
      case 'completed':
        return { label: 'Service Completed', color: 'bg-slate-700 text-white' };
      default:
        return { label: 'En Route to Your Address', color: 'bg-blue-600 text-white' };
    }
  };

  const statusBadge = getStatusBadge(trackingData?.status || bookingData?.status);
  const currentLat = trackingData?.latitude || providerDetails?.latitude || 13.0827;
  const currentLng = trackingData?.longitude || providerDetails?.longitude || 80.2707;
  const provName = bookingData?.providerName || providerDetails?.name || 'Assigned Technician';
  const provPhone = providerDetails?.phone || '+91 98765 43210';
  const provAddress = providerDetails?.address || providerDetails?.place || 'T. Nagar Central Workshop';
  const provDistrict = providerDetails?.district || 'Chennai';
  const distanceEstimate = trackingData?.distanceKm || (providerDetails?.calculatedDistanceMiles ? (providerDetails.calculatedDistanceMiles * 1.6).toFixed(1) : '2.4');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 sm:px-6 py-4 bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Navigation className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 font-display">Live GPS Technician Dispatch</h3>
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                  <Radio className="h-3 w-3 animate-ping text-emerald-600" />
                  <span>Real-Time Stream</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Booking Reference: <span className="font-bold text-slate-800">{bookingId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              title="Close Map"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-2.5 bg-white text-xs font-bold shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTrackingTab('map')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTrackingTab === 'map'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Interactive Map View</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTrackingTab('telemetry')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                activeTrackingTab === 'telemetry'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Provider Location Detail</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Coordinates: {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E
          </span>
        </div>

        {/* Status & ETA Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-slate-200 bg-blue-50/60 p-4 gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Estimated Arrival</div>
              <div className="text-sm font-black text-blue-900">~{etaMinutes} Minutes ({distanceEstimate} km)</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Assigned Technician</div>
              <div className="text-sm font-black text-slate-900">{provName}</div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className={`rounded-xl px-3 py-1.5 font-black text-xs shadow-xs ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>
        </div>

        {/* Scrollable Body: Map or Detailed Location View */}
        <div className="flex-1 overflow-y-auto">
          {activeTrackingTab === 'map' ? (
            <div className="space-y-4 p-4">
              {/* Map Container */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
                <div
                  ref={mapContainerRef}
                  className="w-full z-10"
                  style={{ height: '340px', minHeight: '340px' }}
                />

                {/* Floating Map Legend */}
                <div className="absolute bottom-3 left-3 z-20 rounded-xl bg-white/95 backdrop-blur-md p-3 shadow-lg border border-slate-200 text-xs space-y-1 font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px]">
                      🚗
                    </span>
                    <span>{provName} (Real-Time GPS)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px]">
                      🏠
                    </span>
                    <span>Your Service Address</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium pt-1">
                    Last signal synced: {lastUpdateText}
                  </div>
                </div>
              </div>

              {/* Provider Location Detail Quick Card */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span>Technician Station & Route Summary</span>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700">
                    Operating in {provDistrict} District
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Registered Base</span>
                    <span className="font-extrabold text-slate-800 block truncate">{provAddress}</span>
                    <span className="text-slate-500 text-[11px]">{provDistrict}, Tamil Nadu</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Live Telemetry</span>
                    <span className="font-extrabold text-blue-700 block">
                      {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E
                    </span>
                    <span className="text-slate-500 text-[11px]">Speed: ~28 km/h</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-0.5">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Customer Destination</span>
                    <span className="font-extrabold text-slate-800 block truncate">
                      {bookingData?.customerAddress || 'Your Service Address'}
                    </span>
                    <span className="text-emerald-700 font-bold text-[11px]">~{etaMinutes} min away</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Telemetry / Full Location Detail Tab */
            <div className="p-5 space-y-4 text-xs font-medium">
              <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl font-black">
                      {provName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-base font-black">{provName}</h4>
                      <p className="text-blue-100 text-xs">
                        {providerDetails?.categoryLabel || 'Certified Technician'} • {providerDetails?.experienceYears || 6}+ Yrs Exp
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-extrabold text-xs">
                    ★ {providerDetails?.rating || 4.9} Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/20 text-center">
                  <div className="bg-black/10 rounded-xl p-2">
                    <span className="text-[10px] text-blue-200 uppercase font-bold block">Status</span>
                    <span className="font-black text-xs text-white">En Route</span>
                  </div>
                  <div className="bg-black/10 rounded-xl p-2">
                    <span className="text-[10px] text-blue-200 uppercase font-bold block">Est. Arrival</span>
                    <span className="font-black text-xs text-white">~{etaMinutes} Mins</span>
                  </div>
                  <div className="bg-black/10 rounded-xl p-2">
                    <span className="text-[10px] text-blue-200 uppercase font-bold block">Distance</span>
                    <span className="font-black text-xs text-white">~{distanceEstimate} km</span>
                  </div>
                  <div className="bg-black/10 rounded-xl p-2">
                    <span className="text-[10px] text-blue-200 uppercase font-bold block">Radius</span>
                    <span className="font-black text-xs text-white">{providerDetails?.serviceRadiusKm || 20} km</span>
                  </div>
                </div>
              </div>

              {/* Location Detail Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span>Station & Workshop Details</span>
                  </h4>

                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Workshop Address:</span>
                      <span className="font-bold text-slate-800">{provAddress}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Operating District:</span>
                      <span className="font-bold text-blue-700">{provDistrict} (Tamil Nadu)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Postal Pincode:</span>
                      <span className="font-bold text-slate-800">{providerDetails?.pincode || '600017'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Service Coverage:</span>
                      <span className="font-bold text-slate-800">{providerDetails?.serviceRadiusKm || 20} km Hyperlocal</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Compass className="h-4 w-4 text-emerald-600" />
                    <span>GPS Telemetry & Transit Stream</span>
                  </h4>

                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Current Latitude:</span>
                      <span className="font-mono font-bold text-slate-900">{currentLat.toFixed(5)}° N</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Current Longitude:</span>
                      <span className="font-mono font-bold text-slate-900">{currentLng.toFixed(5)}° E</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-400">Signal Source:</span>
                      <span className="font-bold text-emerald-700">Mobile GPS (Browser API)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Telemetry Ping:</span>
                      <span className="font-bold text-slate-800">{lastUpdateText}</span>
                    </div>
                  </div>
                </div>
              </div>

              {providerDetails && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-blue-900 block">Want to view past craftsmanship & portfolio?</span>
                    <span className="text-blue-700 text-xs">Browse completed jobs and customer reviews for {provName}.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/user/provider/${providerDetails.id}`);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-200 px-5 sm:px-6 py-3.5 bg-white gap-3 shrink-0">
          <div className="text-xs text-slate-600">
            <span className="font-bold text-slate-800">Destination: </span>
            <span>{bookingData?.customerAddress || 'Customer Service Location'}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href={`tel:${provPhone.replace(/\s+/g, '')}`}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Call Technician</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-extrabold text-xs transition"
            >
              Close Window
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
