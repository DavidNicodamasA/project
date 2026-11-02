/**
 * Login Page
 * Path: src/modules/auth/pages/Login.jsx
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../context/ThemeContext';
import { USER_ROLES } from '../../../config/constants';
import { ROUTES } from '../../../config/routesConfig';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ShieldCheck,
  UserRound,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';

export default function Login() {
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.USER);

  // Independent credentials per role so typing in Customer doesn't type into Provider
  const [credentials, setCredentials] = useState({
    [USER_ROLES.USER]: { email: '', password: '' },
    [USER_ROLES.PROVIDER]: { email: '', password: '' },
  });

  // Client-side inline field errors
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [roleMismatch, setRoleMismatch] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { tokens } = useTheme();
  const navigate = useNavigate();

  // Active role's credentials
  const currentCreds = credentials[selectedRole] || { email: '', password: '' };

  // Switch role and isolate/reset states cleanly
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setServerError('');
    setRoleMismatch(null);
    setFieldErrors({ email: '', password: '' });
  };

  // Field validation helpers
  const validateEmail = (val) => {
    if (!val || !val.trim()) {
      return 'Email address is required.';
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(val.trim())) {
      return 'Please enter a valid email address (e.g. name@example.com)';
    }
    return '';
  };

  const validatePassword = (val) => {
    if (!val) {
      return 'Password is required.';
    }
    if (val.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
    return '';
  };

  const handleInputChange = (field, value) => {
    setCredentials((prev) => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [field]: value,
      },
    }));

    // Clear field-specific error as user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }

    // Clear server error as user modifies input
    if (serverError || roleMismatch) {
      setServerError('');
      setRoleMismatch(null);
    }
  };

  const handleBlur = (field) => {
    const val = currentCreds[field];
    if (field === 'email') {
      const err = validateEmail(val);
      if (err) setFieldErrors((prev) => ({ ...prev, email: err }));
    } else if (field === 'password') {
      const err = validatePassword(val);
      if (err) setFieldErrors((prev) => ({ ...prev, password: err }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setRoleMismatch(null);

    const emailErr = validateEmail(currentCreds.email);
    const passErr = validatePassword(currentCreds.password);

    if (emailErr || passErr) {
      setFieldErrors({
        email: emailErr,
        password: passErr,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await login({
        email: currentCreds.email.trim(),
        password: currentCreds.password,
        role: selectedRole,
      });

      // Redirect based on role returned from authentication
      if (user?.role === USER_ROLES.PROVIDER || selectedRole === USER_ROLES.PROVIDER) {
        navigate(ROUTES.PROVIDER.DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.USER.HOME, { replace: true });
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.roleMismatch) {
        setRoleMismatch({
          correctRole: data.correctRole,
          message: data.message,
        });
      } else {
        setServerError(data?.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`auth-page flex min-h-screen items-center justify-center px-4 py-8 transition-colors duration-200 ${tokens.bgSecondary}`}>
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-300/40 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="auth-panel relative hidden min-h-[620px] overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[3rem] border-white/10" />
          <div className="relative">
            <div className="mb-16 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl font-black text-sky-800 shadow-lg">H</div>
              <span className="text-lg font-extrabold tracking-tight">HandyPro</span>
            </div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Home care, made simple</p>
            <h1 className="max-w-sm text-4xl font-extrabold leading-tight">Reliable help for every corner of home.</h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-sky-100">Book trusted professionals, keep every appointment in view, and get back to the things that matter.</p>
          </div>
          <div className="relative space-y-4 text-sm text-sky-50">
            <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-cyan-300" /> Verified local professionals</div>
            <div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-cyan-300" /> Simple, transparent bookings</div>
            <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-cyan-300" /> Support when you need it</div>
          </div>
        </aside>

        <main className="p-6 sm:p-10 lg:p-14">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-lg font-black text-white">H</div>
            <span className="font-extrabold text-slate-900">HandyPro</span>
          </div>
          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Welcome back</p>
            <h2 className={`text-3xl font-extrabold tracking-tight ${tokens.textPrimary}`}>Sign in to your account</h2>
            <p className={`mt-2 text-sm ${tokens.textSecondary}`}>Pick up where you left off with your home services.</p>
          </div>

          {/* Role Switcher */}
          <div className="mb-7 flex rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleRoleChange(USER_ROLES.USER)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${
                selectedRole === USER_ROLES.USER
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-700 hover:text-blue-900'
              }`}
            >
              <UserRound className="h-4 w-4" /> Customer
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange(USER_ROLES.PROVIDER)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${
                selectedRole === USER_ROLES.PROVIDER
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-700 hover:text-blue-900'
              }`}
            >
              <BriefcaseBusiness className="h-4 w-4" /> Provider
            </button>
          </div>

          {/* Role Mismatch Warning with Quick Switch */}
          {roleMismatch && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 shadow-sm animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="font-semibold">{roleMismatch.message}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const targetRole = roleMismatch.correctRole === 'provider' ? USER_ROLES.PROVIDER : USER_ROLES.USER;
                      setSelectedRole(targetRole);
                      setCredentials((prev) => ({
                        ...prev,
                        [targetRole]: { ...prev[targetRole], email: currentCreds.email },
                      }));
                      setRoleMismatch(null);
                      setServerError('');
                      setFieldErrors({ email: '', password: '' });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-amber-700 transition"
                  >
                    Switch to {roleMismatch.correctRole === 'provider' ? 'Provider' : 'Customer'} Tab <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* General Server Error */}
          {serverError && !roleMismatch && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email Field */}
            <div>
              <label className={`mb-2 block text-xs font-bold ${tokens.textSecondary}`}>
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={currentCreds.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`auth-input ${
                  fieldErrors.email ? 'border-red-400 bg-red-50/20 ring-2 ring-red-100 focus:border-red-500' : ''
                }`}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className={`text-xs font-bold ${tokens.textSecondary}`}>
                  Password
                </label>
                <a href="#forgot" className="text-xs font-semibold text-blue-600 hover:underline">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={currentCreds.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`auth-input pr-11 ${
                    fieldErrors.password ? 'border-red-400 bg-red-50/20 ring-2 ring-red-100 focus:border-red-500' : ''
                  }`}
                  autoComplete="current-password"
                />
                {/* Single View Password Option */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
                  title={showPassword ? 'Hide password' : 'View password'}
                  aria-label={showPassword ? 'Hide password' : 'View password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-submit"
            >
              {isSubmitting
                ? 'Signing you in...'
                : `Continue as ${selectedRole === USER_ROLES.PROVIDER ? 'Provider' : 'Customer'}`}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Footer Link */}
          <p className={`mt-8 text-center text-sm ${tokens.textSecondary}`}>
            Don't have an account?{' '}
            <Link to={ROUTES.PUBLIC.REGISTER} className="font-bold text-blue-600 hover:underline">
              Create an account
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
