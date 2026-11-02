/**
 * Booking Mongoose Model
 * Path: server/models/Booking.js
 */

import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, default: 'cust-demo-1' },
    customerName: { type: String, required: true },
    customerPhone: { type: String, default: '' },
    customerAddress: { type: String, default: '' },
    customerLocation: { type: String, default: '' },
    providerId: { type: String, required: true, index: true },
    providerName: { type: String, required: true },
    serviceTitle: { type: String, required: true },
    category: { type: String, default: 'general' },
    scheduledDate: { type: String, required: true },
    scheduledTime: { type: String, required: true },
    notes: { type: String, default: '' },
    amount: { type: Number, required: true },
    isEmergency: { type: Boolean, default: false },
    proposedTime: { type: String, default: '' },
    proposedDate: { type: String, default: '' },
    rescheduleReason: { type: String, default: '' },
    rescheduleStatus: {
      type: String,
      enum: ['NONE', 'PROPOSED_BY_PROVIDER', 'ACCEPTED_BY_CUSTOMER', 'REJECTED_BY_CUSTOMER'],
      default: 'NONE',
    },
    rescheduledAt: { type: Date },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    rating: { type: Number },
    reviewComment: { type: String },
    cancellationReason: { type: String },
    acceptedAt: { type: Date },
    inProgressAt: { type: Date },
    completedAt: { type: Date },
    reviewSentiment: {
      score: { type: Number },
      label: { type: String }, // 'Positive', 'Neutral', 'Negative'
      summary: { type: String },
      aspects: [{ type: String }],
    },
    payment: {
      status: {
        type: String,
        enum: ['UNPAID', 'PENDING', 'PAID', 'REFUNDED'],
        default: 'UNPAID',
      },
      method: { type: String, default: 'card' },
      transactionId: { type: String, default: '' },
      paidAt: { type: Date },
      baseFee: { type: Number },
      serviceTax: { type: Number },
      platformFee: { type: Number },
      totalPaid: { type: Number },
    },
    allocatedBy: {
      type: String,
      enum: ['direct', 'ai_smart_recommendation', 'emergency_sos_dispatch', 'customer_ai_assistant'],
      default: 'direct',
    },
    trackingHistory: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        message: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
