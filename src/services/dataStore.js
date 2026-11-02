/**
 * Central Data Store for HandyPro Service Portal
 * Path: src/services/dataStore.js
 * 
 * Provides reactive mock data persistence via localStorage,
 * live appointment notifications with Web Audio chime,
 * location-based distance calculations, and offline filtering.
 */

const STORAGE_KEY_PROVIDERS = 'handypro_providers_v3';
const STORAGE_KEY_BOOKINGS = 'handypro_bookings_v3';
const STORAGE_KEY_PROVIDER_PROFILE = 'handypro_provider_profile_v3';
const STORAGE_KEY_CUSTOMER_PROFILE = 'handypro_customer_profile_v3';
const STORAGE_KEY_LATEST_ALERT = 'handypro_latest_alert_v3';

const MONGODB_API_BASE = 'http://localhost:5000/api/v1';

// Asynchronous MongoDB synchronization helpers
const syncToMongo = {
  createBooking(booking) {
    try {
      fetch(`${MONGODB_API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      }).catch(() => {});
    } catch {}
  },
  updateStatus(id, status, notes) {
    try {
      fetch(`${MONGODB_API_BASE}/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      }).catch(() => {});
    } catch {}
  },
  review(id, rating, comment) {
    try {
      fetch(`${MONGODB_API_BASE}/bookings/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      }).catch(() => {});
    } catch {}
  },
  updateProvider(id, updates) {
    try {
      fetch(`${MONGODB_API_BASE}/providers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).catch(() => {});
    } catch {}
  },
  rescheduleBooking(id, newTime, newDate, reason) {
    try {
      fetch(`${MONGODB_API_BASE}/bookings/${id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTime, newDate, reason }),
      }).catch(() => {});
    } catch {}
  },
  respondReschedule(id, accept, notes) {
    try {
      fetch(`${MONGODB_API_BASE}/bookings/${id}/respond-reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept, notes }),
      }).catch(() => {});
    } catch {}
  },
  uploadPortfolio(providerId, workItem) {
    try {
      fetch(`${MONGODB_API_BASE}/providers/${providerId}/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workItem),
      }).catch(() => {});
    } catch {}
  },
  deletePortfolio(providerId, workId) {
    try {
      fetch(`${MONGODB_API_BASE}/providers/${providerId}/portfolio/${workId}`, {
        method: 'DELETE',
      }).catch(() => {});
    } catch {}
  },
};

import {
  TAMIL_NADU_DISTRICTS,
  calculateDistanceKm,
  getDistrictById,
  formatFullAddress,
  DEFAULT_DISTRICT_ID,
  DEFAULT_PLACE,
} from '../data/tamilNaduLocations';

// 38 Districts of Tamil Nadu for Hyperlocal Matching & Search
export const LOCATIONS = TAMIL_NADU_DISTRICTS.map((d) => ({
  id: d.id,
  name: d.name,
  coordinates: d.coordinates,
  places: d.places,
  region: d.region,
}));

export const SERVICE_CATEGORIES = [
  { id: 'all', name: 'All Services', icon: '✦' },
  { id: 'interior-design', name: 'Interior Design & Modular Decor', icon: '🛋️' },
  { id: 'carpentry', name: 'Carpentry & Furniture', icon: '🪚' },
  { id: 'painting', name: 'Painting & Waterproofing', icon: '🎨' },
  { id: 'team-services', name: 'Group of People / Team Crew Services', icon: '👥' },
  { id: 'plumbing', name: 'Plumbing & Pipe Fitting', icon: '🔧' },
  { id: 'electrical', name: 'Electrical & Wiring', icon: '⚡' },
  { id: 'hvac', name: 'AC & HVAC Cooling', icon: '❄️' },
  { id: 'cleaning', name: 'Deep Home Cleaning Squad', icon: '🧹' },
  { id: 'appliance', name: 'Appliance & Gadget Repair', icon: '🔌' },
  { id: 'water_purifier', name: 'Water Purifier & RO', icon: '💧' },
  { id: 'pest_control', name: 'Pest Control & Fumigation', icon: '🐜' },
  { id: 'cctv_security', name: 'CCTV & Smart Security', icon: '📹' },
  { id: 'solar_inverter', name: 'Solar Panels & Inverters', icon: '🔋' },
  { id: 'handyman', name: 'General Handyman', icon: '🛠️' },
  { id: 'gardening', name: 'Gardening & Landscaping', icon: '🌱' },
  { id: 'packers_movers', name: 'Packers & Movers Crew', icon: '📦' },
];

// Default mock providers removed: Only real registered providers are displayed
const INITIAL_PROVIDERS = [];

export const isDefaultMockProvider = (p) => {
  if (!p) return false;
  const mockIds = ['prov-1', 'prov-2', 'prov-3', 'prov-4', 'prov-5', 'prov-6', 'prov-7'];
  if (mockIds.includes(p.id)) return true;
  if (p.email && p.email.toLowerCase().includes('@handypro.com')) return true;
  const mockNames = [
    'david nicodamas a',
    'vishal as',
    'kalidhass s',
    'elena rostova',
    'marcus brody',
    'sarah jenkins',
    'robert vance',
  ];
  if (p.name && mockNames.includes(p.name.trim().toLowerCase()) && (!p.email || p.email.includes('@handypro.com'))) {
    return true;
  }
  return false;
};

const INITIAL_BOOKINGS = [];

export const SAMPLE_CUSTOMERS = [];

const INITIAL_CUSTOMER_PROFILE = {
  id: 'cust-user',
  name: 'Valued Customer',
  email: '',
  phone: '',
  state: 'Tamil Nadu',
  district: 'Chennai',
  place: 'T. Nagar',
  pincode: '600017',
  locationId: 'chennai',
  locationName: 'Chennai (T. Nagar)',
  customLocation: '',
  address: 'No. 12, Panagal Park Road, T. Nagar',
  latitude: 13.0827,
  longitude: 80.2707,
  avatarLetter: 'C',
};

/**
 * Play an audible chime sound using browser Web Audio API
 */
export const playChimeSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.55);
  } catch (err) {
    // AudioContext autoplay restrictions handled silently
  }
};

export const dataStore = {
  // 1. Providers
  getProviders({ location = 'chennai', customLocationName = '', category = 'all', searchQuery = '', maxDistance = 200 } = {}) {
    let providers = this._loadProviders();

    const customerDistrict = getDistrictById(location);
    const customerCoords = customerDistrict?.coordinates || { lat: 13.0827, lng: 80.2707 };

    return providers
      .map((p) => {
        const provDistrict = getDistrictById(p.locationId || p.district);
        const provCoords = {
          lat: p.latitude || provDistrict?.coordinates?.lat || 13.0827,
          lng: p.longitude || provDistrict?.coordinates?.lng || 80.2707,
        };

        let distanceKm = calculateDistanceKm(
          customerCoords.lat,
          customerCoords.lng,
          provCoords.lat,
          provCoords.lng
        );

        // Same district / same place boost
        const isSameDistrict =
          (p.locationId && p.locationId.toLowerCase() === location.toLowerCase()) ||
          (p.district && customerDistrict?.name && p.district.toLowerCase() === customerDistrict.name.toLowerCase());

        const custLoc = (customLocationName || customerDistrict?.name || location).toLowerCase();
        const provLoc = (p.locationName || p.place || p.district || p.locationId || '').toLowerCase();
        const isExactLocationMatch = custLoc && provLoc && (custLoc.includes(provLoc) || provLoc.includes(custLoc));

        if (isExactLocationMatch) {
          distanceKm = 0.8;
        } else if (isSameDistrict && distanceKm > 15) {
          distanceKm = 4.2;
        }

        const isBestMatch = isExactLocationMatch || isSameDistrict || distanceKm <= 10.0;

        // AI Multi-Criteria Weighted Match Score
        // Distance 30%, Availability 20%, Rating 20%, Experience 10%, Price 10%, Performance 10%
        const distScore = Math.max(0, 1.0 - (distanceKm / 25.0));
        const availScore = p.isAvailable !== false ? 1.0 : 0.05;
        const rating = Number(p.rating) || 4.8;
        const reviewsCount = Number(p.reviewsCount) || 5;
        const smoothedRating = (rating * reviewsCount + 4.5 * 3) / (reviewsCount + 3);
        const ratingScore = Math.min(Math.max((smoothedRating - 1.0) / 4.0, 0), 1.0);
        const expScore = Math.min((Number(p.experienceYears) || 5) / 10.0, 1.0);
        const rate = Number(p.hourlyRate) || 50;
        const priceScore = Math.min(Math.max(1.0 - (rate - 35) / 45, 0), 1.0);
        const perfScore = Math.min(((Number(p.acceptanceRate) || 98) * 0.5 + Math.min((Number(p.completedJobsCount) || 8) * 5, 50)) / 100, 1.0);

        const weights = {
          distance: 0.30,
          availability: 0.20,
          rating: 0.20,
          experience: 0.10,
          price: 0.10,
          performance: 0.10,
        };

        const composite =
          distScore * weights.distance +
          availScore * weights.availability +
          ratingScore * weights.rating +
          expScore * weights.experience +
          priceScore * weights.price +
          perfScore * weights.performance;

        const aiMatchScore = Math.min(Math.round(75 + composite * 24), 99);

        const matchReasons = [];
        if (distanceKm <= 5.0) matchReasons.push(`Hyperlocal Proximity (${distanceKm.toFixed(1)} km)`);
        else if (distanceKm <= 12.0) matchReasons.push(`Nearby Specialist (${distanceKm.toFixed(1)} km)`);
        if (p.isAvailable !== false) matchReasons.push('Online & Ready for Dispatch');
        if (rating >= 4.8) matchReasons.push(`Top Rated (${rating}★)`);
        if ((Number(p.experienceYears) || 5) >= 5) matchReasons.push(`${p.experienceYears || 5}+ Yrs Exp`);
        if (p.supportsEmergency) matchReasons.push('24/7 Priority Emergency Ready');

        return {
          ...p,
          calculatedDistanceMiles: distanceKm,
          calculatedDistanceKm: distanceKm,
          isBestMatch,
          aiMatchScore,
          compositeScore: Math.round(composite * 1000) / 1000,
          matchReasons,
          featureBreakdown: {
            distance: Math.round(distScore * 100),
            availability: Math.round(availScore * 100),
            rating: Math.round(ratingScore * 100),
            experience: Math.round(expScore * 100),
            price: Math.round(priceScore * 100),
            performance: Math.round(perfScore * 100),
          },
        };
      })
      .filter((p) => {
        // Requirement: "when the service provider is offline don't show in the customer page."
        if (p.isAvailable === false) {
          return false;
        }

        // Category filter
        const catNorm = category ? category.toLowerCase().replace('_', '-') : 'all';
        const pCatNorm = p.category ? p.category.toLowerCase().replace('_', '-') : '';
        const matchCategory =
          catNorm === 'all' ||
          pCatNorm === catNorm ||
          (catNorm === 'interior-design' &&
            (pCatNorm.includes('interior') ||
              pCatNorm.includes('carpen') ||
              p.skills?.some((s) => s.toLowerCase().includes('interior') || s.toLowerCase().includes('modular') || s.toLowerCase().includes('kitchen')))) ||
          (catNorm === 'carpentry' &&
            (pCatNorm.includes('carpen') ||
              pCatNorm.includes('interior') ||
              pCatNorm.includes('furniture'))) ||
          (catNorm === 'painting' &&
            (pCatNorm.includes('paint') ||
              pCatNorm.includes('waterproof') ||
              p.skills?.some((s) => s.toLowerCase().includes('paint')))) ||
          (catNorm === 'team-services' &&
            (pCatNorm.includes('team') ||
              pCatNorm.includes('crew') ||
              pCatNorm.includes('paint') ||
              pCatNorm.includes('clean') ||
              pCatNorm.includes('mover') ||
              pCatNorm.includes('pack') ||
              p.skills?.some((s) => s.toLowerCase().includes('crew') || s.toLowerCase().includes('team')))) ||
          (catNorm === 'appliance' && (pCatNorm.includes('appliance') || pCatNorm.includes('gadget'))) ||
          (catNorm === 'appliance-repair' && (pCatNorm.includes('appliance') || pCatNorm.includes('gadget')));

        // Search query filter
        const query = searchQuery.trim().toLowerCase();
        const matchQuery =
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.categoryLabel.toLowerCase().includes(query) ||
          p.locationName.toLowerCase().includes(query) ||
          (p.district && p.district.toLowerCase().includes(query)) ||
          (p.place && p.place.toLowerCase().includes(query)) ||
          (p.address && p.address.toLowerCase().includes(query)) ||
          p.bio.toLowerCase().includes(query) ||
          p.skills.some((s) => s.toLowerCase().includes(query));

        // Distance filter
        const matchDistance = p.calculatedDistanceMiles <= maxDistance;

        return matchCategory && matchQuery && matchDistance;
      })
      .sort((a, b) => {
        // Highest AI Match Score first, then distance
        if (b.aiMatchScore !== a.aiMatchScore) {
          return b.aiMatchScore - a.aiMatchScore;
        }
        return a.calculatedDistanceMiles - b.calculatedDistanceMiles;
      });
  },

  _safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn(`[dataStore] localStorage quota reached for key "${key}":`, e.message);
      try {
        if (key === STORAGE_KEY_PROVIDERS) {
          const list = JSON.parse(value);
          if (Array.isArray(list)) {
            // Keep recent portfolio items with truncated or lightweight thumbnails for localStorage
            const compacted = list.map((prov) => ({
              ...prov,
              portfolio: Array.isArray(prov.portfolio)
                ? prov.portfolio.slice(0, 10).map((work, idx) => ({
                    ...work,
                    imageUrl:
                      idx < 2
                        ? work.imageUrl
                        : work.imageUrl?.startsWith('data:') && work.imageUrl.length > 50000
                        ? work.imageUrl.slice(0, 20000)
                        : work.imageUrl,
                  }))
                : [],
            }));
            localStorage.setItem(key, JSON.stringify(compacted));
            return true;
          }
        }
      } catch (compactErr) {
        console.warn('[dataStore] Secondary compaction bypassed:', compactErr.message);
      }
      return false;
    }
  },

  getProviderById(id) {
    const providers = this._loadProviders();
    if (!id) return providers[0] || null;
    const strId = String(id).toLowerCase();
    const found = providers.find(
      (p) =>
        (p.id && String(p.id).toLowerCase() === strId) ||
        (p._id && String(p._id).toLowerCase() === strId) ||
        (p.email && p.email.toLowerCase() === strId)
    );
    if (found) return found;
    return providers[0] || null;
  },

  /**
   * Fetch latest registered providers from MongoDB backend and sync local store
   */
  async syncProvidersFromApi() {
    try {
      const res = await fetch(`${MONGODB_API_BASE}/providers`);
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        const registeredOnly = json.data
          .filter((p) => !isDefaultMockProvider(p))
          .map((p) => ({
            ...p,
            categoryLabel:
              p.categoryLabel ||
              (p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : 'Service Specialist'),
            rating: p.rating || 5.0,
            reviewsCount: p.reviewsCount || 0,
            hourlyRate: p.hourlyRate || 50,
            state: p.state || 'Tamil Nadu',
            district: p.district || 'Chennai',
            place: p.place || 'T. Nagar',
            pincode: p.pincode || '',
            address: p.address || '',
            latitude: p.latitude || 13.0827,
            longitude: p.longitude || 80.2707,
            locationId: p.locationId || 'chennai',
            locationName: p.locationName || (p.district ? `${p.district} (${p.place || ''})` : 'Chennai (T. Nagar)'),
            isAvailable: p.isAvailable !== false,
            isVerified: p.isVerified !== false,
            supportsEmergency: p.supportsEmergency !== false,
            bio:
              p.bio ||
              `Certified ${p.category || 'service'} specialist ready for residential and commercial service appointments in ${p.district || 'Tamil Nadu'}.`,
            skills: p.skills?.length ? p.skills : ['Diagnostics', 'Installation', 'Safety Inspection'],
            coveredPlaces: p.coveredPlaces || (p.place ? [p.place] : []),
            avatarBg: p.avatarBg || 'bg-blue-600',
            portfolio: Array.isArray(p.portfolio) ? p.portfolio : [],
          }));

        this._safeSetItem(STORAGE_KEY_PROVIDERS, JSON.stringify(registeredOnly));
        this._notifyListeners();
        return registeredOnly;
      }
    } catch (e) {
      // offline / API error fallback
    }
    return this._loadProviders();
  },

  _loadProviders() {
    let providers = [];
    const stored = localStorage.getItem(STORAGE_KEY_PROVIDERS);
    if (stored) {
      try {
        providers = JSON.parse(stored);
      } catch {
        providers = [];
      }
    }

    // Strictly filter out any default mock providers
    providers = Array.isArray(providers)
      ? providers.filter((p) => !isDefaultMockProvider(p))
      : [];

    // Always keep active provider profile synchronized with latest profile edits
    const activeProfile = this.getProviderProfile();
    if (activeProfile && activeProfile.id && !isDefaultMockProvider(activeProfile)) {
      const idx = providers.findIndex((p) => p.id === activeProfile.id || (p.email && p.email === activeProfile.email));
      if (idx !== -1) {
        providers[idx] = { ...providers[idx], ...activeProfile };
      }
    }

    return providers;
  },

  // 2. Bookings
  getBookings() {
    const stored = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_BOOKINGS;
    }
  },

  isBookingForProvider(booking, providerId, providerName) {
    if (!booking) return false;

    // 1. Check matching providerId
    if (providerId && booking.providerId && String(providerId) === String(booking.providerId)) {
      return true;
    }

    // 2. Check matching providerName (case-insensitive)
    if (providerName && booking.providerName) {
      const pName = String(providerName).trim().toLowerCase();
      const bName = String(booking.providerName).trim().toLowerCase();

      if (pName === bName) return true;
      if (pName.includes(bName) || bName.includes(pName)) return true;

      // Match first name (e.g. "David" vs "David Nicodamas A" or "Vishal" vs "Vishal AS")
      const pFirst = pName.split(' ')[0];
      const bFirst = bName.split(' ')[0];
      if (pFirst && bFirst && pFirst.length >= 3 && pFirst === bFirst) {
        return true;
      }
    }

    return false;
  },

  createBooking(booking) {
    const bookings = this.getBookings();
    const newBooking = {
      id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: booking.customerId || `cust-${Date.now()}`,
      customerName: booking.customerName || 'Customer',
      customerPhone: booking.customerPhone || '',
      customerAddress: booking.customerAddress || '123 Main Street',
      customerLocation: booking.customerLocation || 'Downtown / Central',
      providerId: booking.providerId || this.getProviders()[0]?.id || 'prov-active',
      providerName: booking.providerName || 'Service Provider',
      serviceTitle: booking.serviceTitle || 'Home Service Appointment',
      category: booking.category || 'plumbing',
      scheduledDate: booking.scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: booking.scheduledTime || '10:00 AM',
      notes: booking.notes || 'Standard service request',
      amount: booking.amount || 65,
      isEmergency: !!booking.isEmergency,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      isNewAlert: true,
    };

    const updated = [newBooking, ...bookings];
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(updated));

    // Save as active alert for provider
    localStorage.setItem(STORAGE_KEY_LATEST_ALERT, JSON.stringify(newBooking));

    // Live MongoDB synchronization
    syncToMongo.createBooking(newBooking);

    window.dispatchEvent(
      new CustomEvent('handypro_new_appointment', { detail: newBooking })
    );
    this._notifyListeners();

    return newBooking;
  },

  getLatestAlert(providerId, providerName) {
    const stored = localStorage.getItem(STORAGE_KEY_LATEST_ALERT);
    if (!stored) return null;
    try {
      const alert = JSON.parse(stored);
      if (!providerId && !providerName) return alert;
      return this.isBookingForProvider(alert, providerId, providerName) ? alert : null;
    } catch {
      return null;
    }
  },

  clearLatestAlert() {
    localStorage.removeItem(STORAGE_KEY_LATEST_ALERT);
    this._notifyListeners();
  },

  updateBookingStatus(bookingId, newStatus) {
    const bookings = this.getBookings();
    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: newStatus,
          isNewAlert: false,
          acceptedAt: newStatus === 'ACCEPTED' ? new Date().toISOString() : b.acceptedAt,
          completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : b.completedAt,
        };
      }
      return b;
    });

    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(updated));

    const currentAlert = this.getLatestAlert();
    if (currentAlert && currentAlert.id === bookingId) {
      this.clearLatestAlert();
    }

    // Live MongoDB synchronization
    syncToMongo.updateStatus(bookingId, newStatus);

    this._notifyListeners();
    return updated.find((b) => b.id === bookingId);
  },

  addBookingReview(bookingId, rating, comment) {
    const bookings = this.getBookings();
    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          userRating: rating,
          userReview: comment,
          reviewedAt: new Date().toISOString(),
        };
      }
      return b;
    });

    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(updated));

    // Live MongoDB synchronization
    syncToMongo.review(bookingId, rating, comment);

    this._notifyListeners();
    return updated.find((b) => b.id === bookingId);
  },

  cancelBooking(bookingId, reason = 'Cancelled by customer') {
    const bookings = this.getBookings();
    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledAt: new Date().toISOString(),
        };
      }
      return b;
    });

    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(updated));
    const currentAlert = this.getLatestAlert();
    if (currentAlert && currentAlert.id === bookingId) {
      this.clearLatestAlert();
    }

    // Live MongoDB synchronization
    syncToMongo.updateStatus(bookingId, 'CANCELLED', reason);

    this._notifyListeners();
    return updated.find((b) => b.id === bookingId);
  },

  proposeBookingTime(bookingId, { newTime, newDate, reason }) {
    const bookings = this.getBookings();
    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          proposedTime: newTime,
          proposedDate: newDate || b.scheduledDate,
          rescheduleReason: reason || 'Schedule adjustment by service provider',
          rescheduleStatus: 'PROPOSED_BY_PROVIDER',
          rescheduledAt: new Date().toISOString(),
        };
      }
      return b;
    });

    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(updated));

    // Live MongoDB synchronization
    syncToMongo.rescheduleBooking(bookingId, newTime, newDate, reason);

    // Dispatch event so customer components update reactively
    window.dispatchEvent(
      new CustomEvent('handypro_time_rescheduled', {
        detail: { bookingId, newTime, newDate, reason },
      })
    );

    this._notifyListeners();
    return updated.find((b) => b.id === bookingId);
  },

  respondBookingTime(bookingId, accept, notes = '') {
    const bookings = this.getBookings();
    const updated = bookings.map((b) => {
      if (b.id === bookingId) {
        if (accept) {
          return {
            ...b,
            scheduledTime: b.proposedTime || b.scheduledTime,
            scheduledDate: b.proposedDate || b.scheduledDate,
            rescheduleStatus: 'ACCEPTED_BY_CUSTOMER',
            rescheduleAcceptedAt: new Date().toISOString(),
          };
        } else {
          return {
            ...b,
            rescheduleStatus: 'REJECTED_BY_CUSTOMER',
            rescheduleDeclineReason: notes || 'Customer kept original appointment slot',
          };
        }
      }
      return b;
    });

    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(updated));

    // Live MongoDB synchronization
    syncToMongo.respondReschedule(bookingId, accept, notes);

    window.dispatchEvent(
      new CustomEvent('handypro_time_reschedule_response', {
        detail: { bookingId, accept, notes },
      })
    );

    this._notifyListeners();
    return updated.find((b) => b.id === bookingId);
  },

  uploadProviderPortfolio(providerId, workItem) {
    const providers = this._loadProviders();
    const newItem = {
      id: `work_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: workItem.title,
      category: workItem.category || 'Craftsmanship',
      description: workItem.description || '',
      imageUrl: workItem.imageUrl,
      completedDate: workItem.completedDate || new Date().toISOString().split('T')[0],
      customerLocation: workItem.customerLocation || 'Local Project',
      createdAt: new Date().toISOString(),
    };

    let targetUpdated = false;
    const updated = providers.map((p) => {
      const isMatch =
        p.id === providerId ||
        p._id === providerId ||
        (p.email && workItem.providerEmail && p.email.toLowerCase() === workItem.providerEmail.toLowerCase());
      if (isMatch) {
        targetUpdated = true;
        const currentPortfolio = Array.isArray(p.portfolio) ? p.portfolio : [];
        return {
          ...p,
          portfolio: [newItem, ...currentPortfolio],
        };
      }
      return p;
    });

    // Also update current active provider profile if logged in
    const activeProfile = this.getProviderProfile();
    if (activeProfile) {
      const matchActive =
        activeProfile.id === providerId ||
        activeProfile._id === providerId ||
        (activeProfile.email && workItem.providerEmail && activeProfile.email.toLowerCase() === workItem.providerEmail.toLowerCase());
      if (matchActive) {
        activeProfile.portfolio = [newItem, ...(Array.isArray(activeProfile.portfolio) ? activeProfile.portfolio : [])];
        this._safeSetItem(STORAGE_KEY_PROVIDER_PROFILE, JSON.stringify(activeProfile));
      }
    }

    this._safeSetItem(STORAGE_KEY_PROVIDERS, JSON.stringify(updated));

    // Sync to MongoDB backend
    syncToMongo.uploadPortfolio(providerId, workItem);

    // Notify listeners & broadcast event for reactive updates across components
    try {
      window.dispatchEvent(
        new CustomEvent('handypro_portfolio_updated', {
          detail: { providerId, workItem: newItem },
        })
      );
    } catch {}

    this._notifyListeners();
    return updated.find((p) => p.id === providerId) || activeProfile;
  },

  deleteProviderPortfolio(providerId, workId) {
    const providers = this._loadProviders();
    const updated = providers.map((p) => {
      if (p.id === providerId || p._id === providerId) {
        return {
          ...p,
          portfolio: (p.portfolio || []).filter((w) => w.id !== workId),
        };
      }
      return p;
    });

    const activeProfile = this.getProviderProfile();
    if (activeProfile && (activeProfile.id === providerId || activeProfile._id === providerId)) {
      activeProfile.portfolio = (activeProfile.portfolio || []).filter((w) => w.id !== workId);
      this._safeSetItem(STORAGE_KEY_PROVIDER_PROFILE, JSON.stringify(activeProfile));
    }

    this._safeSetItem(STORAGE_KEY_PROVIDERS, JSON.stringify(updated));
    syncToMongo.deletePortfolio(providerId, workId);

    try {
      window.dispatchEvent(
        new CustomEvent('handypro_portfolio_updated', {
          detail: { providerId, workId, deleted: true },
        })
      );
    } catch {}

    this._notifyListeners();
    return updated.find((p) => p.id === providerId);
  },

  getProviderPortfolio(providerId) {
    const providers = this._loadProviders();
    const prov = providers.find((p) => p.id === providerId);
    return prov?.portfolio || [];
  },

  // 3. Provider Profile
  getProviderProfile() {
    try {
      const authUser = localStorage.getItem('auth_user') || localStorage.getItem('user');
      if (authUser) {
        const u = JSON.parse(authUser);
        if (u && (String(u.role).toLowerCase() === 'provider')) return u;
      }
    } catch (e) {}

    const stored = localStorage.getItem(STORAGE_KEY_PROVIDER_PROFILE);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return {
      id: 'prov-active',
      name: 'Service Provider',
      email: '',
      phone: '',
      category: 'plumbing',
      categoryLabel: 'Plumbing Specialist',
      state: 'Tamil Nadu',
      district: 'Chennai',
      place: 'T. Nagar',
      pincode: '600017',
      address: 'No. 25, North Usman Road, T. Nagar',
      locationId: 'chennai',
      locationName: 'Chennai (T. Nagar)',
      coveredPlaces: ['T. Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'Mylapore', 'Guindy'],
      rating: 5.0,
      avatarBg: 'bg-emerald-600',
    };
  },

  updateProviderProfile(profileData) {
    const current = this.getProviderProfile();
    const updated = { ...current, ...profileData };
    localStorage.setItem(STORAGE_KEY_PROVIDER_PROFILE, JSON.stringify(updated));

    const providers = this._loadProviders();
    const updatedList = providers.map((p) => (p.id === updated.id ? { ...p, ...updated } : p));
    localStorage.setItem(STORAGE_KEY_PROVIDERS, JSON.stringify(updatedList));

    // Live MongoDB synchronization
    syncToMongo.updateProvider(updated.id, updated);

    this._notifyListeners();
    return updated;
  },

  // 4. Customer Profile
  getCustomerProfile() {
    try {
      const authUser = localStorage.getItem('auth_user') || localStorage.getItem('user');
      if (authUser) {
        const u = JSON.parse(authUser);
        if (u && u.name) return u;
      }
    } catch (e) {}

    const stored = localStorage.getItem(STORAGE_KEY_CUSTOMER_PROFILE);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY_CUSTOMER_PROFILE, JSON.stringify(INITIAL_CUSTOMER_PROFILE));
      return INITIAL_CUSTOMER_PROFILE;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_CUSTOMER_PROFILE;
    }
  },

  updateCustomerProfile(profileData) {
    const current = this.getCustomerProfile();
    const updated = { ...current, ...profileData };
    localStorage.setItem(STORAGE_KEY_CUSTOMER_PROFILE, JSON.stringify(updated));
    this._notifyListeners();
    return updated;
  },

  // 5. Analytics & Invoices Helper Methods
  getCustomerInvoices(customerNameOrEmail = '') {
    const bookings = this.getBookings();
    const query = String(customerNameOrEmail).trim().toLowerCase();
    
    // Filter bookings relevant to customer
    const userBookings = bookings.filter((b) => {
      if (!query) return true;
      const nameMatch = b.customerName && b.customerName.toLowerCase().includes(query);
      const emailMatch = b.customerEmail && b.customerEmail.toLowerCase().includes(query);
      return nameMatch || emailMatch;
    });

    const completedBookings = userBookings.filter((b) => b.status === 'COMPLETED');
    const totalSpent = completedBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const activeCount = userBookings.filter((b) => b.status === 'PENDING' || b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS').length;

    // Generate clean invoice items
    const invoices = userBookings.map((b) => {
      const baseFee = Math.round((Number(b.amount) || 60) * 0.85);
      const serviceTax = Math.round((Number(b.amount) || 60) * 0.10);
      const platformFee = (Number(b.amount) || 60) - baseFee - serviceTax;

      return {
        invoiceNumber: `INV-2026-${b.id.replace('BK-', '')}`,
        bookingId: b.id,
        serviceTitle: b.serviceTitle,
        category: b.category,
        providerName: b.providerName,
        customerName: b.customerName,
        scheduledDate: b.scheduledDate,
        status: b.status,
        totalAmount: Number(b.amount) || 65,
        baseFee,
        serviceTax,
        platformFee,
        issuedDate: b.completedAt ? b.completedAt.split('T')[0] : b.scheduledDate,
        isEmergency: b.isEmergency,
      };
    });

    return {
      totalSpent,
      completedCount: completedBookings.length,
      activeCount,
      totalBookingsCount: userBookings.length,
      invoices,
    };
  },

  getProviderEarningsAnalytics(providerId = '', providerName = '') {
    const bookings = this.getBookings();
    const providerBookings = bookings.filter((b) => this.isBookingForProvider(b, providerId, providerName));

    const completed = providerBookings.filter((b) => b.status === 'COMPLETED' || b.status === 'ACCEPTED');
    const totalEarnings = completed.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const pendingJobsCount = providerBookings.filter((b) => b.status === 'PENDING').length;
    const acceptedJobsCount = providerBookings.filter((b) => b.status === 'ACCEPTED' || b.status === 'IN_PROGRESS').length;
    const completedJobsCount = providerBookings.filter((b) => b.status === 'COMPLETED').length;

    // Reviews log
    const reviews = providerBookings
      .filter((b) => b.userRating)
      .map((b) => ({
        id: b.id,
        customerName: b.customerName,
        serviceTitle: b.serviceTitle,
        rating: b.userRating,
        comment: b.userReview || 'Excellent service and timely execution!',
        date: b.reviewedAt ? b.reviewedAt.split('T')[0] : b.scheduledDate,
      }));

    const avgRating = reviews.length > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '4.9';

    return {
      totalEarnings,
      completedJobsCount,
      pendingJobsCount,
      acceptedJobsCount,
      avgRating,
      reviewsCount: reviews.length,
      reviews,
      allJobs: providerBookings,
    };
  },

  // 6. AI & Hyperlocal Improvements
  async estimatePrice({ category, complexity = 'standard', isEmergency = false, distanceKm = 3.5, estimatedHours = 1.0 }) {
    try {
      const res = await fetch(`${MONGODB_API_BASE}/ai/estimate-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, complexity, isEmergency, distanceKm, estimatedHours }),
      });
      const data = await res.json();
      if (data.success && data.data) return data.data;
    } catch (e) {}

    const baseRate = category === 'electrical' ? 55 : category === 'hvac' ? 50 : 45;
    const mult = isEmergency ? 1.8 : complexity === 'major' ? 1.5 : 1.0;
    const est = Math.round(baseRate * estimatedHours * mult * 1.08 + 4.99);
    return {
      category,
      complexity,
      isEmergency,
      estimatedAmount: est,
      minEstimate: Math.round(est * 0.9),
      maxEstimate: Math.round(est * 1.15),
      breakdown: { baseLaborCost: Math.round(baseRate * estimatedHours * mult), platformFee: 4.99, serviceTax: Math.round(est * 0.08) },
    };
  },

  async createEmergencyBookingWithAI({ category, address, phone, customerName, description, customerCoords }) {
    try {
      const res = await fetch(`${MONGODB_API_BASE}/customer/bookings/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, address, phone, customerName, description, customerCoords }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const bookings = this.getBookings();
        localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify([data.data, ...bookings]));
        localStorage.setItem(STORAGE_KEY_LATEST_ALERT, JSON.stringify(data.data));
        this._notifyListeners();
        return data;
      }
    } catch (e) {}

    // Fallback local allocation
    const available = this.getProviders({ category });
    const emergencyProv = available.find((p) => p.supportsEmergency) || available[0] || this.getProviders()[0];
    const newBooking = this.createBooking({
      customerId: 'cust-user',
      customerName: customerName || 'Valued Customer',
      customerPhone: phone || '',
      customerAddress: address || 'Emergency Location',
      customerLocation: emergencyProv?.locationName || 'Chennai',
      providerId: emergencyProv?.id || 'prov-active',
      providerName: emergencyProv?.name || 'Emergency Specialist',
      serviceTitle: `🚨 Priority 24/7 Emergency: ${category ? category.toUpperCase() : 'URGENT DISPATCH'}`,
      category: category || 'plumbing',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: 'Immediate (ETA ~25 mins)',
      notes: description || 'Immediate SOS emergency dispatch request.',
      amount: (emergencyProv?.hourlyRate || 50) + 25,
      isEmergency: true,
      status: 'ACCEPTED',
    });
    return { success: true, data: newBooking, allocatedProvider: emergencyProv, etaMinutes: 20 };
  },

  async submitReviewWithAI(bookingId, rating, comment) {
    try {
      const res = await fetch(`${MONGODB_API_BASE}/bookings/${bookingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (data.success) {
        this.addBookingReview(bookingId, rating, comment);
        return data;
      }
    } catch (e) {}
    this.addBookingReview(bookingId, rating, comment);
    return { success: true };
  },

  async processPayment(bookingId, paymentMethod = 'card') {
    try {
      const res = await fetch(`${MONGODB_API_BASE}/bookings/${bookingId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      });
      const data = await res.json();
      if (data.success) {
        const bookings = this.getBookings().map((b) =>
          b.id === bookingId ? { ...b, payment: data.payment, status: b.status === 'PENDING' ? 'ACCEPTED' : b.status } : b
        );
        localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
        this._notifyListeners();
        return data;
      }
    } catch (e) {}
    return { success: true };
  },

  async getAppliances(customerId = 'cust-user') {
    try {
      const res = await fetch(`${MONGODB_API_BASE}/ai/appliances?customerId=${customerId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) return data.data;
    } catch (e) {}
    return [
      {
        id: 'app-1',
        name: 'Daikin Inverter Split AC 1.5 Ton',
        category: 'hvac',
        healthScore: 72,
        status: 'MAINTENANCE_DUE',
        recommendedIntervalDays: 180,
        predictedIssues: ['Filter dust saturation', 'Refrigerant pressure drop'],
        recommendationAction: 'Seasonal chemical wash and gas level tune-up',
      },
      {
        id: 'app-2',
        name: 'Kent Grand Plus RO Water Purifier',
        category: 'water_purifier',
        healthScore: 60,
        status: 'MAINTENANCE_DUE',
        recommendedIntervalDays: 90,
        predictedIssues: ['Sediment filter carbon depletion', 'TDS levels rising'],
        recommendationAction: 'Replace RO sediment and carbon filter cartridges',
      },
    ];
  },

  // 7. Reactive Listeners
  _notifyListeners() {
    window.dispatchEvent(new CustomEvent('handypro_store_update'));
  },

  subscribe(callback) {
    const handler = (e) => callback(e);
    window.addEventListener('handypro_store_update', handler);
    window.addEventListener('handypro_new_appointment', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('handypro_store_update', handler);
      window.removeEventListener('handypro_new_appointment', handler);
      window.removeEventListener('storage', handler);
    };
  },
};

export default dataStore;

// Automatically sync latest registered providers from MongoDB on startup
if (typeof window !== 'undefined') {
  setTimeout(() => {
    dataStore.syncProvidersFromApi();
  }, 10);
}

