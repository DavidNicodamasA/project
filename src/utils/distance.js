/**
 * Spatial & Distance Utilities
 * Path: src/utils/distance.js
 */

/**
 * Calculate the straight-line (Great Circle) distance between two GPS points using Haversine formula
 * @param {number} lat1 - Latitude of origin
 * @param {number} lon1 - Longitude of origin
 * @param {number} lat2 - Latitude of destination
 * @param {number} lon2 - Longitude of destination
 * @param {'km' | 'mi'} unit - Unit of distance (default: 'km')
 * @returns {number} Distance rounded to 2 decimal places
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2, unit = 'km') {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 0;
  }

  const R = unit === 'mi' ? 3958.8 : 6371; // Earth's mean radius in miles or kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Format a raw distance number into a localized label string
 * @param {number} distance - Distance value
 * @param {'km' | 'mi'} unit - Unit label ('km' or 'mi')
 * @returns {string} e.g., "3.2 km" or "800 m"
 */
export function formatDistance(distance, unit = 'km') {
  if (distance === undefined || distance === null || isNaN(distance)) {
    return 'N/A';
  }

  if (unit === 'km' && distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }

  if (unit === 'mi' && distance < 0.1) {
    return `${Math.round(distance * 5280)} ft`;
  }

  return `${distance.toFixed(1)} ${unit}`;
}

/**
 * Estimate travel time (ETA) based on distance and mode of transport
 * @param {number} distanceKm - Distance in kilometers
 * @param {'driving' | 'biking' | 'walking'} mode - Mode of transport
 * @returns {number} Estimated time in minutes
 */
export function estimateTravelTime(distanceKm, mode = 'driving') {
  if (!distanceKm || distanceKm <= 0) return 0;

  // Average speeds in km/h including urban congestion factors
  const speeds = {
    driving: 30, // Urban traffic average (~30 km/h)
    biking: 15,  // Bicycle / scooter (~15 km/h)
    walking: 5,  // Pedestrian (~5 km/h)
  };

  const speed = speeds[mode] || speeds.driving;
  const hours = distanceKm / speed;
  const minutes = Math.ceil(hours * 60);

  return minutes;
}

/**
 * Check whether a target coordinate is within a given radius from a central point
 * @param {{ lat: number, lng: number }} center - Center point
 * @param {{ lat: number, lng: number }} target - Target point
 * @param {number} radiusKm - Maximum radius threshold in kilometers
 * @returns {boolean}
 */
export function isWithinRadius(center, target, radiusKm) {
  if (!center || !target || radiusKm === undefined) return false;
  const dist = calculateHaversineDistance(center.lat, center.lng, target.lat, target.lng, 'km');
  return dist <= radiusKm;
}

/**
 * Helper: Convert degrees to radians
 */
function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

export default {
  calculateHaversineDistance,
  formatDistance,
  estimateTravelTime,
  isWithinRadius,
};