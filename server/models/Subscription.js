/**
 * Subscription Mongoose Model
 * Path: server/models/Subscription.js
 */

import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, default: 'HandyPro Customer' },
    customerPhone: { type: String, default: '' },
    planId: { type: String, required: true, index: true },
    planName: { type: String, required: true },
    tier: { type: String, default: 'standard' },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    pricePaid: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'waived', 'failed'],
      default: 'paid',
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'expired', 'cancelled'],
      default: 'active',
      index: true,
    },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true, index: true },
    totalVisits: { type: Number, default: 4 },
    usedVisits: { type: Number, default: 0 },
    remainingVisits: { type: Number, default: 4 },
    nextMaintenanceReminder: { type: Date },
    serviceBookingsHistory: [
      {
        bookingId: { type: String },
        serviceCategory: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ customerId: 1, status: 1 });

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;

