/**
 * Hyperlocal Map & Geolocation Central Configuration
 * Path: src/config/mapConfig.js
 */

export const MAP_CONFIG = {
  // Provider API Keys from environment variables
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',

  // Fallback map center coordinates (Defaulting to city center if GPS is disabled/delayed)
  DEFAULT_CENTER: {
    lat: 13.0827, // Default Latitude (Chennai, India)
    lng: 80.2707, // Default Longitude
  },

  // Map Zoom Levels
  ZOOM: {
    DEFAULT: 14,          // City/neighborhood view
    EMERGENCY_SOS: 16,   // Tight zoom for urgent local dispatches
    SEARCH_RADIUS: 13,   // Broad view for exploring local categories
    STREET_LEVEL: 18,    // High accuracy view for navigation
  },

  // Hyperlocal Search Limits (in kilometers)
  RADIUS_LIMITS: {
    DEFAULT_KM: 5,
    MIN_KM: 1,
    MAX_KM: 25,
    EMERGENCY_DISPATCH_KM: 8, // Max radius to alert providers for SOS requests
  },

  // Custom Map Visual Styles (Light theme optimized for readability)
  MAP_STYLES: {
    MAPBOX_STREETS: 'mapbox://styles/mapbox/streets-v12',
    MAPBOX_NAVIGATION: 'mapbox://styles/mapbox/navigation-day-v1',
    
    // Google Maps UI Options
    GOOGLE_MAPS_OPTIONS: {
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: true,
      gestureHandling: 'greedy',
    },
  },

  // Custom Marker Styling for Map Layers
  MARKERS: {
    USER_LOCATION: {
      color: '#2563EB', // Blue
      label: 'Your Location',
      iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    },
    PROVIDER_ACTIVE: {
      color: '#10B981', // Green
      label: 'Available Provider',
      iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    },
    PROVIDER_BUSY: {
      color: '#F59E0B', // Amber
      label: 'On Job',
      iconUrl: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
    },
    EMERGENCY_SOS: {
      color: '#DC2626', // Red
      label: 'Emergency SOS Signal',
      iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      pulseAnimation: true,
    },
  },

  // Category Specific Marker Emoji/Icons
  CATEGORY_ICONS: {
    electrician: '⚡',
    plumber: '🔧',
    painter: '🎨',
    hvac: '❄️',
    carpenter: '🪚',
    locksmith: '🔑',
    default: '📍',
  },
};

/**
 * Utility helper to construct Google Maps Script Loading URL with libraries
 */
export const getGoogleMapsScriptUrl = () => {
  const apiKey = MAP_CONFIG.GOOGLE_MAPS_API_KEY;
  return `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
};

/**
 * Helper to get the correct icon for a service category
 * @param {string} category 
 * @returns {string} Emoji icon representation
 */
export const getCategoryIcon = (category) => {
  if (!category) return MAP_CONFIG.CATEGORY_ICONS.default;
  const key = category.toLowerCase();
  return MAP_CONFIG.CATEGORY_ICONS[key] || MAP_CONFIG.CATEGORY_ICONS.default;
};

/**
 * Helper to determine map center based on user's current coordinates
 * @param {object} userLocation - { latitude, longitude }
 * @returns {object} - { lat, lng }
 */
export const getMapCenter = (userLocation) => {
  if (userLocation?.latitude && userLocation?.longitude) {
    return {
      lat: userLocation.latitude,
      lng: userLocation.longitude,
    };
  }
  return MAP_CONFIG.DEFAULT_CENTER;
};

export default MAP_CONFIG;