/**
 * Customer My Bookings & Appointment History Page
 * Path: src/modules/user/pages/MyBookings.jsx
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar';
import { useAuth } from '../../../hooks/useAuth';
import dataStore from '../../../services/dataStore';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Star,
  Receipt,
  ArrowLeft,
  X,
  Check,
  FileText,
  Printer,
  Sparkles,
  Zap,
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'all', label: 'All Bookings' },
  { id: 'ACCEPTED', label: 'Accepted by Provider' },
  { id: 'PENDING', label: 'Pending Response' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export default function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightBookingId = searchParams.get('booked');

  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [actionMessage, setActionMessage] = useState('');

  // Modals state
  const [ratingBooking, setRatingBooking] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    loadBookings();
    const unsubscribe = dataStore.subscribe(() => {
      loadBookings();
    });

    const handleTimeRescheduled = (e) => {
      loadBookings();
      if (e.detail?.bookingId) {
        setActionMessage(`⏱️ Technician proposed a new appointment time for booking ${e.detail.bookingId}.`);
      }
    };
    window.addEventListener('handypro_time_rescheduled', handleTimeRescheduled);

    return () => {
      unsubscribe();
      window.removeEventListener('handypro_time_rescheduled', handleTimeRescheduled);
    };
  }, []);

  const loadBookings = () => {
    const list = dataStore.getBookings();
    setBookings(list);
  };

  const handleRespondReschedule = async (bookingId, accept) => {
    try {
      const updated = await dataStore.respondBookingTime(bookingId, accept);
      if (updated) {
        setActionMessage(
          accept
            ? `New arrival time accepted! Your appointment is confirmed for ${updated.scheduledTime} on ${updated.scheduledDate}.`
            : 'You declined the proposed time change. The appointment remains at its original schedule.'
        );
        loadBookings();
      }
    } catch (err) {
      console.error(err);
      setActionMessage('Failed to update appointment schedule. Please try again.');
    }
    setTimeout(() => setActionMessage(''), 5000);
  };

  const handleCancelBooking = (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment request?')) return;
    dataStore.cancelBooking(bookingId, 'Cancelled by customer');
    setActionMessage(`Booking ${bookingId} has been cancelled successfully.`);
    setTimeout(() => setActionMessage(''), 4000);
  };

  const handleOpenReviewModal = (booking) => {
    setRatingBooking(booking);
    setReviewForm({ rating: booking.userRating || 5, comment: booking.userReview || '' });
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!ratingBooking) return;
    dataStore.addBookingReview(ratingBooking.id, reviewForm.rating, reviewForm.comment);
    setRatingBooking(null);
    setActionMessage('Thank you! Your rating and feedback have been saved.');
    setTimeout(() => setActionMessage(''), 4000);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (activeTab === 'all') return true;
      return b.status?.toUpperCase() === activeTab.toUpperCase();
    });
  }, [bookings, activeTab]);

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Accepted</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Pending Response</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-blue-600" />
            <span>Completed</span>
          </span>
        );
      case 'CANCELLED':
      case 'DECLINED':
        return (
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
            <XCircle className="h-3 w-3 text-slate-400" />
            <span>{status}</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header & Dashboard Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-md bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              Service Orders Portal
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1 font-display">My Service Bookings</h1>
            <p className="text-xs text-slate-500 font-medium">
              Track live appointment status, review past service receipts, and rate technicians
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/user/dashboard')}
            className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 text-xs font-bold hover:bg-blue-50 transition shadow-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4 text-blue-600" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Action Feedback Banner */}
        {actionMessage && (
          <div className="p-3.5 rounded-2xl text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-between shadow-xs">
            <span>{actionMessage}</span>
            <button
              type="button"
              onClick={() => setActionMessage('')}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Newly Booked Success Banner */}
        {highlightBookingId && (
          <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-extrabold text-sm">Booking Confirmed! (ID: {highlightBookingId})</p>
                <p className="text-emerald-700 text-xs font-medium mt-0.5">
                  Your appointment has been transmitted to the technician station.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-blue-50 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center border border-slate-200 space-y-3">
            <span className="text-4xl">📅</span>
            <h3 className="text-base font-black text-slate-800 font-display">No Bookings Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
              You don't have any service appointments in this category right now.
            </p>
            <button
              type="button"
              onClick={() => navigate('/user/dashboard')}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700 transition shadow-xs"
            >
              Browse Available Services
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className={`rounded-3xl bg-white p-5 md:p-6 border border-slate-200 shadow-xs space-y-4 transition hover:border-blue-300 ${
                  booking.id === highlightBookingId ? 'ring-2 ring-emerald-500/50 bg-emerald-50/20' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{booking.id}</span>
                    {getStatusBadge(booking.status)}
                    {booking.isEmergency && (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-black uppercase flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>SOS Priority</span>
                      </span>
                    )}
                  </div>
                  <span className="text-base font-black text-blue-600">
                    ${booking.amount || 65}.00
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-1.5">
                    <h2 className="text-base font-extrabold text-slate-900 font-display">
                      {booking.serviceTitle}
                    </h2>
                    <p className="text-slate-600 font-semibold">
                      Technician: <strong className="text-slate-900 font-extrabold">{booking.providerName}</strong>
                    </p>
                    <p className="text-slate-500 flex items-center gap-1 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{booking.customerAddress || booking.address}</span>
                    </p>
                    {booking.notes && (
                      <p className="text-slate-600 italic mt-1 bg-slate-50 p-3 rounded-2xl border border-slate-100 font-medium">
                        "{booking.notes}"
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl space-y-1.5 text-slate-600 border border-slate-100 self-start text-xs font-medium">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span><strong>Date:</strong> {booking.scheduledDate}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span><strong>Time:</strong> {booking.scheduledTime}</span>
                    </p>
                    <p className="text-emerald-700 font-extrabold pt-1">
                      {booking.status === 'ACCEPTED' ? '✓ Accepted by Provider Station' : booking.status === 'COMPLETED' ? '✓ Service Delivered' : 'Awaiting confirmation'}
                    </p>
                  </div>
                </div>

                {/* Provider Propose Reschedule Prompt */}
                {booking.rescheduleStatus === 'PROPOSED_BY_PROVIDER' && (
                  <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-600 animate-pulse" />
                        <span className="font-extrabold text-amber-950 text-xs sm:text-sm">
                          ⏱️ Provider Requested a Time Change
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-extrabold text-[10px] uppercase">
                        Response Needed
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white/80 p-2.5 rounded-xl border border-amber-200">
                      <div>
                        <span className="text-slate-500 font-bold block text-[11px]">Original Slot:</span>
                        <span className="text-slate-600 font-bold line-through">
                          {booking.scheduledDate} at {booking.scheduledTime}
                        </span>
                      </div>
                      <div>
                        <span className="text-amber-800 font-bold block text-[11px]">Proposed New Slot:</span>
                        <span className="text-amber-900 font-black text-sm">
                          📅 {booking.proposedDate || booking.scheduledDate} at 🕒 {booking.proposedTime}
                        </span>
                      </div>
                    </div>

                    {booking.rescheduleReason && (
                      <p className="text-xs text-amber-900 italic bg-amber-100/50 p-2 rounded-lg">
                        <strong>Technician Note:</strong> "{booking.rescheduleReason}"
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleRespondReschedule(booking.id, true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                      >
                        <Check className="h-4 w-4" />
                        <span>Accept New Time ({booking.proposedTime})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespondReschedule(booking.id, false)}
                        className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <X className="h-4 w-4" />
                        <span>Keep Original Time ({booking.scheduledTime})</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Customer Review Summary if present */}
                {booking.userRating && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-900">Your Feedback & Rating</span>
                      <span className="text-amber-600 font-black">{'★'.repeat(booking.userRating)}</span>
                    </div>
                    {booking.userReview && <p className="text-slate-700 italic">"{booking.userReview}"</p>}
                  </div>
                )}

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                  {booking.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleCancelBooking(booking.id)}
                      className="px-4 py-2 rounded-xl bg-white border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition"
                    >
                      Cancel Request
                    </button>
                  )}

                  {booking.status === 'COMPLETED' && !booking.userRating && (
                    <button
                      type="button"
                      onClick={() => handleOpenReviewModal(booking)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold transition shadow-xs flex items-center gap-1"
                    >
                      <Star className="h-3.5 w-3.5" />
                      <span>Rate & Review</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const invoiceItem = {
                        invoiceNumber: `INV-2026-${booking.id.replace('BK-', '')}`,
                        bookingId: booking.id,
                        serviceTitle: booking.serviceTitle,
                        providerName: booking.providerName,
                        customerName: booking.customerName || user?.name || 'Customer',
                        scheduledDate: booking.scheduledDate,
                        status: booking.status,
                        totalAmount: booking.amount || 65,
                        baseFee: Math.round((booking.amount || 65) * 0.85),
                        serviceTax: Math.round((booking.amount || 65) * 0.10),
                        platformFee: (booking.amount || 65) - Math.round((booking.amount || 65) * 0.85) - Math.round((booking.amount || 65) * 0.10),
                      };
                      setSelectedInvoice(invoiceItem);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-extrabold hover:bg-slate-200 transition flex items-center gap-1.5"
                  >
                    <Receipt className="h-3.5 w-3.5 text-slate-600" />
                    <span>View Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/user/book/${booking.providerId}`)}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-extrabold hover:bg-blue-700 transition shadow-xs"
                  >
                    Re-Book Technician
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Rating & Review Modal */}
      {ratingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg">
                  ★
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-display">Rate Service Experience</h3>
                  <p className="text-xs text-slate-500 font-medium">Job #{ratingBooking.id} • {ratingBooking.providerName}</p>
                </div>
              </div>
              <button
                onClick={() => setRatingBooking(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Select Star Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="p-2 text-2xl transition hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= reviewForm.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Feedback & Review Comment</label>
                <textarea
                  rows="4"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Share details about the technician's punctuality, quality of work, and professionalism..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRatingBooking(null)}
                  className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-extrabold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-md"
                >
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-display">{selectedInvoice.invoiceNumber}</h3>
                  <p className="text-xs text-slate-500 font-medium">Issued: {selectedInvoice.scheduledDate}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="font-extrabold text-slate-900 text-sm">{selectedInvoice.serviceTitle}</p>
                <p className="text-slate-600">Technician: <strong className="text-slate-900">{selectedInvoice.providerName}</strong></p>
                <p className="text-slate-600">Customer: <strong className="text-slate-900">{selectedInvoice.customerName}</strong></p>
              </div>

              <div className="space-y-2 border-b border-slate-100 pb-3">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Technician Base Work Charge</span>
                  <span className="font-bold text-slate-900">${selectedInvoice.baseFee}.00</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>State Service Tax (10%)</span>
                  <span className="font-bold text-slate-900">${selectedInvoice.serviceTax}.00</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Platform Operations Fee</span>
                  <span className="font-bold text-slate-900">${selectedInvoice.platformFee}.00</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1">
                <span>Grand Total Amount</span>
                <span className="text-blue-600 text-lg">${selectedInvoice.totalAmount}.00</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xs font-extrabold hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-6 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-extrabold shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}