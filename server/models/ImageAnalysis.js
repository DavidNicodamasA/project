/**
 * ImageAnalysis Mongoose Model
 * Path: server/models/ImageAnalysis.js
 */

import mongoose from 'mongoose';

const imageAnalysisSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, default: 'Customer' },
    imageUrl: { type: String, required: true },
    detectedIssues: [{ type: String }],
    primaryIssue: { type: String, default: 'Unspecified Household Issue' },
    predictedCategory: {
      type: String,
      enum: ['plumbing', 'electrical', 'hvac', 'cleaning', 'carpentry', 'painting', 'appliance', 'general'],
      default: 'general',
      index: true,
    },
    confidenceScore: { type: Number, default: 0.85 },
    urgencyLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'emergency'],
      default: 'medium',
      index: true,
    },
    recommendedSkills: [{ type: String }],
    problemDescription: { type: String, default: '' },
    safetyNotice: {
      type: String,
      default: '⚠️ AI diagnostic prediction only. Never declare gas, electrical, or structural issues safe without professional on-site evaluation.',
    },
    estimatedPriceRange: {
      min: { type: Number, default: 45 },
      max: { type: Number, default: 95 },
    },
    bookingId: { type: String, default: null },
    status: {
      type: String,
      enum: ['analyzed', 'converted_to_booking', 'discarded'],
      default: 'analyzed',
    },
  },
  {
    timestamps: true,
  }
);

export const ImageAnalysis = mongoose.model('ImageAnalysis', imageAnalysisSchema);
export default ImageAnalysis;

