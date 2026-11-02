/**
 * Register Page
 * Path: src/modules/auth/pages/Register.jsx
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { USER_ROLES, SERVICE_CATEGORIES } from '../../../config/constants';
import { ROUTES } from '../../../config/routesConfig';
import { TAMIL_NADU_DISTRICTS } from '../../../data/tamilNaduLocations';
import api from '../../../services/api';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  UserRound,
  Eye,
  EyeOff,
  MapPin,
  Wrench,
  Clock,
  DollarSign,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.USER,
    // Location Details
    district: 'chennai',
    place: 'T. Nagar',
    address: '',
    pincode: '',
    // Provider Specific Details
    category: SERVICE_CATEGORIES[0].id,
    hourlyRate: 50,
    experienceYears: 4,
    serviceRadiusKm: 25,
    supportsEmergency: true,
    skills: 'Diagnostics, Repair, Installation',
    bio: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { tokens } = useTheme();
  const navigate = useNavigate();

  // Get places for selected district
  const availablePlaces = useMemo(() => {
    const dist = TAMIL_NADU_DISTRICTS.find((d) => d.id === formData.district);
    return dist?.places || ['Central Town', 'Main Road'];
  }, [formData.district]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDistrictChange = (e) => {
    const districtId = e.target.value;
    const dist = TAMIL_NADU_DISTRICTS.find((d) => d.id === districtId);
    const firstPlace = dist?.places?.[0] || 'Central';
    setFormData((prev) => ({
      ...prev,
      district: districtId,
      place: firstPlace,
    }));
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field Validations
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!formData.phone || formData.phone.length < 7) {
      setError('Please provide a valid contact phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedDistObj = TAMIL_NADU_DISTRICTS.find((d) => d.id === formData.district);
      const districtName = selectedDistObj?.name || 'Chennai';
      const coords = selectedDistObj?.coordinates || { lat: 13.0827, lng: 80.2707 };

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
        district: districtName,
        place: formData.place,
        address: formData.address,
        pincode: formData.pincode,
        locationId: formData.district,
        locationName: `${districtName} (${formData.place})`,
        latitude: coords.lat,
        longitude: coords.lng,
        ...(formData.role === USER_ROLES.PROVIDER && {
          category: formData.category,
          categoryLabel:
            SERVICE_CATEGORIES.find((c) => c.id === formData.category)?.name || 'Home Specialist',
          hourlyRate: Number(formData.hourlyRate) || 50,
          experienceYears: Number(formData.experienceYears) || 4,
          serviceRadiusKm: Number(formData.serviceRadiusKm) || 25,
          supportsEmergency: Boolean(formData.supportsEmergency),
          skills: formData.skills,
          bio:
            formData.bio ||
            `Certified ${formData.category} professional ready for service in ${districtName}.`,
        }),
      };

      await api.post('/auth/register', payload);

      // Redirect to OTP Verification with state parameters
      navigate(ROUTES.PUBLIC.VERIFY_OTP, {
        state: {
          email: formData.email,
          role: formData.role,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please check your details and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`auth-page flex min-h-screen items-center justify-center px-4 py-8 transition-colors duration-200 ${tokens.bgSecondary}`}>
      <div className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl shadow-slate-300/40 sm:p-10 lg:p-12">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-xl font-black text-white shadow-lg shadow-sky-600/20">
            H
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Get started with HandyPro</p>
          <h2 className={`text-3xl font-extrabold tracking-tight ${tokens.textPrimary}`}>Create your account</h2>
          <p className={`mt-2 text-sm ${tokens.textSecondary}`}>
            {formData.role === USER_ROLES.PROVIDER
              ? 'Join as an authorized technician to receive hyperlocal client bookings.'
              : 'Join a trusted network for instant, high-quality home services.'}
          </p>
        </div>

        {/* Role Selection Switcher */}
        <div className="mb-7 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => handleRoleSelect(USER_ROLES.USER)}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${
              formData.role === USER_ROLES.USER
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-blue-700 hover:text-blue-900'
            }`}
          >
            <UserRound className="h-4 w-4" /> Customer
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect(USER_ROLES.PROVIDER)}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${
              formData.role === USER_ROLES.PROVIDER
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-blue-700 hover:text-blue-900'
            }`}
          >
            <BriefcaseBusiness className="h-4 w-4" /> Service Provider
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              1. Basic Account Information
            </h3>

            {/* Full Name */}
            <div>
              <label className={`block text-xs font-bold ${tokens.textSecondary} mb-1`}>
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Anand Kumar"
                value={formData.name}
                onChange={handleInputChange}
                className="auth-input"
              />
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={`block text-xs font-bold ${tokens.textSecondary} mb-1`}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="anand@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="auth-input"
                />
              </div>
              <div>
                <label className={`block text-xs font-bold ${tokens.textSecondary} mb-1`}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="auth-input"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location & Address Details */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              <span>2. Hyperlocal Service District & Address</span>
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Operating District */}
              <div>
                <label className={`block text-xs font-bold ${tokens.textSecondary} mb-1`}>
                  District (Tamil Nadu) *
                </label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleDistrictChange}
                  className="auth-input"
                >
                  {TAMIL_NADU_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.region || 'TN'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Specific Locality / Town */}
              <div>
                <label className={`block text-xs font-bold ${tokens.textSecondary} mb-1`}>
                  Locality / Neighborhood *
                </label>
                <select
                  name="place"
                  value={formData.place}
                  onChange={handleInputChange}
                  className="auth-input"
                >
                  {availablePlaces.map((pl, i) => (
                    <option key={i} value={pl}>
                      {pl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Street Address & Pincode Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className={`block text-xs font-bold ${tokens.textSecondary} mb-1`}>
                  Street Address / Door No.
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="e.g. Flat 3B, Rajaji Salai, Near Bus Depot"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="auth-input"
                />
              </div>
              <div>
                <label className={`block text-xs font-bold ${tokens.textSecondary} mb-1`}>
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  placeholder="600017"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="auth-input"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Service Provider Specialization & Professional Details (Conditional) */}
          {formData.role === USER_ROLES.PROVIDER && (
            <div className="space-y-4 pt-2 rounded-2xl bg-blue-50/50 p-4 border border-blue-200">
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-blue-600" />
                <span>3. Technician Services & Rate Configuration</span>
              </h3>

              {/* Primary Trade Specialization */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Home Service Trade *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="auth-input bg-white"
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name} — {cat.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rate & Experience Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-emerald-600" />
                    <span>Hourly Rate ($) *</span>
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="300"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleInputChange}
                    className="auth-input bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-blue-600" />
                    <span>Experience (Years)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleInputChange}
                    className="auth-input bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Service Radius
                  </label>
                  <select
                    name="serviceRadiusKm"
                    value={formData.serviceRadiusKm}
                    onChange={handleInputChange}
                    className="auth-input bg-white"
                  >
                    <option value="10">Within 10 km</option>
                    <option value="15">Within 15 km</option>
                    <option value="25">Within 25 km</option>
                    <option value="50">Within 50 km</option>
                  </select>
                </div>
              </div>

              {/* Specific Skills */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Technician Skills / Specializations (Comma Separated)
                </label>
                <input
                  type="text"
                  name="skills"
                  placeholder="e.g. Pipe Soldering, Leak Detection, P-Trap Replacement, Valve Fix"
                  value={formData.skills}
                  onChange={handleInputChange}
                  className="auth-input bg-white"
                />
              </div>

              {/* Professional Bio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Professional Bio / About Your Work
                </label>
                <textarea
                  rows={2}
                  name="bio"
                  placeholder="Certified professional with 5+ years experience. Guaranteeing high quality on-site workmanship."
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="auth-input bg-white"
                />
              </div>

              {/* Emergency Service Support Checkbox */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="supportsEmergency"
                  name="supportsEmergency"
                  checked={formData.supportsEmergency}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="supportsEmergency" className="text-xs font-bold text-slate-800 cursor-pointer">
                  24/7 Priority Emergency SOS Availability (Accept urgent dispatch calls)
                </label>
              </div>
            </div>
          )}

          {/* Section 4: Security Credentials with View Option */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              {formData.role === USER_ROLES.PROVIDER ? '4. Security Credentials' : '3. Security Credentials'}
            </h3>

            {/* Password & Confirm Password Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={`block text-xs font-bold ${tokens.textSecondary} mb-1`}>
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="auth-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition"
                    title={showPassword ? 'Hide password' : 'View password'}
                    aria-label={showPassword ? 'Hide password' : 'View password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold ${tokens.textSecondary} mb-1`}>
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="auth-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition"
                    title={showConfirmPassword ? 'Hide password' : 'View password'}
                    aria-label={showConfirmPassword ? 'Hide password' : 'View password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-submit mt-4"
          >
            {isSubmitting ? (
              'Creating Account...'
            ) : (
              <>
                <span>{`Register as ${formData.role === USER_ROLES.PROVIDER ? 'Service Provider' : 'Customer'}`}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className={`mt-6 text-center text-xs ${tokens.textSecondary}`}>
          Already have an account?{' '}
          <Link to={ROUTES.PUBLIC.LOGIN} className="font-bold text-blue-600 hover:underline">
            Log In Here
          </Link>
        </p>

      </div>
    </div>
  );
}
