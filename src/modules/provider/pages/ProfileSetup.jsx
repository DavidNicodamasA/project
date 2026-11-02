/**
 * Provider Profile Setup & Specialization Settings Page
 * Path: src/modules/provider/pages/ProfileSetup.jsx
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar';
import { useAuth } from '../../../hooks/useAuth';
import dataStore, { SERVICE_CATEGORIES } from '../../../services/dataStore';
import {
  TAMIL_NADU_DISTRICTS,
  getDistrictById,
  findDistrictByName,
  getPlacesForDistrict,
  formatFullAddress,
  DEFAULT_DISTRICT_ID,
  DEFAULT_PLACE,
} from '../../../data/tamilNaduLocations';
import {
  User,
  Briefcase,
  DollarSign,
  MapPin,
  Check,
  X,
  Plus,
  ArrowLeft,
  ShieldCheck,
  Save,
  Zap,
} from 'lucide-react';

export default function ProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    experienceYears: '6',
    category: 'plumbing',
    categoryLabel: 'Plumbing',
    hourlyRate: '45',
    serviceRadiusKm: '20',
    bio: '',
    state: 'Tamil Nadu',
    district: DEFAULT_DISTRICT_ID,
    place: DEFAULT_PLACE,
    address: '',
    pincode: '600017',
    locationName: 'Chennai (T. Nagar)',
    coveredPlaces: ['T. Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'Mylapore', 'Guindy'],
    skills: ['Leak Detection', 'Pipe Repair', 'Drain Cleaning'],
    supportsEmergency: true,
  });

  const [newSkillInput, setNewSkillInput] = useState('');

  useEffect(() => {
    const p = dataStore.getProviderProfile();
    if (p) {
      const distId = p.district || DEFAULT_DISTRICT_ID;
      const distObj = getDistrictById(distId);
      const placeVal = p.place || distObj?.places?.[0] || DEFAULT_PLACE;
      const initialPlaces = Array.isArray(p.coveredPlaces) && p.coveredPlaces.length > 0
        ? p.coveredPlaces
        : getPlacesForDistrict(distId);

      setFormData({
        name: user?.name || p.name || 'Service Provider',
        phone: p.phone || '+91 98401 23456',
        experienceYears: String(p.experienceYears || '6'),
        category: p.category || 'plumbing',
        categoryLabel: p.categoryLabel || 'Plumbing Specialist',
        hourlyRate: String(p.hourlyRate || '45'),
        serviceRadiusKm: String(p.serviceRadiusKm || '25'),
        bio: p.bio || 'Master certified plumber specializing in leak repairs, drainage, and emergency fixes across Tamil Nadu.',
        state: 'Tamil Nadu',
        district: distId,
        place: placeVal,
        address: p.address || '',
        pincode: p.pincode || '600017',
        locationName: p.locationName || `${distObj?.name || 'Chennai'} (${placeVal})`,
        coveredPlaces: initialPlaces,
        skills: p.skills || ['Leak Detection', 'Pipe Repair', 'Drain Cleaning'],
        supportsEmergency: p.supportsEmergency ?? true,
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'district') {
      const distObj = getDistrictById(value);
      const distPlaces = getPlacesForDistrict(value);
      const defaultPlace = distPlaces[0] || '';
      setFormData((prev) => ({
        ...prev,
        district: value,
        place: defaultPlace,
        coveredPlaces: distPlaces.slice(0, 8),
        locationName: `${distObj?.name || value} (${defaultPlace})`,
      }));
      return;
    }

    if (name === 'place') {
      const distObj = getDistrictById(formData.district);
      setFormData((prev) => ({
        ...prev,
        place: value,
        locationName: `${distObj?.name || formData.district} (${value})`,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleToggleCoveredPlace = (pl) => {
    setFormData((prev) => {
      const list = Array.isArray(prev.coveredPlaces) ? [...prev.coveredPlaces] : [];
      if (list.includes(pl)) {
        if (pl === prev.place) return prev;
        return { ...prev, coveredPlaces: list.filter((x) => x !== pl) };
      } else {
        return { ...prev, coveredPlaces: [...list, pl] };
      }
    });
  };

  const handleSelectAllPlaces = () => {
    const all = getPlacesForDistrict(formData.district);
    setFormData((prev) => ({ ...prev, coveredPlaces: all }));
  };

  const handleClearPlaces = () => {
    setFormData((prev) => ({ ...prev, coveredPlaces: [prev.place] }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    if (formData.skills.includes(newSkillInput.trim())) return;

    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, newSkillInput.trim()],
    }));
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ type: '', text: '' });

    const selectedCatObj = SERVICE_CATEGORIES.find((c) => c.id === formData.category);
    const distObj = getDistrictById(formData.district);

    const fullAddr = formatFullAddress({
      address: formData.address,
      place: formData.place,
      district: distObj?.name || formData.district,
      pincode: formData.pincode,
    });

    const updated = dataStore.updateProviderProfile({
      ...formData,
      state: 'Tamil Nadu',
      district: distObj?.name || formData.district,
      place: formData.place,
      address: fullAddr,
      pincode: formData.pincode,
      locationId: formData.district,
      locationName: `${distObj?.name || formData.district} (${formData.place})`,
      latitude: distObj?.lat || 13.0827,
      longitude: distObj?.lng || 80.2707,
      experienceYears: Number(formData.experienceYears) || 5,
      hourlyRate: Number(formData.hourlyRate) || 45,
      serviceRadiusKm: Number(formData.serviceRadiusKm) || 20,
      categoryLabel: selectedCatObj ? selectedCatObj.name : formData.categoryLabel,
    });

    setIsSaving(false);
    setFeedback({ type: 'success', text: 'Tamil Nadu trade profile, workshop location, and rates saved!' });
    setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header Title & Back Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              Provider Trade Registry
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1 font-display">Service Profile & Trade Setup</h1>
            <p className="text-xs text-slate-500 font-medium">
              Update your trade specialization, hourly pricing rates, coverage radius, and personal details
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/provider/dashboard')}
            className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition shadow-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-600" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback.text && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback({ type: '', text: '' })}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Contact Information */}
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 font-display">
              Technician Contact Details
            </h2>

            {/* Avatar Header */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-md">
                {formData.name ? formData.name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 font-display">{formData.name}</h3>
                <p className="text-xs text-slate-500 font-medium">Verified Service Technician Profile</p>
              </div>
            </div>

            {/* Name, Phone, Base Address Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Full Technician Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 font-bold outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 font-bold outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Tamil Nadu Location & Registered Workshop Address */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-700" />
                <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                  Tamil Nadu Registered Location & Workshop
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Operating District (Tamil Nadu)
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-bold outline-none focus:border-emerald-600 shadow-2xs"
                  >
                    {TAMIL_NADU_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.region} TN)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Locality / Town Base
                  </label>
                  <select
                    name="place"
                    value={formData.place}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-bold outline-none focus:border-emerald-600 shadow-2xs"
                  >
                    {getPlacesForDistrict(formData.district).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Workshop Street / Door No. / Landmark
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="e.g. No. 14, Main Road, Near Bus Stand"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-medium outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIN Code (Tamil Nadu)
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="e.g. 600017"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-bold outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Service Places Coverage Multi-Selector */}
              <div className="pt-2 border-t border-emerald-200/60 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="block text-xs font-black text-emerald-950">
                    Service Localities & Places in {getDistrictById(formData.district)?.name} ({getPlacesForDistrict(formData.district).length} Places)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllPlaces}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      Select All Places
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleClearPlaces}
                      className="text-[11px] font-bold text-slate-500 hover:underline"
                    >
                      Reset to Base Only
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-emerald-100">
                  {getPlacesForDistrict(formData.district).map((pl) => {
                    const isBase = formData.place === pl;
                    const isSelected = (formData.coveredPlaces && formData.coveredPlaces.includes(pl)) || isBase;
                    return (
                      <button
                        key={pl}
                        type="button"
                        onClick={() => handleToggleCoveredPlace(pl)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                          isBase
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                            : isSelected
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{isBase ? '📍 Base: ' : isSelected ? '✓ ' : '+ '}</span>
                        <span>{pl}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500">
                  Selected {formData.coveredPlaces?.length || 1} localities for job alerts and customer appointment routing.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Professional Bio & Overview
              </label>
              <textarea
                name="bio"
                rows="3"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 font-medium outline-none focus:bg-white focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Trade & Pricing Section */}
          <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 font-display">
              Trade Specialization & Hourly Pricing
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Primary Trade Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 font-bold outline-none focus:bg-white focus:border-emerald-600"
                >
                  {SERVICE_CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Years of Professional Experience
                </label>
                <input
                  type="number"
                  name="experienceYears"
                  min="0"
                  max="50"
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 font-bold outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Hourly Service Rate ($ USD)
                </label>
                <input
                  type="number"
                  name="hourlyRate"
                  min="1"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 font-bold outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Service Radius (Km)
                </label>
                <input
                  type="number"
                  name="serviceRadiusKm"
                  min="1"
                  max="100"
                  value={formData.serviceRadiusKm}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 font-bold outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Skills Tags Manager */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Specialized Skills & Tool Badges
              </label>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="e.g. Copper Pipe Soldering"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 font-bold outline-none focus:bg-white focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 shadow-xs transition"
                >
                  + Add Skill
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-200"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-red-600 font-bold ml-1"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Emergency SOS Toggle */}
            <label className="flex items-start gap-3 p-4 rounded-2xl border border-red-200 bg-red-50/60 cursor-pointer">
              <input
                type="checkbox"
                name="supportsEmergency"
                checked={formData.supportsEmergency}
                onChange={handleInputChange}
                className="mt-1 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <div>
                <p className="text-xs font-black text-red-900">🚨 Enable 24/7 Emergency SOS Callouts</p>
                <p className="text-[11px] text-red-700 font-medium mt-0.5">
                  Allows urgent emergency dispatch requests to reach your technician station.
                </p>
              </div>
            </label>

          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition active:scale-[0.99] flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving Settings...' : 'Save Profile Settings'}</span>
            </button>
          </div>

        </form>

      </main>
    </div>
  );
}