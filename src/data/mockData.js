/**
 * Mock Data for Development
 * Path: src/data/mockData.js
 */

export const MOCK_PROVIDERS = [
  {
    id: 'prov-1',
    name: 'David Nicodamas',
    email: 'david@example.com',
    phone: '6374539304',
    category: 'Cleaning',
    rating: 4.8,
    reviewsCount: 24,
    hourlyRate: 25,
    bio: 'Professional residential and office cleaning specialist with 5+ years of experience.',
    isAvailable: true,
  },
  {
    id: 'prov-2',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    phone: '9876543210',
    category: 'Plumbing',
    rating: 4.9,
    reviewsCount: 42,
    hourlyRate: 35,
    bio: 'Licensed plumber specializing in pipe leak repair, drainage, and fixture installation.',
    isAvailable: true,
  },
  {
    id: 'prov-3',
    name: 'Sam Wilson',
    email: 'sam@example.com',
    phone: '8765432109',
    category: 'Electrical',
    rating: 4.7,
    reviewsCount: 18,
    hourlyRate: 30,
    bio: 'Expert electrician for household wiring, appliance installation, and circuit troubleshooting.',
    isAvailable: true,
  },
];

export const MOCK_JOBS = [
  {
    id: 'job-101',
    customerId: 'cust-1',
    customerName: 'John Doe',
    providerId: 'prov-1',
    category: 'Cleaning',
    status: 'pending', // pending, accepted, in_progress, completed
    address: '123 Main Street, Apt 4B',
    date: '2026-09-10',
    time: '10:00 AM',
    notes: 'Deep cleaning required for 2BHK apartment.',
  },
];