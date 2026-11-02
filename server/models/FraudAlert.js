/**
 * FraudAlert Mongoose Model
 * Path: server/models/FraudAlert.js
 */

import mongoose from 'mongoose';

const fraudAlertSchema = new mongoose.Schema(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: [
        'fake_booking_pattern',
        'excessive_cancellation',
        'suspicious_review',
        'unusual_provider_activity',
        'duplicate_transactions',
        'location_spoofing',
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    targetId: { type: String, required: true, index: true },
    targetType: {
      type: String,
      enum: ['user', 'provider', 'booking', 'review', 'transaction'],
      required: true,
    },
    targetName: { type: String, default: '' },
    anomalyScore: { type: Number, required: true, default: 0.5 }, // 0.0 to 1.0
    description: { type: String, required: true },
    reasons: [{ type: String }],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['under_review', 'resolved_safe', 'flagged_restricted', 'dismissed'],
      default: 'under_review',
      index: true,
    },
    actionTaken: { type: String, default: 'None' },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    reviewNotes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

fraudAlertSchema.index({ targetType: 1, targetId: 1 });

export const FraudAlert = mongoose.model('FraudAlert', fraudAlertSchema);
export default FraudAlert;

