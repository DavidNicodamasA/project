/**
 * Formatting Utility Functions & Reusable Badge Components
 * Path: src/utils/formatters.jsx
 */

import React from 'react';

// ==========================================
// 1. PURE FORMATTING UTILITY FUNCTIONS
// ==========================================

/**
 * Format a numeric amount as currency (USD default)
 * @param {number} amount - Numeric value
 * @param {string} currency - Currency code ('USD', 'INR', 'EUR', etc.)
 * @returns {string} e.g., "$125.00" or "₹1,250.00"
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a JS Date object, ISO string, or timestamp into a localized readable date
 * @param {Date|string|number} date - Date representation
 * @param {Intl.DateTimeFormatOptions} [options] - Optional Intl formatting overrides
 * @returns {string} e.g., "Oct 14, 2026"
 */
export function formatDate(date, options = {}) {
  if (!date) return 'N/A';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'Invalid Date';

  const defaultOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  };

  return new Intl.DateTimeFormat('en-US', defaultOptions).format(parsedDate);
}

/**
 * Format time from a Date or ISO string
 * @param {Date|string} date
 * @returns {string} e.g., "02:30 PM"
 */
export function formatTime(date) {
  if (!date) return 'N/A';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return 'N/A';

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsedDate);
}

/**
 * Calculate human-readable relative time string ("2 hours ago", "In 3 days")
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - parsedDate.getTime()) / 1000);

  if (Math.abs(diffInSeconds) < 60) return 'Just now';

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(diffInSeconds / 3600);
  const days = Math.floor(diffInSeconds / 86400);

  if (days > 0) return rtf.format(-days, 'day');
  if (hours > 0) return rtf.format(-hours, 'hour');
  if (minutes > 0) return rtf.format(-minutes, 'minute');

  return rtf.format(Math.round(diffInSeconds), 'second');
}

/**
 * Format a raw phone string into a standard readable mask
 * @param {string} phone
 * @returns {string} e.g., "(555) 234-5678"
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

/**
 * Format byte counts into human-readable size labels
 * @param {number} bytes
 * @returns {string} e.g., "2.4 MB"
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}


// ==========================================
// 2. REUSABLE REACT BADGE COMPONENTS
// ==========================================

/**
 * StatusBadge Component
 * Renders a color-coded status pill with White & Blue design tokens
 * 
 * @param {Object} props
 * @param {'pending'|'accepted'|'in_progress'|'completed'|'cancelled'|'declined'|'emergency'|string} props.status
 * @param {string} [props.className] - Additional Tailwind classes
 */
export function StatusBadge({ status, className = '' }) {
  const normalized = (status || '').toLowerCase().replace(/ /g, '_');

  const config = {
    pending: {
      label: 'Pending',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    accepted: {
      label: 'Accepted',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      dot: 'bg-indigo-500',
    },
    completed: {
      label: 'Completed',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    },
    declined: {
      label: 'Declined',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
    },
    emergency: {
      label: 'Emergency SOS',
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-300',
      dot: 'bg-red-600 animate-ping',
    },
  };

  const current = config[normalized] || {
    label: status || 'Unknown',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
}

/**
 * RatingStars Component
 * Renders star ratings with support for half stars and numeric totals
 * 
 * @param {Object} props
 * @param {number} props.rating - Numerical rating (0 to 5)
 * @param {number} [props.reviewCount] - Optional review count to append
 * @param {boolean} [props.showScore=true] - Whether to show numeric score (e.g. "4.8")
 */
export function RatingStars({ rating = 0, reviewCount, showScore = true }) {
  const numericRating = Math.min(5, Math.max(0, Number(rating) || 0));
  const fullStars = Math.floor(numericRating);
  const hasHalfStar = numericRating % 1 >= 0.5;

  return (
    <div className="inline-flex items-center space-x-1">
      <div className="flex items-center text-amber-400 text-xs">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <span key={i}>★</span>;
          }
          if (i === fullStars && hasHalfStar) {
            return (
              <span key={i} className="text-amber-400">
                ★
              </span>
            );
          }
          return (
            <span key={i} className="text-slate-200">
              ★
            </span>
          );
        })}
      </div>

      {showScore && (
        <span className="text-xs font-bold text-slate-700 ml-1">
          {numericRating.toFixed(1)}
        </span>
      )}

      {reviewCount !== undefined && (
        <span className="text-xs text-slate-400 font-normal">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}

export default {
  formatCurrency,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatPhoneNumber,
  formatFileSize,
  StatusBadge,
  RatingStars,
};