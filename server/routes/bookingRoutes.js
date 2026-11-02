/**
 * Booking, Emergency Dispatch, Status Tracking & Invoicing Routes
 * Path: server/routes/bookingRoutes.js
 */

import express from 'express';
import Booking from '../models/Booking.js';
import Provider from '../models/Provider.js';
import { allocateEmergencyProvider, analyzeReviewSentiment } from '../services/aiService.js';

const router = express.Router();

/**
 * Helper to generate digital invoice object
 */
function createInvoiceData(booking) {
  const amount = Number(booking.amount) || 50;
  const baseFee = Math.round(amount * 0.85);
  const serviceTax = Math.round(amount * 0.10);
  const platformFee = amount - baseFee - serviceTax;

  return {
    invoiceNumber: `INV-2026-${booking.id.replace('BK-', '')}`,
    bookingId: booking.id,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    customerAddress: booking.customerAddress,
    providerId: booking.providerId,
    providerName: booking.providerName,
    serviceTitle: booking.serviceTitle,
    category: booking.category,
    scheduledDate: booking.scheduledDate,
    scheduledTime: booking.scheduledTime,
    isEmergency: booking.isEmergency,
    totalAmount: amount,
    baseFee,
    serviceTax,
    platformFee,
    paymentStatus: booking.payment?.status || 'UNPAID',
    paymentMethod: booking.payment?.method || 'card',
    transactionId: booking.payment?.transactionId || `TXN-${Date.now()}`,
    issuedDate: booking.completedAt ? new Date(booking.completedAt).toISOString().split('T')[0] : booking.scheduledDate,
  };
}

/**
 * 1. Create Standard Service Booking
 * POST /api/v1/customer/bookings or /api/v1/bookings
 */
router.post('/customer/bookings', handleCreateBooking);
router.post('/bookings', handleCreateBooking);

async function handleCreateBooking(req, res) {
  try {
    const bookingId = req.body.id || `BK-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking = new Booking({
      ...req.body,
      id: bookingId,
      status: req.body.status || 'PENDING',
      allocatedBy: req.body.allocatedBy || 'direct',
      trackingHistory: [
        {
          status: 'PENDING',
          timestamp: new Date(),
          message: 'Booking request placed and dispatched to technician.',
        },
      ],
      payment: {
        status: req.body.paymentMethod ? 'PAID' : 'UNPAID',
        method: req.body.paymentMethod || 'card',
        transactionId: `TXN-${Date.now()}`,
        paidAt: req.body.paymentMethod ? new Date() : null,
        baseFee: Math.round((Number(req.body.amount) || 50) * 0.85),
        serviceTax: Math.round((Number(req.body.amount) || 50) * 0.10),
        platformFee: Math.round((Number(req.body.amount) || 50) * 0.05),
        totalPaid: Number(req.body.amount) || 50,
      },
    });

    const saved = await newBooking.save();
    return res.status(201).json({ success: true, data: saved });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 2. Emergency SOS Booking & Nearest Suitable Provider Allocation
 * POST /api/v1/customer/bookings/emergency
 */
router.post('/customer/bookings/emergency', async (req, res) => {
  try {
    const { category, address, phone, customerName, customerCoords, description } = req.body;

    // AI allocation of nearest suitable emergency provider
    const allocation = await allocateEmergencyProvider({
      category: category || 'plumbing',
      customerCoords: customerCoords || { lat: 13.0827, lng: 80.2707, locationId: 'chennai' },
    });

    const allocatedProv = allocation.allocatedProvider;
    const bookingId = `BK-EMG-${Math.floor(1000 + Math.random() * 9000)}`;
    const emergencyAmount = (Number(allocatedProv.hourlyRate) || 50) + allocation.emergencySurcharge;

    const emergencyBooking = new Booking({
      id: bookingId,
      customerId: req.body.customerId || 'cust-user',
      customerName: customerName || 'Valued Customer',
      customerPhone: phone || '',
      customerAddress: address || 'Current Location',
      customerLocation: allocatedProv.locationName || 'Chennai',
      providerId: allocatedProv.id,
      providerName: allocatedProv.name,
      serviceTitle: `🚨 24/7 Priority Emergency: ${category ? category.toUpperCase() : 'URGENT DISPATCH'}`,
      category: category || allocatedProv.category || 'plumbing',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: 'Immediate (ETA ~25 mins)',
      notes: description || 'Emergency SOS request dispatched by HandyPro AI.',
      amount: emergencyAmount,
      isEmergency: true,
      status: 'ACCEPTED', // Fast-tracked priority
      acceptedAt: new Date(),
      allocatedBy: 'emergency_sos_dispatch',
      trackingHistory: [
        {
          status: 'PENDING',
          timestamp: new Date(Date.now() - 30000),
          message: 'SOS Emergency Signal Broadcasted.',
        },
        {
          status: 'ACCEPTED',
          timestamp: new Date(),
          message: `Nearest certified specialist ${allocatedProv.name} allocated & dispatched. ETA ~${allocation.etaMinutes} mins.`,
        },
      ],
      payment: {
        status: 'UNPAID',
        method: 'card',
        baseFee: Math.round(emergencyAmount * 0.85),
        serviceTax: Math.round(emergencyAmount * 0.10),
        platformFee: emergencyAmount - Math.round(emergencyAmount * 0.85) - Math.round(emergencyAmount * 0.10),
        totalPaid: emergencyAmount,
      },
    });

    const saved = await emergencyBooking.save();

    return res.status(201).json({
      success: true,
      data: saved,
      allocatedProvider: allocatedProv,
      etaMinutes: allocation.etaMinutes,
      message: `Emergency SOS confirmed. ${allocatedProv.name} has been allocated and is preparing immediate departure.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 3. Get Customer Bookings
 * GET /api/v1/customer/bookings or /api/v1/bookings
 */
router.get('/customer/bookings', handleGetCustomerBookings);
router.get('/bookings', handleGetCustomerBookings);

async function handleGetCustomerBookings(req, res) {
  try {
    const { customerId, customerName, providerId, status } = req.query;
    const filter = {};

    if (customerId) filter.customerId = customerId;
    if (customerName) filter.customerName = new RegExp(customerName, 'i');
    if (providerId) filter.providerId = providerId;
    if (status && status !== 'ALL') filter.status = status.toUpperCase();

    const bookings = await Booking.find(filter).sort({ createdAt: -1 }).lean();

    // Augment with digital invoice data
    const enriched = bookings.map((b) => ({
      ...b,
      invoice: createInvoiceData(b),
    }));

    return res.json({
      success: true,
      count: enriched.length,
      bookings: enriched,
      data: enriched,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 4. Get Provider Assigned Jobs
 * GET /api/v1/provider/jobs
 */
router.get('/provider/jobs', async (req, res) => {
  try {
    const { providerId, providerName, status } = req.query;
    const filter = {};

    if (providerId) filter.providerId = providerId;
    if (providerName) filter.providerName = new RegExp(providerName, 'i');
    if (status && status !== 'ALL') filter.status = status.toUpperCase();

    const jobs = await Booking.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, count: jobs.length, jobs, data: jobs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 5. Get Single Booking by ID
 * GET /api/v1/bookings/:id
 */
router.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await Booking.findOne({ id: req.params.id }).lean();
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    return res.json({
      success: true,
      booking: {
        ...booking,
        invoice: createInvoiceData(booking),
      },
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 6. Live Booking Status Transition
 * PATCH /api/v1/bookings/:id/status
 */
router.patch('/bookings/:id/status', async (req, res) => {
  try {
    const { status, notes, message } = req.body;
    const cleanStatus = String(status).toUpperCase();

    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = cleanStatus;
    if (cleanStatus === 'ACCEPTED') booking.acceptedAt = new Date();
    if (cleanStatus === 'IN_PROGRESS') booking.inProgressAt = new Date();
    if (cleanStatus === 'COMPLETED') {
      booking.completedAt = new Date();
      // Increment provider completed jobs count
      await Provider.findOneAndUpdate(
        { id: booking.providerId },
        { $inc: { completedJobsCount: 1 } }
      );
    }
    if (cleanStatus === 'CANCELLED' && notes) {
      booking.cancellationReason = notes;
    }

    // Append to live status tracking history
    const stepMessage =
      message ||
      {
        PENDING: 'Booking received and pending confirmation.',
        ACCEPTED: 'Provider confirmed appointment and is scheduled for dispatch.',
        IN_PROGRESS: 'Technician has arrived on site and service is in progress.',
        COMPLETED: 'Service completed successfully. Digital invoice generated.',
        CANCELLED: `Booking cancelled. Reason: ${notes || 'Customer request'}`,
      }[cleanStatus] || `Status updated to ${cleanStatus}`;

    booking.trackingHistory = booking.trackingHistory || [];
    booking.trackingHistory.push({
      status: cleanStatus,
      timestamp: new Date(),
      message: stepMessage,
    });

    await booking.save();

    return res.json({
      success: true,
      booking: {
        ...booking.toObject(),
        invoice: createInvoiceData(booking),
      },
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 6b. Provider proposes new appointment time / reschedule
 * PATCH /api/v1/bookings/:id/reschedule or /api/bookings/:id/reschedule
 */
router.patch('/bookings/:id/reschedule', async (req, res) => {
  try {
    const { newTime, newDate, reason } = req.body;
    if (!newTime) {
      return res.status(400).json({ success: false, message: 'New appointment time is required' });
    }

    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.proposedTime = newTime;
    booking.proposedDate = newDate || booking.scheduledDate;
    booking.rescheduleReason = reason || 'Schedule adjustment by service provider';
    booking.rescheduleStatus = 'PROPOSED_BY_PROVIDER';
    booking.rescheduledAt = new Date();

    const historyMsg = `Provider proposed new appointment time: ${newTime} on ${booking.proposedDate}. Reason: ${booking.rescheduleReason}`;
    booking.trackingHistory = booking.trackingHistory || [];
    booking.trackingHistory.push({
      status: 'RESCHEDULE_PROPOSED',
      timestamp: new Date(),
      message: historyMsg,
    });

    await booking.save();

    // Broadcast real-time Socket.IO notification to the customer
    const io = req.app.get('io');
    if (io) {
      io.emit('booking_time_changed', {
        bookingId: booking.id,
        customerId: booking.customerId,
        customerName: booking.customerName,
        providerId: booking.providerId,
        providerName: booking.providerName,
        originalTime: booking.scheduledTime,
        newTime: booking.proposedTime,
        newDate: booking.proposedDate,
        reason: booking.rescheduleReason,
      });
      io.to(`booking_${booking.id}`).emit('booking_time_changed', {
        bookingId: booking.id,
        newTime: booking.proposedTime,
        newDate: booking.proposedDate,
        reason: booking.rescheduleReason,
      });
    }

    return res.json({
      success: true,
      message: `Reschedule notification sent to customer for ${newTime}.`,
      booking: {
        ...booking.toObject(),
        invoice: createInvoiceData(booking),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 6c. Customer responds to proposed time change (Accept or Decline)
 * PATCH /api/v1/bookings/:id/respond-reschedule or /api/bookings/:id/respond-reschedule
 */
router.patch('/bookings/:id/respond-reschedule', async (req, res) => {
  try {
    const { accept, notes } = req.body;
    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const io = req.app.get('io');

    if (accept) {
      const oldTime = booking.scheduledTime;
      booking.scheduledTime = booking.proposedTime || booking.scheduledTime;
      if (booking.proposedDate) booking.scheduledDate = booking.proposedDate;
      booking.rescheduleStatus = 'ACCEPTED_BY_CUSTOMER';

      booking.trackingHistory = booking.trackingHistory || [];
      booking.trackingHistory.push({
        status: 'RESCHEDULE_ACCEPTED',
        timestamp: new Date(),
        message: `Customer accepted new appointment time: ${booking.scheduledTime} (was ${oldTime}).`,
      });

      await booking.save();

      if (io) {
        io.emit('booking_reschedule_confirmed', {
          bookingId: booking.id,
          providerId: booking.providerId,
          confirmedTime: booking.scheduledTime,
          confirmedDate: booking.scheduledDate,
        });
      }

      return res.json({
        success: true,
        message: `New appointment time confirmed for ${booking.scheduledTime}.`,
        booking: {
          ...booking.toObject(),
          invoice: createInvoiceData(booking),
        },
      });
    } else {
      booking.rescheduleStatus = 'REJECTED_BY_CUSTOMER';
      booking.trackingHistory = booking.trackingHistory || [];
      booking.trackingHistory.push({
        status: 'RESCHEDULE_REJECTED',
        timestamp: new Date(),
        message: `Customer preferred original time: ${booking.scheduledTime}. Note: ${notes || 'Original slot requested'}`,
      });

      await booking.save();

      if (io) {
        io.emit('booking_reschedule_rejected', {
          bookingId: booking.id,
          providerId: booking.providerId,
          originalTime: booking.scheduledTime,
          notes: notes || 'Customer declined time change',
        });
      }

      return res.json({
        success: true,
        message: `Kept original appointment time (${booking.scheduledTime}).`,
        booking: {
          ...booking.toObject(),
          invoice: createInvoiceData(booking),
        },
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 7. Rate & Review Booking with Automatic AI Sentiment Analysis
 * POST /api/v1/bookings/:id/review
 */
router.post('/bookings/:id/review', async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const numRating = Number(rating) || 5;

    // AI sentiment analysis of the review
    const sentimentResult = await analyzeReviewSentiment({
      comment: comment || '',
      rating: numRating,
    });

    const updatedBooking = await Booking.findOneAndUpdate(
      { id: req.params.id },
      {
        $set: {
          rating: numRating,
          reviewComment: comment,
          reviewSentiment: {
            score: sentimentResult.score,
            label: sentimentResult.sentiment,
            summary: sentimentResult.actionRecommendation,
            aspects: sentimentResult.aspects,
          },
        },
      },
      { new: true }
    );

    if (updatedBooking) {
      // Recalculate provider overall rating & sentiment
      const providerBookings = await Booking.find({
        providerId: updatedBooking.providerId,
        rating: { $exists: true, $ne: null },
      });

      const avgRating =
        providerBookings.reduce((sum, b) => sum + b.rating, 0) / Math.max(providerBookings.length, 1);

      await Provider.findOneAndUpdate(
        { id: updatedBooking.providerId },
        {
          $set: {
            rating: Math.round(avgRating * 10) / 10,
            reviewsCount: providerBookings.length,
            sentimentScore: sentimentResult.score,
            sentimentLabel: sentimentResult.sentiment,
          },
        }
      );
    }

    return res.json({
      success: true,
      booking: updatedBooking,
      data: updatedBooking,
      sentiment: sentimentResult,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 8. Live Payment & Digital Invoice Checkout
 * POST /api/v1/bookings/:id/pay
 */
router.post('/bookings/:id/pay', async (req, res) => {
  try {
    const { paymentMethod = 'card', transactionId } = req.body;
    const booking = await Booking.findOne({ id: req.params.id });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const total = Number(booking.amount) || 50;
    const baseFee = Math.round(total * 0.85);
    const serviceTax = Math.round(total * 0.10);
    const platformFee = total - baseFee - serviceTax;

    booking.payment = {
      status: 'PAID',
      method: paymentMethod,
      transactionId: transactionId || `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      paidAt: new Date(),
      baseFee,
      serviceTax,
      platformFee,
      totalPaid: total,
    };

    booking.trackingHistory = booking.trackingHistory || [];
    booking.trackingHistory.push({
      status: booking.status,
      timestamp: new Date(),
      message: `Payment of $${total} completed via ${paymentMethod.toUpperCase()}. Transaction ID: ${booking.payment.transactionId}`,
    });

    await booking.save();
    const invoice = createInvoiceData(booking);

    return res.json({
      success: true,
      message: 'Payment processed successfully and digital invoice generated.',
      payment: booking.payment,
      invoice,
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

