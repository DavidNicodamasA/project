/**
 * ServiceWarranty Mongoose Model
 * Path: server/models/ServiceWarranty.js
 */

import mongoose from 'mongoose';

const serviceWarrantySchema = new mongoose.Schema(
  {
    warrantyId: { type: String, required: true, unique: true, index: true },
    bookingId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, default: 'Customer' },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    providerId: { type: String, required: true, index: true },
    providerName: { type: String, default: 'HandyPro Specialist' },
    serviceCategory: { type: String, required: true },
    serviceTitle: { type: String, required: true },
    completionDate: { type: Date, default: Date.now },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true, index: true },
    durationDays: { type: Number, default: 90 },
    terms: {
      type: [String],
      default: [
        'Covers free re-inspection and corrective repairs for the exact serviced issue.',
        'Parts replaced carry direct manufacturer warranty.',
        'Excludes accidental damage, misuse, or third-party unauthorized repairs.',
      ],
    },
    coverageDetails: {
      workmanship: { type: Boolean, default: true },
      partsIncluded: { type: Boolean, default: true },
      freeRevisit: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ['active', 'claimed', 'expired', 'voided'],
      default: 'active',
      index: true,
    },
    claimsCount: { type: Number, default: 0 },
    issuedBy: { type: String, default: 'Provider' },
  },
  {
    timestamps: true,
  }
);

serviceWarrantySchema.index({ customerId: 1, status: 1 });

export const ServiceWarranty = mongoose.model('ServiceWarranty', serviceWarrantySchema);
export default ServiceWarranty;

