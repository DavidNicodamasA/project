/**
 * OTP Verification Page
 * Path: src/modules/auth/pages/VerifyOTP.jsx
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../context/ThemeContext';
import { ROUTES } from '../../../config/routesConfig';
import { USER_ROLES } from '../../../config/constants';
import api from '../../../services/api';

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;

export default function VerifyOTP() {
  const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(''));
  const [timer, setTimer] = useState(COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef([]);
  const { completeLogin } = useAuth();
  const { tokens } = useTheme();
  const navigate = useNavigate();
  const locationState = useLocation().state;

  const email = locationState?.email || 'your email';
  const role = locationState?.role || USER_ROLES.USER;

  // Countdown timer effect
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // Handle auto focus transition across OTP input boxes
  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Take only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        // Focus previous input on backspace if current box is empty
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pastedData)) return; // Digits only

    const digits = pastedData.slice(0, OTP_LENGTH).split('');
    const newOtp = [...otp];
    
    digits.forEach((digit, index) => {
      newOtp[index] = digit;
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = digit;
      }
    });

    setOtp(newOtp);
    const focusIndex = Math.min(digits.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const otpString = otp.join('');

    if (otpString.length < OTP_LENGTH) {
      setError(`Please enter the full ${OTP_LENGTH}-digit code.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: otpString,
        role,
      });

      if (response.data?.token) {
        completeLogin(response.data.user, response.data.token);
      }

      // Redirect based on user role
      if (role === USER_ROLES.PROVIDER) {
        navigate(ROUTES.PROVIDER.DASHBOARD, { replace: true });
      } else {
        navigate(ROUTES.USER.HOME, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setError('');

    try {
      await api.post('/auth/resend-otp', { email });
      setTimer(COUNTDOWN_SECONDS);
      setCanResend(false);
      setOtp(new Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center ${tokens.bgSecondary} px-4 py-12 transition-colors duration-200`}>
      <div className={`w-full max-w-md rounded-2xl ${tokens.bgCard} p-8 shadow-xl border ${tokens.border}`}>
        
        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-xl mb-3 border border-blue-200 shadow-sm">
            🔒
          </div>
          <h2 className={`text-2xl font-bold ${tokens.textPrimary}`}>Verify One-Time Code</h2>
          <p className={`text-xs ${tokens.textSecondary} mt-2`}>
            We have sent a 6-digit verification code to <br />
            <span className="font-semibold text-blue-600">{email}</span>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* OTP Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`h-12 w-12 rounded-xl border border-blue-200 bg-white text-center text-lg font-bold text-slate-800 shadow-sm outline-none transition ${tokens.ring}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full rounded-xl ${tokens.brandPrimary} py-3 text-sm font-bold shadow-md transition duration-150 active:scale-[0.99] disabled:opacity-50`}
          >
            {isSubmitting ? 'Verifying Code...' : 'Verify & Continue'}
          </button>
        </form>

        {/* Resend Timer & Actions */}
        <div className="mt-6 text-center text-xs space-y-2">
          <p className={tokens.textSecondary}>
            Didn't receive the code?{' '}
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-bold text-blue-600 hover:underline disabled:opacity-50"
              >
                {isResending ? 'Resending...' : 'Resend Code'}
              </button>
            ) : (
              <span className="font-semibold text-slate-400">
                Resend in <span className="text-blue-600 font-bold">{timer}s</span>
              </span>
            )}
          </p>

          <div>
            <Link to={ROUTES.PUBLIC.LOGIN} className="font-semibold text-slate-500 hover:text-blue-600 transition">
              ← Back to Login
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}