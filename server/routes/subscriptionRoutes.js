/**
 * Home Maintenance Subscription Plans Routes
 * Path: server/routes/subscriptionRoutes.js
 */

import express from 'express';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Subscription from '../models/Subscription.js';
import Booking from '../models/Booking.js';

const router = express.Router();

/**
 * Default Seed Plans to guarantee immediate availability
 */
const DEFAULT_PLANS = [
  {
    id: 'plan_basic_monthly',
    name: 'Essential Care Pass',
    tier: 'basic',
    billingCycle: 'monthly',
    price: 29,
    discountPercent: 10,
    includedVisits: 1,
    includedServices: ['plumbing', 'electrical'],
    features: [
      '1 General Home Service visit per month',
      'Free visual diagnostic check',
      '10% off additional on-demand repairs',
      'Verified licensed technicians',
    ],
    priorityDispatch: false,
    freeDiagnosticInspection: true,
    isActive: true,
  },
  {
    id: 'plan_standard_quarterly',
    name: 'Home Comfort Shield',
    tier: 'standard',
    billingCycle: 'quarterly',
    price: 79,
    discountPercent: 15,
    includedVisits: 4,
    includedServices: ['plumbing', 'electrical', 'hvac', 'cleaning'],
    features: [
      '4 Service Visits (plumbing, electrical, AC coil wash)',
      'Priority technician booking queue',
      '15% discount on emergency repairs & parts',
      'Quarterly appliance health checkup',
    ],
    priorityDispatch: true,
    freeDiagnosticInspection: true,
    isActive: true,
  },
  {
    id: 'plan_premium_yearly',
    name: 'HandyPro All-Inclusive VIP',
    tier: 'yearly_vip',
    billingCycle: 'yearly',
    price: 249,
    discountPercent: 25,
    includedVisits: 12,
    includedServices: ['plumbing', 'electrical', 'hvac', 'cleaning', 'carpentry', 'painting', 'appliance'],
    features: [
      '12 Comprehensive Home Service Visits per year',
      'Instant Emergency SOS Priority Dispatch (Under 30 mins)',
      '180-Day extended digital service warranty on all work',
      'Dedicated account manager & 24/7 HandyAI VIP support',
      '25% discount on all extra materials and labor',
    ],
    priorityDispatch: true,
    freeDiagnosticInspection: true,
    isActive: true,
  },
];

/**
 * GET available subscription plans
 * GET /api/v1/subscriptions/plans
 */
router.get('/plans', async (req, res) => {
  try {
    let plans = await SubscriptionPlan.find({ isActive: true }).lean();
    if (!plans || plans.length === 0) {
      await SubscriptionPlan.insertMany(DEFAULT_PLANS);
      plans = DEFAULT_PLANS;
    }
    return res.json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST subscribe customer to a plan
 * POST /api/v1/subscriptions/subscribe
 */
router.post('/subscribe', async (req, res) => {
  try {
    const {
      customerId = 'cust-user',
      customerName = 'HandyPro Customer',
      customerPhone = '',
      planId,
    } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, message: 'Plan ID is required.' });
    }

    let plan = await SubscriptionPlan.findOne({ id: planId }).lean();
    if (!plan) {
      plan = DEFAULT_PLANS.find((p) => p.id === planId);
    }
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found.' });
    }

    // Calculate expiry based on cycle
    const startDate = new Date();
    const expiryDate = new Date();
    if (plan.billingCycle === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (plan.billingCycle === 'quarterly') {
      expiryDate.setMonth(expiryDate.getMonth() + 3);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    // Set next maintenance reminder to 30 days from now
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 30);

    const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Create subscription
    const newSubscription = await Subscription.create({
      id: subId,
      customerId,
      customerName,
      customerPhone,
      planId: plan.id,
      planName: plan.name,
      tier: plan.tier,
      billingCycle: plan.billingCycle,
      pricePaid: plan.price,
      paymentStatus: 'paid', // Real payment gateway separation as requested
      status: 'active',
      startDate,
      expiryDate,
      totalVisits: plan.includedVisits || 4,
      usedVisits: 0,
      remainingVisits: plan.includedVisits || 4,
      nextMaintenanceReminder: reminderDate,
      serviceBookingsHistory: [],
    });

    return res.json({
      success: true,
      message: `Successfully subscribed to ${plan.name}!`,
      data: newSubscription,
    });
  } catch (error) {
    console.error('[Subscription Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET customer's active subscription(s)
 * GET /api/v1/subscriptions/my-subscriptions
 */
router.get('/my-subscriptions', async (req, res) => {
  try {
    const customerId = req.query.customerId || 'cust-user';
    const subscriptions = await Subscription.find({ customerId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST redeem/book maintenance visit using subscription
 * POST /api/v1/subscriptions/book-maintenance
 */
router.post('/book-maintenance', async (req, res) => {
  try {
    const { subscriptionId, serviceCategory = 'hvac', scheduledDate, scheduledTime = '10:00 AM', notes = '' } = req.body;

    const subscription = await Subscription.findOne({ id: subscriptionId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Subscription is not active.' });
    }

    if (subscription.remainingVisits <= 0) {
      return res.status(400).json({ success: false, message: 'No remaining visits left in this subscription cycle.' });
    }

    // Deduct 1 visit
    subscription.usedVisits += 1;
    subscription.remainingVisits -= 1;

    // Create free/covered Booking
    const bookingId = `book_sub_${Date.now()}`;
    const newBooking = await Booking.create({
      id: bookingId,
      customerId: subscription.customerId,
      customerName: subscription.customerName,
      serviceCategory,
      serviceTitle: `Routine Maintenance Visit (${subscription.planName})`,
      scheduledDate: scheduledDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      scheduledTime,
      amount: 0,
      paymentMethod: 'subscription_pass',
      isPaid: true,
      status: 'ACCEPTED',
      address: 'On file with customer subscription',
      notes: `Booked via Subscription ${subscription.planName}. ${notes}`,
    });

    subscription.serviceBookingsHistory.push({
      bookingId,
      serviceCategory,
      date: new Date(),
    });

    await subscription.save();

    return res.json({
      success: true,
      message: 'Maintenance visit scheduled successfully! (Deducted from subscription quota)',
      data: {
        booking: newBooking,
        remainingVisits: subscription.remainingVisits,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Admin: List all subscriptions
 * GET /api/v1/subscriptions/admin/all
 */
router.get('/admin/all', async (req, res) => {
  try {
    const subscriptions = await Subscription.find().sort({ createdAt: -1 }).lean();
    const totalRevenue = subscriptions.reduce((acc, s) => acc + (s.pricePaid || 0), 0);
    const activeCount = subscriptions.filter((s) => s.status === 'active').length;

    return res.json({
      success: true,
      totalRevenue,
      activeCount,
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Admin: Create or edit plan
 * POST /api/v1/subscriptions/admin/plans
 */
router.post('/admin/plans', async (req, res) => {
  try {
    const planData = req.body;
    if (!planData.id || !planData.name || !planData.price) {
      return res.status(400).json({ success: false, message: 'Plan id, name, and price are required.' });
    }

    const savedPlan = await SubscriptionPlan.findOneAndUpdate(
      { id: planData.id },
      { $set: planData },
      { new: true, upsert: true }
    );

    return res.json({ success: true, data: savedPlan });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

