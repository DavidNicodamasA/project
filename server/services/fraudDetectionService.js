/**
 * Explainable AI Fraud & Anomaly Detection Service
 * Path: server/services/fraudDetectionService.js
 * 
 * Multi-metric rule-based & statistical anomaly detection.
 * Flags suspicious patterns for human administrative review.
 */

import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Provider from '../models/Provider.js';
import FraudAlert from '../models/FraudAlert.js';

export async function runFraudAndAnomalyScan() {
  const alertsFound = [];
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Scan for Excessive Cancellation Frequency (> 40% cancellation rate with at least 3 bookings)
  try {
    const userBookings = await Booking.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: '$customerId',
          customerName: { $first: '$customerName' },
          totalBookings: { $sum: 1 },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'CANCELLED'] }, 1, 0] },
          },
        },
      },
      {
        $match: {
          totalBookings: { $gte: 3 },
        },
      },
    ]);

    for (const u of userBookings) {
      const cancelRate = u.cancelledBookings / u.totalBookings;
      if (cancelRate >= 0.5) {
        const alertId = `fa_cancel_${u._id || 'unknown'}_${Date.now().toString(36)}`;
        const existing = await FraudAlert.findOne({
          targetId: u._id,
          type: 'excessive_cancellation',
          status: 'under_review',
        });

        if (!existing) {
          const alert = await FraudAlert.create({
            alertId,
            type: 'excessive_cancellation',
            severity: cancelRate >= 0.75 ? 'high' : 'medium',
            targetId: u._id || 'cust-user',
            targetType: 'user',
            targetName: u.customerName || 'HandyPro Customer',
            anomalyScore: Math.round(cancelRate * 100) / 100,
            description: `User has an abnormal cancellation rate of ${Math.round(cancelRate * 100)}% (${u.cancelledBookings} cancelled out of ${u.totalBookings} total bookings in past 7 days).`,
            reasons: [
              `High cancellation volume: ${u.cancelledBookings}/${u.totalBookings} orders`,
              'Potential phantom booking or provider time-blocking pattern',
              'Exceeds normal platform threshold (12% baseline)',
            ],
            metadata: {
              totalBookings: u.totalBookings,
              cancelledBookings: u.cancelledBookings,
              cancelRate,
            },
          });
          alertsFound.push(alert);
        }
      }
    }
  } catch (err) {
    console.error('[Fraud Scan - Cancellation]:', err.message);
  }

  // 2. Scan for Repeated Rapid Bookings (Same customer created 3+ bookings within 15 minutes)
  try {
    const recentBookings = await Booking.find({ createdAt: { $gte: last24Hours } })
      .sort({ createdAt: 1 })
      .lean();

    const customerBookingTimes = {};
    recentBookings.forEach((b) => {
      const cId = b.customerId || 'cust-user';
      if (!customerBookingTimes[cId]) customerBookingTimes[cId] = [];
      customerBookingTimes[cId].push({
        id: b.id,
        time: new Date(b.createdAt).getTime(),
        name: b.customerName,
        category: b.serviceCategory,
      });
    });

    for (const [cId, bookings] of Object.entries(customerBookingTimes)) {
      if (bookings.length >= 3) {
        // Check time difference between first and third
        for (let i = 0; i <= bookings.length - 3; i++) {
          const timeDiffMinutes = (bookings[i + 2].time - bookings[i].time) / (1000 * 60);
          if (timeDiffMinutes <= 15) {
            const existing = await FraudAlert.findOne({
              targetId: cId,
              type: 'fake_booking_pattern',
              status: 'under_review',
            });
            if (!existing) {
              const alert = await FraudAlert.create({
                alertId: `fa_burst_${cId}_${Date.now().toString(36)}`,
                type: 'fake_booking_pattern',
                severity: 'high',
                targetId: cId,
                targetType: 'user',
                targetName: bookings[0].name || 'Customer',
                anomalyScore: 0.88,
                description: `Suspicious booking burst: 3 consecutive service requests generated within ${Math.round(timeDiffMinutes)} minutes.`,
                reasons: [
                  'High velocity booking requests detected within 15 minutes',
                  'Possible automated bot or intentional availability harassment',
                  'Recommended: Verify customer phone number and card authorization',
                ],
                metadata: { burstCount: 3, timeSpanMinutes: timeDiffMinutes },
              });
              alertsFound.push(alert);
            }
            break;
          }
        }
      }
    }
  } catch (err) {
    console.error('[Fraud Scan - Rapid Bookings]:', err.message);
  }

  // 3. Scan for Abnormal Provider Velocity (e.g. multiple jobs marked COMPLETED in under 20 mins)
  try {
    const completedRecent = await Booking.find({
      status: 'COMPLETED',
      updatedAt: { $gte: last24Hours },
    })
      .sort({ updatedAt: 1 })
      .lean();

    const providerCompletedMap = {};
    completedRecent.forEach((b) => {
      const pId = b.providerId;
      if (pId) {
        if (!providerCompletedMap[pId]) providerCompletedMap[pId] = [];
        providerCompletedMap[pId].push({
          id: b.id,
          time: new Date(b.updatedAt).getTime(),
          name: b.providerName,
        });
      }
    });

    for (const [pId, jobs] of Object.entries(providerCompletedMap)) {
      if (jobs.length >= 2) {
        for (let i = 0; i < jobs.length - 1; i++) {
          const deltaMins = (jobs[i + 1].time - jobs[i].time) / (1000 * 60);
          if (deltaMins < 10) {
            const existing = await FraudAlert.findOne({
              targetId: pId,
              type: 'unusual_provider_activity',
              status: 'under_review',
            });
            if (!existing) {
              const alert = await FraudAlert.create({
                alertId: `fa_prov_${pId}_${Date.now().toString(36)}`,
                type: 'unusual_provider_activity',
                severity: 'medium',
                targetId: pId,
                targetType: 'provider',
                targetName: jobs[0].name || 'Technician',
                anomalyScore: 0.72,
                description: `Technician marked 2 consecutive jobs completed within only ${Math.round(deltaMins)} minutes, which is below the minimum realistic job duration.`,
                reasons: [
                  'Unrealistically short job duration between completions (<10 mins)',
                  'Possible collusion to fabricate completed job metrics or ratings',
                  'Administrative inspection recommended before earnings release',
                ],
                metadata: { timeBetweenCompletionsMinutes: deltaMins },
              });
              alertsFound.push(alert);
            }
            break;
          }
        }
      }
    }
  } catch (err) {
    console.error('[Fraud Scan - Provider Activity]:', err.message);
  }

  return {
    scannedAt: new Date(),
    newAlertsDetected: alertsFound.length,
    alerts: alertsFound,
  };
}

export default {
  runFraudAndAnomalyScan,
};

