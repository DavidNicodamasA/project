/**
 * User / Customer Mongoose Model
 * Path: server/models/User.js
 */

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: '' },
    phone: { type: String, default: '' },
    role: { type: String, default: 'customer' },
    category: { type: String, default: '' },
    state: { type: String, default: 'Tamil Nadu' },
    district: { type: String, default: 'Chennai' },
    place: { type: String, default: 'T. Nagar' },
    pincode: { type: String, default: '' },
    locationId: { type: String, default: 'chennai' },
    locationName: { type: String, default: 'Chennai (T. Nagar)' },
    customLocation: { type: String, default: '' },
    address: { type: String, default: '' },
    latitude: { type: Number, default: 13.0827 },
    longitude: { type: Number, default: 80.2707 },
    avatarLetter: { type: String, default: 'U' },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
export default User;
