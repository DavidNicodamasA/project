/**
 * Digital Service Warranty Routes & Certificate Generator
 * Path: server/routes/warrantyRoutes.js
 */

import express from 'express';
import ServiceWarranty from '../models/ServiceWarranty.js';
import Booking from '../models/Booking.js';

const router = express.Router();

/**
 * Issue Digital Warranty after service completion
 * POST /api/v1/warranties/issue
 */
router.post('/issue', async (req, res) => {
  try {
    const {
      bookingId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      providerId,
      providerName,
      serviceCategory,
      serviceTitle,
      durationDays = 90,
      terms,
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Booking ID is required.' });
    }

    // Verify booking
    const booking = await Booking.findOne({ id: bookingId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Check if warranty already issued
    const existing = await ServiceWarranty.findOne({ bookingId });
    if (existing) {
      return res.json({
        success: true,
        message: 'Warranty certificate was already issued for this booking.',
        data: existing,
      });
    }

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(durationDays));

    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const warrantyId = `WAR-${new Date().getFullYear()}-${randomSuffix}`;

    const warranty = await ServiceWarranty.create({
      warrantyId,
      bookingId,
      customerId: customerId || booking.customerId || 'cust-user',
      customerName: customerName || booking.customerName || 'Customer',
      customerEmail: customerEmail || 'customer@handypro.com',
      customerPhone: customerPhone || '9876543210',
      providerId: providerId || booking.providerId || 'prov-default',
      providerName: providerName || booking.providerName || 'Certified Technician',
      serviceCategory: serviceCategory || booking.serviceCategory || 'general',
      serviceTitle: serviceTitle || booking.serviceTitle || 'Professional Home Service',
      completionDate: booking.updatedAt || new Date(),
      startDate,
      expiryDate,
      durationDays: Number(durationDays),
      terms: terms || [
        '100% Workmanship Guarantee: Free re-inspection and corrective repairs for the exact serviced issue.',
        'Installed replacement parts carry certified manufacturer coverage.',
        '24/7 Priority claims response via HandyPro Customer Support.',
        'Excludes subsequent external physical tampering, accidental user breakage, or unauthorized third-party modifications.',
      ],
      coverageDetails: {
        workmanship: true,
        partsIncluded: true,
        freeRevisit: true,
      },
      status: 'active',
      issuedBy: 'HandyPro Quality Assurance Team & Technician',
    });

    return res.json({
      success: true,
      message: `Digital Service Warranty ${warrantyId} issued successfully!`,
      data: warranty,
    });
  } catch (error) {
    console.error('[Issue Warranty Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET Warranty Certificate by ID
 * GET /api/v1/warranties/:warrantyId
 */
router.get('/:warrantyId', async (req, res) => {
  try {
    const { warrantyId } = req.params;
    const warranty = await ServiceWarranty.findOne({
      $or: [{ warrantyId }, { bookingId: warrantyId }],
    }).lean();

    if (!warranty) {
      return res.status(404).json({ success: false, message: 'Warranty certificate not found.' });
    }

    const isExpired = new Date(warranty.expiryDate) < new Date();

    return res.json({
      success: true,
      data: {
        ...warranty,
        isExpired,
        daysRemaining: Math.max(0, Math.ceil((new Date(warranty.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET Customer Warranty History
 * GET /api/v1/warranties/customer/:customerId
 */
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const warranties = await ServiceWarranty.find({ customerId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: warranties.length,
      data: warranties.map((w) => ({
        ...w,
        isExpired: new Date(w.expiryDate) < new Date(),
        daysRemaining: Math.max(0, Math.ceil((new Date(w.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))),
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Claim Warranty Revisit
 * POST /api/v1/warranties/:warrantyId/claim
 */
router.post('/:warrantyId/claim', async (req, res) => {
  try {
    const { warrantyId } = req.params;
    const { issueNotes = '' } = req.body;

    const warranty = await ServiceWarranty.findOne({ warrantyId });
    if (!warranty) {
      return res.status(404).json({ success: false, message: 'Warranty not found.' });
    }

    if (new Date(warranty.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'Warranty has expired.' });
    }

    warranty.claimsCount = (warranty.claimsCount || 0) + 1;
    warranty.status = 'claimed';
    await warranty.save();

    // Create free Warranty Revisit Booking
    const revisitBooking = await Booking.create({
      id: `book_war_${Date.now()}`,
      customerId: warranty.customerId,
      customerName: warranty.customerName,
      providerId: warranty.providerId,
      providerName: warranty.providerName,
      serviceCategory: warranty.serviceCategory,
      serviceTitle: `[Warranty Revisit] ${warranty.serviceTitle}`,
      scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      scheduledTime: '11:00 AM',
      amount: 0,
      paymentMethod: 'warranty_coverage',
      isPaid: true,
      status: 'ACCEPTED',
      notes: `Revisit requested under Warranty ${warranty.warrantyId}: ${issueNotes}`,
    });

    return res.json({
      success: true,
      message: 'Warranty claim processed! Free technician revisit has been booked.',
      data: {
        warranty,
        revisitBooking,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

