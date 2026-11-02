/**
 * TechnicianLocation Mongoose Model
 * Path: server/models/TechnicianLocation.js
 */

import mongoose from 'mongoose';

const technicianLocationSchema = new mongoose.Schema(
  {
    providerId: { type: String, required: true, index: true },
    bookingId: { type: String, required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['accepted', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled'],
      default: 'accepted',
      index: true,
    },
    isTrackingActive: { type: Boolean, default: true, index: true },
    estimatedArrivalMinutes: { type: Number, default: 15 },
    lastUpdated: { type: Date, default: Date.now },
    locationHistory: [
      {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

technicianLocationSchema.index({ providerId: 1, bookingId: 1 });

export const TechnicianLocation = mongoose.model('TechnicianLocation', technicianLocationSchema);
export default TechnicianLocation;

