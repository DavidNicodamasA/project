/**
 * Live GPS Tracking Routes (Leaflet & Socket.IO Support)
 * Path: server/routes/trackingRoutes.js
 */

import express from 'express';
import TechnicianLocation from '../models/TechnicianLocation.js';
import Booking from '../models/Booking.js';
import Provider from '../models/Provider.js';

const router = express.Router();

/**
 * GET latest tracking position & status for a booking
 * GET /api/v1/tracking/:bookingId
 */
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ id: bookingId }).lean();
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    let tracking = await TechnicianLocation.findOne({ bookingId }).lean();

    // If tracking doc doesn't exist yet, initialize it from provider coordinates
    if (!tracking && booking.providerId) {
      const provider = await Provider.findOne({ id: booking.providerId }).lean();
      const provLat = provider?.latitude || 13.0827;
      const provLng = provider?.longitude || 80.2707;

      tracking = {
        providerId: booking.providerId,
        bookingId,
        latitude: provLat,
        longitude: provLng,
        heading: 0,
        speed: 0,
        status: booking.status === 'IN_PROGRESS' ? 'in_progress' : 'on_the_way',
        isTrackingActive: booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED',
        estimatedArrivalMinutes: 12,
        lastUpdated: new Date(),
        locationHistory: [{ latitude: provLat, longitude: provLng, timestamp: new Date() }],
      };
    }

    return res.json({
      success: true,
      data: {
        bookingId,
        serviceTitle: booking.serviceTitle,
        customerName: booking.customerName,
        customerAddress: booking.address,
        providerName: booking.providerName,
        status: booking.status,
        tracking,
      },
    });
  } catch (error) {
    console.error('[Tracking Fetch Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST update technician GPS coordinates (HTTP endpoint fallback to Socket.IO)
 * POST /api/v1/tracking/:bookingId/location
 */
router.post('/:bookingId/location', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { providerId, latitude, longitude, heading = 0, speed = 0, status = 'on_the_way' } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required.' });
    }

    const booking = await Booking.findOne({ id: bookingId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Stop tracking if booking is finished
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Tracking is disabled for completed or cancelled bookings.',
      });
    }

    const updated = await TechnicianLocation.findOneAndUpdate(
      { bookingId },
      {
        $set: {
          providerId: providerId || booking.providerId,
          latitude: Number(latitude),
          longitude: Number(longitude),
          heading: Number(heading),
          speed: Number(speed),
          status,
          isTrackingActive: true,
          lastUpdated: new Date(),
        },
        $push: {
          locationHistory: {
            $each: [{ latitude: Number(latitude), longitude: Number(longitude), timestamp: new Date() }],
            $slice: -40, // Keep last 40 breadcrumbs
          },
        },
      },
      { new: true, upsert: true }
    );

    // If socket.io is attached to app, broadcast to booking room
    const io = req.app.get('io');
    if (io) {
      io.to(`booking_${bookingId}`).emit('provider_location_updated', {
        bookingId,
        providerId: updated.providerId,
        latitude: updated.latitude,
        longitude: updated.longitude,
        heading: updated.heading,
        speed: updated.speed,
        status: updated.status,
        lastUpdated: updated.lastUpdated,
      });
    }

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error('[Update Location Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Stop GPS tracking on completion or cancellation
 * POST /api/v1/tracking/:bookingId/stop
 */
router.post('/:bookingId/stop', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updated = await TechnicianLocation.findOneAndUpdate(
      { bookingId },
      { $set: { isTrackingActive: false, status: 'completed' } },
      { new: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`booking_${bookingId}`).emit('tracking_stopped', {
        bookingId,
        message: 'Technician has stopped location broadcast.',
      });
    }

    return res.json({ success: true, message: 'Tracking stopped successfully.', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

