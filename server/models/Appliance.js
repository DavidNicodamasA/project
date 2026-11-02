/**
 * Appliance Mongoose Model for Predictive Maintenance
 * Path: server/models/Appliance.js
 */

import mongoose from 'mongoose';

const applianceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    name: { type: String, required: true }, // e.g. "Daikin Inverter Split AC 1.5 Ton"
    category: {
      type: String,
      enum: ['hvac', 'appliance', 'plumbing', 'electrical', 'water_purifier', 'cleaning'],
      default: 'appliance',
      index: true,
    },
    brand: { type: String, default: '' },
    modelNumber: { type: String, default: '' },
    installationDate: { type: Date, default: () => new Date(Date.now() - 365 * 24 * 3600 * 1000) },
    lastServiceDate: { type: Date, default: () => new Date(Date.now() - 150 * 24 * 3600 * 1000) },
    recommendedIntervalDays: { type: Number, default: 180 }, // e.g. 6 months
    usageLevel: {
      type: String,
      enum: ['LOW', 'MODERATE', 'HIGH', 'EXTREME'],
      default: 'MODERATE',
    },
    operatingConditions: {
      locationType: { type: String, default: 'indoor' },
      dustExposure: { type: String, default: 'moderate' },
      powerFluctuations: { type: String, default: 'occasional' },
    },
    healthScore: { type: Number, default: 85, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['OPTIMAL', 'GOOD', 'MAINTENANCE_DUE', 'CRITICAL_ATTENTION'],
      default: 'GOOD',
    },
    nextMaintenanceDate: { type: Date },
    predictedIssues: [{ type: String }],
    recommendationAction: { type: String, default: 'Standard preventative check' },
    serviceHistory: [
      {
        bookingId: { type: String },
        date: { type: Date },
        technician: { type: String },
        servicePerformed: { type: String },
        cost: { type: Number },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Appliance = mongoose.model('Appliance', applianceSchema);
export default Appliance;

