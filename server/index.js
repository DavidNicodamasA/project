/**
 * HandyPro Backend API Server with MongoDB & Mongoose
 * Path: server/index.js
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './config/db.js';
import seedDatabase from './seed/seedData.js';
import Provider from './models/Provider.js';
import Booking from './models/Booking.js';
import User from './models/User.js';
import TechnicianLocation from './models/TechnicianLocation.js';
import authRoutes from './routes/authRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import warrantyRoutes from './routes/warrantyRoutes.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.IO Setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Attach Socket.IO to Express app instance
app.set('io', io);

// Middlewares - Support Base64 Image Uploads
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Socket.IO Connection & Tracking Rooms
io.on('connection', (socket) => {
  // Join Room for specific booking live tracking
  socket.on('join_booking_tracking', ({ bookingId }) => {
    if (bookingId) {
      socket.join(`booking_${bookingId}`);
    }
  });

  // Leave Room
  socket.on('leave_booking_tracking', ({ bookingId }) => {
    if (bookingId) {
      socket.leave(`booking_${bookingId}`);
    }
  });

  // Provider emits live coordinates
  socket.on('update_provider_location', async (data) => {
    try {
      const { bookingId, providerId, latitude, longitude, heading = 0, speed = 0, status = 'on_the_way' } = data;
      if (!bookingId || !latitude || !longitude) return;

      // Update in MongoDB
      const updated = await TechnicianLocation.findOneAndUpdate(
        { bookingId },
        {
          $set: {
            providerId,
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
              $slice: -40,
            },
          },
        },
        { new: true, upsert: true }
      );

      // Broadcast to all clients in that booking room
      io.to(`booking_${bookingId}`).emit('provider_location_updated', {
        bookingId,
        providerId,
        latitude: updated.latitude,
        longitude: updated.longitude,
        heading: updated.heading,
        speed: updated.speed,
        status: updated.status,
        lastUpdated: updated.lastUpdated,
      });
    } catch (err) {
      console.error('[Socket update location error]:', err.message);
    }
  });

  // Stop tracking
  socket.on('stop_provider_tracking', async ({ bookingId }) => {
    try {
      if (bookingId) {
        await TechnicianLocation.findOneAndUpdate(
          { bookingId },
          { $set: { isTrackingActive: false, status: 'completed' } }
        );
        io.to(`booking_${bookingId}`).emit('tracking_stopped', {
          bookingId,
          message: 'Technician has completed or stopped tracking.',
        });
      }
    } catch (err) {
      console.error('[Socket stop tracking error]:', err.message);
    }
  });
});

// Mount Authentication Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);

// Mount AI / ML Routes
app.use('/api/v1/ai', aiRoutes);
app.use('/api/ai', aiRoutes);

// Mount Admin Routes
app.use('/api/v1/admin', adminRoutes);
app.use('/api/admin', adminRoutes);

// Mount Bookings & Dispatch Routes
app.use('/api/v1', bookingRoutes);
app.use('/api', bookingRoutes);

// Mount Live GPS Tracking Routes
app.use('/api/v1/tracking', trackingRoutes);
app.use('/api/tracking', trackingRoutes);

// Mount Home Maintenance Subscriptions Routes
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Mount Digital Service Warranty Routes
app.use('/api/v1/warranties', warrantyRoutes);
app.use('/api/warranties', warrantyRoutes);

// Health check & MongoDB status
const healthHandler = (req, res) => {
  res.json({
    status: 'ok',
    service: 'HandyPro Hyperlocal AI Backend Server',
    database: 'MongoDB',
    connection: 'Connected to mongodb://127.0.0.1:27017/handypro',
    features: [
      'AI Smart Provider Recommendation (Scikit-Learn/FastAPI & Weighted Scoring)',
      'Gemini-Powered HandyAI Chatbot',
      'AI Dynamic Price Estimation',
      'Emergency SOS Dispatch & Nearest Provider Allocation',
      'AI Customer Review Sentiment Analysis',
      'Predictive Appliance Maintenance Reminders',
      'Provider Copilot AI Insights',
      'Real Database Admin Analytics',
      'Live Booking Status Tracking & Digital Invoices',
    ],
    timestamp: new Date().toISOString(),
  });
};
app.get('/api/v1/health', healthHandler);
app.get('/api/health', healthHandler);

// Providers Endpoints (preserved & enhanced)
const getProvidersHandler = async (req, res) => {
  try {
    const { category, isAvailable } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

    const providers = await Provider.find(filter).sort({ rating: -1 });
    res.json({ success: true, count: providers.length, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
app.get('/api/v1/providers', getProvidersHandler);
app.get('/api/providers', getProvidersHandler);

const getProviderByIdHandler = async (req, res) => {
  try {
    const provider = await Provider.findOne({ id: req.params.id });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    res.json({ success: true, data: provider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
app.get('/api/v1/providers/:id', getProviderByIdHandler);
app.get('/api/providers/:id', getProviderByIdHandler);

const updateProviderHandler = async (req, res) => {
  try {
    const updated = await Provider.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
app.put('/api/v1/providers/:id', updateProviderHandler);
app.put('/api/providers/:id', updateProviderHandler);

// Provider Portfolio / Done Work Handlers
const addProviderPortfolioHandler = async (req, res) => {
  try {
    const { title, category, description, imageUrl, completedDate, customerLocation } = req.body;
    if (!title || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Work title and photo image are required.' });
    }

    const newWork = {
      id: `work_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title,
      category: category || 'General Craftsmanship',
      description: description || '',
      imageUrl,
      completedDate: completedDate || new Date().toISOString().split('T')[0],
      customerLocation: customerLocation || 'Local Service Area',
      createdAt: new Date(),
    };

    const provider = await Provider.findOneAndUpdate(
      { $or: [{ id: req.params.id }, { email: req.params.id }] },
      { $push: { portfolio: newWork } },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    return res.status(201).json({
      success: true,
      message: 'Completed work uploaded to portfolio successfully.',
      portfolio: provider.portfolio,
      work: newWork,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
app.post('/api/v1/providers/:id/portfolio', addProviderPortfolioHandler);
app.post('/api/providers/:id/portfolio', addProviderPortfolioHandler);

const deleteProviderPortfolioHandler = async (req, res) => {
  try {
    const { id, workId } = req.params;
    const provider = await Provider.findOneAndUpdate(
      { $or: [{ id }, { email: id }] },
      { $pull: { portfolio: { id: workId } } },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Provider not found' });
    }

    return res.json({
      success: true,
      message: 'Portfolio item deleted.',
      portfolio: provider.portfolio,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
app.delete('/api/v1/providers/:id/portfolio/:workId', deleteProviderPortfolioHandler);
app.delete('/api/providers/:id/portfolio/:workId', deleteProviderPortfolioHandler);

// Start Server & Connect MongoDB
async function startServer() {
  await connectDB();
  await seedDatabase();

  httpServer.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 HandyPro Express Server running on Port ${PORT}`);
    console.log(`📦 MongoDB Database: mongodb://127.0.0.1:27017/handypro`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api/v1 and http://localhost:${PORT}/api`);
    console.log(`📡 Socket.IO Real-Time GPS Tracking: Enabled`);
    console.log(`🤖 AI/ML Features & Gemini Integration: Ready`);
    console.log(`===============================================`);
  });
}

startServer();
