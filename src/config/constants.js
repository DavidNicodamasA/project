/**
 * Application Constants
 * Path: src/config/constants.js
 */

export const USER_ROLES = {
  CUSTOMER: 'customer',
  USER: 'customer',
  PROVIDER: 'provider',
  ADMIN: 'admin',
};

// Alias for files importing ROLES instead of USER_ROLES
export const ROLES = USER_ROLES;

export const SERVICE_CATEGORIES = [
  { id: 'all', name: 'All Services', icon: '✦', description: 'Explore all certified hyperlocal home specialists' },
  { id: 'interior-design', name: 'Interior Design & Modular Decor', icon: '🛋️', description: 'Modular kitchen, living room 3D planning, false ceilings, and decor' },
  { id: 'carpentry', name: 'Carpentry & Furniture', icon: '🪚', description: 'Custom furniture, door alignment, hinges, locks, and wooden repairs' },
  { id: 'painting', name: 'Painting & Waterproofing', icon: '🎨', description: 'Interior/exterior wall painting, damp proofing, and aesthetic texture' },
  { id: 'team-services', name: 'Group of People / Team Crew Services', icon: '👥', description: 'Multi-worker teams for painting crews, deep house cleaning, moving, & renovation' },
  { id: 'plumbing', name: 'Plumbing & Pipe Fitting', icon: '🔧', description: 'Leaks, faucets, blockages, water heaters, and sanitary pipe repairs' },
  { id: 'electrical', name: 'Electrical & Wiring', icon: '⚡', description: 'MCB switches, short circuits, lighting fixtures, inverters, and fans' },
  { id: 'hvac', name: 'AC & HVAC Cooling', icon: '❄️', description: 'AC servicing, coil deep cleaning, refrigerant gas recharge, and tune-ups' },
  { id: 'cleaning', name: 'Deep Home Cleaning Squad', icon: '🧹', description: 'Full house deep clean, kitchen degreasing, and bathroom sanitization' },
  { id: 'appliance-repair', name: 'Appliance & Gadget Repair', icon: '🔌', description: 'Washing machines, refrigerators, microwaves, TVs, and electronics' },
  { id: 'water-purifier', name: 'Water Purifier & RO', icon: '💧', description: 'Filter replacement, membrane service, TDS checks, and water tests' },
  { id: 'pest-control', name: 'Pest Control & Fumigation', icon: '🐜', description: 'Termite, cockroach, bed bug, and rodent eradication' },
  { id: 'cctv-security', name: 'CCTV & Smart Security', icon: '📹', description: 'Camera installation, optical setup, DVR, and biometric locks' },
  { id: 'solar-inverter', name: 'Solar Panels & Inverters', icon: '🔋', description: 'Rooftop solar, battery backup, and inverter repairs' },
  { id: 'handyman', name: 'General Handyman', icon: '🛠️', description: 'Curtain rod mounting, drill work, minor home fixes, and hardware setup' },
  { id: 'gardening', name: 'Gardening & Landscaping', icon: '🌱', description: 'Lawn mowing, pruning, plant care, and pest spray' },
  { id: 'packers-movers', name: 'Packers & Movers Crew', icon: '📦', description: 'Home relocation, heavy furniture moving, and safe transit' },
];

export const BOOKING_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const API_ROUTES = {
  AUTH: '/auth',
  CUSTOMER: '/customer',
  PROVIDER: '/provider',
  JOBS: '/jobs',
};

export default {
  USER_ROLES,
  ROLES,
  SERVICE_CATEGORIES,
  BOOKING_STATUS,
  API_ROUTES,
};
