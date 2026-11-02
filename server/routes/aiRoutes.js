/**
 * AI & Machine Learning API Routes
 * Path: server/routes/aiRoutes.js
 */

import express from 'express';
import {
  getSmartProviderRecommendations,
  estimateServicePrice,
  analyzeReviewSentiment,
  allocateEmergencyProvider,
  getPredictiveMaintenance,
  optimizeRouteOrder,
} from '../services/aiService.js';
import {
  generateGeminiChatResponse,
  generateGeminiCopilotInsights,
  analyzeHouseholdIssueImage,
} from '../services/geminiService.js';
import Provider from '../models/Provider.js';
import Booking from '../models/Booking.js';
import Appliance from '../models/Appliance.js';
import ImageAnalysis from '../models/ImageAnalysis.js';

const router = express.Router();

/**
 * 1. Smart Provider Recommendation
 * POST /api/v1/ai/recommend-providers
 */
router.post('/recommend-providers', async (req, res) => {
  try {
    const { customerCoords, category, isEmergency, preferredMaxPrice, limit } = req.body;
    const recommendations = await getSmartProviderRecommendations({
      customerCoords,
      category,
      isEmergency,
      preferredMaxPrice,
      limit,
    });
    return res.json({
      success: true,
      count: recommendations.length,
      data: recommendations,
      engine: 'Multi-criteria Weighted Recommendation Engine',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 2. HandyAI Chatbot with Gemini Integration + Contextual Intelligence
 * POST /api/v1/ai/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const {
      message,
      customerName = 'Customer',
      currentLocation = 'Chennai (T. Nagar)',
      customerCoords = { lat: 13.0827, lng: 80.2707, locationId: 'chennai' },
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    // Load active real providers from MongoDB
    const liveProviders = await getSmartProviderRecommendations({
      customerCoords,
      limit: 6,
    });

    // Load active customer bookings
    const activeBookings = await Booking.find({
      $or: [
        { customerName: new RegExp(customerName, 'i') },
        { customerId: req.body.customerId || 'cust-user' },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    // Check emergency keywords
    const isEmergency = /(emergency|urgent|leak|pipe burst|water overflow|spark|short circuit|shock|gas leak|fire|flooding|asap|right now)/i.test(
      message
    );

    // Call secure Gemini LLM first
    const geminiText = await generateGeminiChatResponse({
      userMessage: message,
      customerName,
      currentLocation,
      providers: liveProviders,
      myBookings: activeBookings,
    });

    // Determine category from query if possible
    let detectedCategory = 'general';
    if (/plumb|leak|drain|pipe|tap|faucet|toilet|flush/i.test(message)) detectedCategory = 'plumbing';
    else if (/electr|switch|circuit|spark|power|wiring|bulb|short/i.test(message)) detectedCategory = 'electrical';
    else if (/ac|hvac|cool|filter|gas|compressor/i.test(message)) detectedCategory = 'hvac';
    else if (/clean|sanitize|wash|dust|mop/i.test(message)) detectedCategory = 'cleaning';
    else if (/carpent|door|wood|lock|furniture/i.test(message)) detectedCategory = 'carpentry';
    else if (/paint|color|wall/i.test(message)) detectedCategory = 'painting';
    else if (/appliance|fridge|washing|microwave|oven|ro|purifier/i.test(message)) detectedCategory = 'appliance';

    // Top recommended matching providers
    const topProviders = liveProviders
      .filter((p) => detectedCategory === 'general' || p.category === detectedCategory)
      .slice(0, 2);

    // Build structured suggestions
    let suggestions = ['⚡ Emergency Plumber', '📦 Track My Bookings', '💰 Pricing Guide', '⭐ Top Rated Experts'];
    if (isEmergency) {
      suggestions = ['🚨 Dispatch Emergency Provider', 'Turn off Main Valve', 'Call 24/7 Hotline'];
    }

    let replyText = geminiText;
    if (!replyText) {
      // Intelligent Domain-Trained Fallback
      if (isEmergency) {
        replyText = `🚨 **Emergency Assistance Detected!**\n\n`;
        if (/leak|water|pipe/i.test(message)) {
          replyText += `**Immediate Safety Step:** Please locate and shut off your main water valve to prevent damage.\n\n`;
        } else if (/spark|shock|electric/i.test(message)) {
          replyText += `**Immediate Safety Step:** Please stay clear of wet surfaces and turn off the circuit breaker if safely accessible.\n\n`;
        }
        replyText += `We have certified emergency specialists on standby in your area ready for fast-track dispatch.`;
      } else {
        replyText = `Hello **${customerName}**! I've analyzed your request regarding **${detectedCategory !== 'general' ? detectedCategory : 'home maintenance'}**.\n\nI found **${topProviders.length > 0 ? topProviders.length : 'verified'}** top-rated specialists active near **${currentLocation}**.`;
      }
    }

    return res.json({
      success: true,
      text: replyText,
      isEmergency,
      detectedCategory,
      suggestions,
      recommendedProviders: topProviders.length > 0 ? topProviders : liveProviders.slice(0, 2),
      actionButton: isEmergency
        ? {
            label: '⚡ 1-Click Priority Emergency Dispatch',
            action: 'OPEN_EMERGENCY_MODAL',
            provider: topProviders[0] || liveProviders[0],
          }
        : topProviders[0]
        ? {
            label: `Book ${topProviders[0].name} ($${topProviders[0].hourlyRate}/hr)`,
            action: 'BOOK_PROVIDER',
            provider: topProviders[0],
          }
        : null,
      source: geminiText ? 'Gemini 1.5 Flash LLM' : 'HandyPro AI Domain Engine',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 3. AI Service Price Estimation
 * POST /api/v1/ai/estimate-price
 */
router.post('/estimate-price', async (req, res) => {
  try {
    const { category, complexity, isEmergency, distanceKm, estimatedHours, materialsRequired } = req.body;
    const estimation = await estimateServicePrice({
      category: category || 'plumbing',
      complexity: complexity || 'standard',
      isEmergency: !!isEmergency,
      distanceKm: Number(distanceKm) || 3.5,
      estimatedHours: Number(estimatedHours) || 1.0,
      materialsRequired: !!materialsRequired,
    });
    return res.json({ success: true, data: estimation });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 4. Customer Review Sentiment Analysis
 * POST /api/v1/ai/sentiment-analysis
 */
router.post('/sentiment-analysis', async (req, res) => {
  try {
    const { comment, rating = 5.0, bookingId } = req.body;
    const analysis = await analyzeReviewSentiment({ comment, rating });

    // If bookingId provided, update reviewSentiment on booking
    if (bookingId) {
      await Booking.findOneAndUpdate(
        { id: bookingId },
        {
          $set: {
            reviewSentiment: {
              score: analysis.score,
              label: analysis.sentiment,
              summary: analysis.actionRecommendation,
              aspects: analysis.aspects,
            },
          },
        }
      );
    }

    return res.json({ success: true, data: analysis });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 5. Predictive Maintenance Reminders
 * GET & POST /api/v1/ai/predictive-maintenance
 */
router.post('/predictive-maintenance', async (req, res) => {
  try {
    const { applianceName, category, daysSinceLastService, usageLevel } = req.body;
    const result = await getPredictiveMaintenance({
      applianceName: applianceName || 'Living Room Split AC',
      category: category || 'hvac',
      daysSinceLastService: Number(daysSinceLastService) || 150,
      usageLevel: usageLevel || 'MODERATE',
    });
    return res.json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Fetch registered customer appliances & maintenance status
 * GET /api/v1/ai/appliances
 */
router.get('/appliances', async (req, res) => {
  try {
    const customerId = req.query.customerId || 'cust-user';
    let appliances = await Appliance.find({
      $or: [{ customerId }, { customerId: 'cust-user' }],
    }).lean();

    // If customer has no appliances yet, seed a few standard home appliances
    if (appliances.length === 0) {
      const defaultAppliances = [
        {
          id: `app-${Date.now()}-1`,
          customerId,
          customerName: 'Customer',
          name: 'Daikin Inverter Split AC 1.5 Ton',
          category: 'hvac',
          brand: 'Daikin',
          modelNumber: 'FTKF50TV16U',
          recommendedIntervalDays: 180,
          usageLevel: 'HIGH',
          healthScore: 72,
          status: 'MAINTENANCE_DUE',
          predictedIssues: ['Filter dust saturation', 'Refrigerant pressure drop'],
          recommendationAction: 'Seasonal chemical wash and gas level tune-up',
          lastServiceDate: new Date(Date.now() - 165 * 24 * 3600 * 1000),
        },
        {
          id: `app-${Date.now()}-2`,
          customerId,
          customerName: 'Customer',
          name: 'Kent Grand Plus RO Water Purifier',
          category: 'water_purifier',
          brand: 'Kent',
          modelNumber: 'KENT-11076',
          recommendedIntervalDays: 90,
          usageLevel: 'MODERATE',
          healthScore: 60,
          status: 'MAINTENANCE_DUE',
          predictedIssues: ['Sediment filter carbon depletion', 'TDS levels rising'],
          recommendationAction: 'Replace RO sediment and carbon filter cartridges',
          lastServiceDate: new Date(Date.now() - 95 * 24 * 3600 * 1000),
        },
        {
          id: `app-${Date.now()}-3`,
          customerId,
          customerName: 'Customer',
          name: 'Bosch Front Load Washing Machine 7kg',
          category: 'appliance',
          brand: 'Bosch',
          modelNumber: 'WAJ24266IN',
          recommendedIntervalDays: 240,
          usageLevel: 'MODERATE',
          healthScore: 92,
          status: 'GOOD',
          predictedIssues: ['No critical issues detected'],
          recommendationAction: 'Routine drum descaling recommended in 90 days',
          lastServiceDate: new Date(Date.now() - 60 * 24 * 3600 * 1000),
        },
      ];
      await Appliance.insertMany(defaultAppliances);
      appliances = defaultAppliances;
    }

    return res.json({ success: true, count: appliances.length, data: appliances });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 6. Provider Copilot AI Insights
 * POST /api/v1/ai/copilot-insights
 */
router.post('/copilot-insights', async (req, res) => {
  try {
    const { providerId, providerName = 'Service Provider', category = 'plumbing', question = '' } = req.body;

    const providerJobs = await Booking.find({
      $or: [{ providerId }, { providerName: new RegExp(providerName, 'i') }],
    }).lean();

    const pendingJobs = providerJobs.filter((b) => b.status === 'PENDING');
    const completedJobs = providerJobs.filter((b) => b.status === 'COMPLETED');
    const totalEarnings = completedJobs.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

    const geminiInsight = await generateGeminiCopilotInsights({
      providerName,
      category,
      pendingJobs,
      completedJobs,
      userQuestion: question,
    });

    const completionRate = providerJobs.length > 0
      ? Math.round((completedJobs.length / providerJobs.length) * 100)
      : 96;

    return res.json({
      success: true,
      data: {
        totalEarnings,
        pendingJobsCount: pendingJobs.length,
        completedJobsCount: completedJobs.length,
        completionRate,
        aiInsightText:
          geminiInsight ||
          `**Operational Summary for ${providerName}:**\n\n• You have **${pendingJobs.length} incoming requests** waiting for response. Fast acceptance under 10 minutes boosts your AI recommendation score by +15%.\n• Your completed job revenue stands at **$${totalEarnings}** with a **${completionRate}% completion rate**.\n• Peak customer booking hours in your district are **09:30 AM - 12:00 PM** and **04:30 PM - 07:00 PM**. Keep your status **Online** during these hours.`,
        pricingBenchmark: {
          categoryAverage: category === 'electrical' ? 55 : 45,
          recommendedRate: 50,
          marketDemand: 'High in your district',
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 7. AI Image-Based Household Problem Detection (Gemini Vision API)
 * POST /api/v1/ai/analyze-image
 */
router.post('/analyze-image', async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      userNotes = '',
      imageFileName = '',
      categoryHint = '',
      apiKeyOverride = '',
      customerId = 'cust-user',
      customerName = 'Customer',
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'Image base64 data is required.' });
    }

    // Call secure backend Gemini Vision analysis
    const analysis = await analyzeHouseholdIssueImage({
      imageBase64,
      mimeType,
      userNotes,
      imageFileName,
      categoryHint,
      apiKeyOverride,
    });

    const analysisId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Persist diagnosis in MongoDB
    const record = await ImageAnalysis.create({
      id: analysisId,
      customerId,
      customerName,
      imageUrl: imageBase64.length > 500 ? `${imageBase64.substring(0, 80)}...[Base64 Data]` : imageBase64,
      detectedIssues: analysis.detectedIssues || [],
      primaryIssue: analysis.primaryIssue || 'Household Issue',
      predictedCategory: analysis.predictedCategory || 'general',
      confidenceScore: analysis.confidenceScore || 0.85,
      urgencyLevel: analysis.urgencyLevel || 'medium',
      recommendedSkills: analysis.recommendedSkills || [],
      problemDescription: analysis.problemDescription || '',
      safetyNotice:
        analysis.safetyNotice ||
        '⚠️ AI diagnostic prediction only. Never declare gas, electrical, or structural issues safe without professional on-site evaluation.',
      estimatedPriceRange: analysis.estimatedPriceRange || { min: 45, max: 95 },
      status: 'analyzed',
    });

    return res.json({
      success: true,
      data: {
        analysisId: record.id,
        ...analysis,
        createdAt: record.createdAt,
      },
    });
  } catch (error) {
    console.error('[Analyze Image Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET Customer Image Problem History
 * GET /api/v1/ai/image-history
 */
router.get('/image-history', async (req, res) => {
  try {
    const { customerId } = req.query;
    const filter = customerId ? { customerId } : {};
    const history = await ImageAnalysis.find(filter).sort({ createdAt: -1 }).limit(10).lean();
    return res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * 8. AI Route Optimization for Providers
 * POST /api/v1/ai/optimize-route
 */
router.post('/optimize-route', async (req, res) => {
  try {
    const { startLocation, appointments } = req.body;
    if (!appointments || !Array.isArray(appointments) || appointments.length === 0) {
      return res.status(400).json({ success: false, message: 'Appointments array is required.' });
    }

    const routePlan = optimizeRouteOrder({
      startLocation: startLocation || { lat: 13.0827, lng: 80.2707, label: 'Current Base' },
      appointments,
    });

    return res.json({
      success: true,
      data: routePlan,
    });
  } catch (error) {
    console.error('[Route Optimization Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

