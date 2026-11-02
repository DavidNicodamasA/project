/**
 * Centralized Route & Navigation Configuration
 * Path: src/config/routesConfig.js
 */

import { USER_ROLES } from './constants';

// Central Route Path Registry
export const ROUTES = {
  // Public & Auth Routes
  PUBLIC: {
    LANDING: '/',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_OTP: '/auth/verify-otp',
    UNAUTHORIZED: '/unauthorized',
  },

  // User Interface Routes
  USER: {
    HOME: '/user/home',
    SEARCH: '/search',
    PROVIDER_PROFILE: '/provider/:id',
    BOOK_APPOINTMENT: '/book/:id',
    EMERGENCY: '/emergency',
    MY_BOOKINGS: '/my-bookings',
    BOOKING_DETAILS: '/booking/:id',
    SETTINGS: '/settings',
  },

  // Service Provider Interface Routes
  PROVIDER: {
    DASHBOARD: '/provider/dashboard',
    SETUP_PROFILE: '/provider/setup',
    MANAGE_SCHEDULE: '/provider/schedule',
    INCOMING_REQUESTS: '/provider/requests',
    EARNINGS: '/provider/earnings',
    JOB_DETAILS: '/provider/job/:id',
    SETTINGS: '/provider/settings',
  },
};

// Navigation Menu Items for User Interface
export const USER_NAV_ITEMS = [
  {
    label: 'Home',
    path: ROUTES.USER.HOME,
    icon: 'Home',
  },
  {
    label: 'Find Services',
    path: ROUTES.USER.SEARCH,
    icon: 'Search',
  },
  {
    label: 'My Bookings',
    path: ROUTES.USER.MY_BOOKINGS,
    icon: 'Calendar',
  },
  {
    label: 'Emergency SOS',
    path: ROUTES.USER.EMERGENCY,
    icon: 'AlertTriangle',
    isHighlight: true, // Used for distinct styling (e.g. Red SOS badge)
  },
];

// Navigation Menu Items for Provider Interface
export const PROVIDER_NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: ROUTES.PROVIDER.DASHBOARD,
    icon: 'LayoutDashboard',
  },
  {
    label: 'Requests',
    path: ROUTES.PROVIDER.INCOMING_REQUESTS,
    icon: 'Bell',
  },
  {
    label: 'Schedule',
    path: ROUTES.PROVIDER.MANAGE_SCHEDULE,
    icon: 'Clock',
  },
  {
    label: 'Earnings',
    path: ROUTES.PROVIDER.EARNINGS,
    icon: 'DollarSign',
  },
  {
    label: 'Profile Setup',
    path: ROUTES.PROVIDER.SETUP_PROFILE,
    icon: 'UserCheck',
  },
];

// Role-Based Default Redirection Targets
export const DEFAULT_REDIRECTS = {
  [USER_ROLES.USER]: ROUTES.USER.HOME,
  [USER_ROLES.PROVIDER]: ROUTES.PROVIDER.DASHBOARD,
  GUEST: ROUTES.PUBLIC.LOGIN,
};

/**
 * Helper to build dynamic routes with params
 * @param {string} routePath - Base path string with placeholder (e.g., '/provider/:id')
 * @param {string|number} id - Target identifier
 * @returns {string} - Computed path (e.g., '/provider/123')
 */
export const buildDynamicRoute = (routePath, id) => {
  return routePath.replace(':id', id);
};

export default ROUTES;