/**
 * SubscriptionPlan Mongoose Model
 * Path: server/models/SubscriptionPlan.js
 */

import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    tier: {
      type: String,
      enum: ['basic', 'standard', 'premium', 'yearly_vip'],
      default: 'standard',
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly',
      index: true,
    },
    price: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    includedVisits: { type: Number, default: 4 },
    includedServices: [{ type: String }],
    features: [{ type: String }],
    priorityDispatch: { type: Boolean, default: false },
    freeDiagnosticInspection: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
export default SubscriptionPlan;

