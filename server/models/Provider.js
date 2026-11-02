/**
 * Provider Mongoose Model
 * Path: server/models/Provider.js
 */

import mongoose from 'mongoose';

const providerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    categoryLabel: { type: String, default: '' },
    rating: { type: Number, default: 4.8 },
    reviewsCount: { type: Number, default: 0 },
    hourlyRate: { type: Number, required: true },
    state: { type: String, default: 'Tamil Nadu' },
    district: { type: String, default: 'Chennai' },
    place: { type: String, default: 'T. Nagar' },
    address: { type: String, default: '' },
    pincode: { type: String, default: '' },
    locationId: { type: String, default: 'chennai' },
    locationName: { type: String, default: 'Chennai (T. Nagar)' },
    latitude: { type: Number, default: 13.0827 },
    longitude: { type: Number, default: 80.2707 },
    baseDistanceMiles: { type: Number, default: 1.5 },
    serviceRadiusKm: { type: Number, default: 25 },
    experienceYears: { type: Number, default: 5 },
    isAvailable: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },
    supportsEmergency: { type: Boolean, default: false },
    bio: { type: String, default: '' },
    skills: [{ type: String }],
    coveredPlaces: [{ type: String }],
    avatarBg: { type: String, default: 'bg-blue-600' },
    completedJobsCount: { type: Number, default: 0 },
    acceptanceRate: { type: Number, default: 98 },
    averageResponseTimeMin: { type: Number, default: 15 },
    sentimentScore: { type: Number, default: 0.95 },
    sentimentLabel: { type: String, default: 'Positive' },
    portfolio: [
      {
        id: { type: String, default: () => `work_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` },
        title: { type: String, required: true },
        category: { type: String, default: '' },
        description: { type: String, default: '' },
        imageUrl: { type: String, required: true },
        completedDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
        customerLocation: { type: String, default: '' },
        tags: [{ type: String }],
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Provider = mongoose.model('Provider', providerSchema);
export default Provider;
