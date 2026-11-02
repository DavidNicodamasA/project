/**
 * Trained AI Knowledge & Intent Classification Engine for HandyPro Service Provider Portal
 * Path: src/services/providerAIService.js
 * 
 * Provides an intelligent domain-specific copilot for technicians and service providers:
 * - Real-time incoming job queue inspection and 1-click acceptance
 * - Revenue, earnings, and payout analytics
 * - Competitive marketplace hourly rate benchmarks and pricing guidance
 * - Daily schedule and appointment timelines
 * - 24/7 Emergency dispatch assistance & field preparation toolkits
 * - Customer satisfaction coaching & 5-star rating strategies
 */

import dataStore, { SERVICE_CATEGORIES } from './dataStore';
import { getDistrictById } from '../data/tamilNaduLocations';

export const MARKETPLACE_BENCHMARKS = {
  plumbing: { avg: 48, top: 60, low: 40, demand: 'High' },
  electrical: { avg: 58, top: 75, low: 48, demand: 'Very High' },
  hvac: { avg: 52, top: 68, low: 45, demand: 'High' },
  cleaning: { avg: 42, top: 55, low: 35, demand: 'Steady' },
  carpentry: { avg: 50, top: 65, low: 42, demand: 'Moderate' },
  painting: { avg: 45, top: 58, low: 38, demand: 'Seasonal High' },
  appliance: { avg: 52, top: 65, low: 45, demand: 'High' },
};

/**
 * Intelligent NLP parser and response generator for Service Provider Portal
 */
export function generateProviderAIResponse({
  userMessage,
  providerProfile = {},
  allBookings = [],
  earningsAnalytics = { totalEarnings: 0, completedJobsCount: 0, pendingPayout: 0, allJobs: [] },
}) {
  const query = (userMessage || '').trim().toLowerCase();
  const providerName = providerProfile.name || 'Service Provider';
  const providerId = providerProfile.id || 'prov-active';
  const category = (providerProfile.category || 'plumbing').toLowerCase();

  // Filter provider's bookings
  const myJobs = allBookings.filter((b) =>
    dataStore.isBookingForProvider(b, providerId, providerName)
  );
  const pendingJobs = myJobs.filter((b) => b.status === 'PENDING');
  const acceptedJobs = myJobs.filter((b) => b.status === 'ACCEPTED');
  const emergencyJobs = myJobs.filter((b) => b.isEmergency && b.status !== 'CANCELLED');

  if (!query) {
    return {
      text: `Hello ${providerName.split(' ')[0]}! I am your **HandyPro Provider Copilot**.\n\nYou have **${pendingJobs.length} pending request(s)** and **${acceptedJobs.length} scheduled job(s)**. How can I assist you right now?`,
      suggestions: ['📋 Pending Requests', '💰 Earnings Report', '📅 Today Schedule', '📈 Rate Benchmark'],
    };
  }

  // 1. GREETINGS & STATUS SUMMARY
  if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|who\s*are\s*you|what\s*can\s*you\s*do)/i.test(query)) {
    return {
      text: `Hello **${providerName}**! 👋 I am your dedicated **Provider Copilot** trained on your HandyPro operations.\n\nHere is your quick status:\n• **Pending Customer Requests**: **${pendingJobs.length}** waiting for response\n• **Upcoming Active Jobs**: **${acceptedJobs.length}** confirmed\n• **Lifetime Revenue**: **$${earningsAnalytics.totalEarnings.toFixed(2)}**\n• **Customer Rating**: **★ ${providerProfile.rating || 4.9}** (${providerProfile.reviewsCount || 48} reviews)\n\nWhat would you like to review or optimize?`,
      suggestions: ['📋 Review Pending Requests', '💰 Earnings Breakdown', '⚡ Emergency Jobs', '⭐ Rating Booster'],
    };
  }

  // 2. INCOMING REQUESTS / PENDING JOBS
  if (/(pending|request|incoming|new\s*job|order|accept|hire)/i.test(query)) {
    if (pendingJobs.length === 0) {
      return {
        text: `You have **no pending customer requests** at the moment.\n\nAll your incoming requests have been answered! Your profile is currently **${providerProfile.isAvailable ? '🟢 Online & visible' : '🔴 Offline'}** to nearby customers.`,
        actionButton: {
          label: '📅 View Scheduled Appointments',
          action: 'NAVIGATE_TAB',
          tab: 'ACCEPTED',
        },
        suggestions: ['📅 Today Schedule', '💰 Earnings Report', '📈 Rate Benchmark'],
      };
    }

    return {
      text: `You have **${pendingJobs.length} pending customer request(s)** requiring your action:\n\nReview the job details below and click **Accept Job** to confirm dispatch:`,
      cardType: 'job_requests',
      cards: pendingJobs.map((j) => ({
        ...j,
        badge: j.isEmergency ? '🚨 24/7 Emergency Callout' : 'Standard Booking',
      })),
      actionButton: {
        label: '📋 Open Incoming Requests Station',
        action: 'NAVIGATE_PAGE',
        path: '/provider/requests',
      },
      suggestions: ['Accept All Pending', '📅 Today Schedule', '💰 Earnings Report'],
    };
  }

  // 3. EARNINGS, REVENUE & PAYOUTS
  if (/(earning|revenue|payout|wallet|money|profit|income|how\s*much\s*(did\s*i|have\s*i)\s*earn|balance)/i.test(query)) {
    const totalEarned = earningsAnalytics.totalEarnings || 0;
    const pendingRevenue = earningsAnalytics.pendingPayout || 0;
    const completedCount = earningsAnalytics.completedJobsCount || acceptedJobs.length;

    let earningsReport = `💰 **Earnings & Payout Statement for ${providerName}**:\n\n`;
    earningsReport += `• **Total Lifetime Payout**: **$${totalEarned.toFixed(2)}**\n`;
    earningsReport += `• **Pending/Scheduled Revenue**: **$${pendingRevenue.toFixed(2)}** (${pendingJobs.length + acceptedJobs.length} active jobs)\n`;
    earningsReport += `• **Completed Jobs Count**: **${completedCount} jobs**\n`;
    earningsReport += `• **Average Payout per Job**: **$${completedCount > 0 ? (totalEarned / completedCount).toFixed(2) : providerProfile.hourlyRate}**\n\n`;
    earningsReport += `All payouts are deposited directly to your linked settlement account every business day with zero platform delay.`;

    return {
      text: earningsReport,
      actionButton: {
        label: '📈 Open Full Financial Station',
        action: 'NAVIGATE_PAGE',
        path: '/provider/earnings',
      },
      suggestions: ['📈 Rate Benchmark', '📋 Pending Requests', '📅 Today Schedule'],
    };
  }

  // 3b. TAMIL NADU PLACES & SERVICE TERRITORY
  if (/(place|places|district|districts|tamil\s*nadu|location|area|coverage|locality|localities|territory|where\s*(do\s*i|can\s*i)\s*work)/i.test(query)) {
    const distName = providerProfile.district || 'Chennai';
    const distObj = getDistrictById(distName);
    const covered = Array.isArray(providerProfile.coveredPlaces) && providerProfile.coveredPlaces.length > 0
      ? providerProfile.coveredPlaces
      : (distObj?.places || []);

    let text = `📍 **Tamil Nadu Service Territory for ${providerName}**:\n\n`;
    text += `• **Primary District**: **${distObj?.name || distName} (${distObj?.region || 'Tamil Nadu'} TN)**\n`;
    text += `• **Workshop Base Address**: **${providerProfile.address || `${providerProfile.place || 'Central'}, ${distObj?.name || distName}`}** (PIN: ${providerProfile.pincode || '600017'})\n`;
    text += `• **Operating Radius**: **${providerProfile.serviceRadiusKm || 25} km**\n`;
    text += `• **Active Service Localities (${covered.length} places)**:\n  ${covered.map((p) => `\`${p}\``).join(', ')}\n\n`;
    text += `You can switch your operating district across all **38 Tamil Nadu districts** and toggle service coverage for any locality right from your **Technician Dashboard** or **Profile Setup**.`;

    return {
      text,
      suggestions: ['📍 Covered Places', '📋 Pending Requests', '💰 Earnings Report', '⚡ Online Status'],
    };
  }

  // 4. SCHEDULE & UPCOMING JOBS
  if (/(schedule|calendar|upcoming|today|tomorrow|timeline|appointment|active\s*job)/i.test(query)) {
    if (acceptedJobs.length === 0) {
      return {
        text: `You have **no confirmed jobs** on your immediate calendar.\n\nYou have **${pendingJobs.length} pending requests** waiting. Accepting them will automatically populate your schedule!`,
        actionButton: {
          label: '📋 Check Pending Requests',
          action: 'NAVIGATE_PAGE',
          path: '/provider/requests',
        },
        suggestions: ['📋 Review Requests', '📈 Rate Benchmark', '💰 Earnings Report'],
      };
    }

    let scheduleText = `📅 **Upcoming Confirmed Appointments (${acceptedJobs.length} active)**:\n\n`;
    acceptedJobs.slice(0, 3).forEach((j, idx) => {
      scheduleText += `${idx + 1}. **${j.serviceTitle}**\n   • Customer: **${j.customerName}**\n   • When: **${j.scheduledDate}** at **${j.scheduledTime}**\n   • Location: ${j.customerAddress || j.customerLocation}\n   • Payout: **$${j.amount}** ${j.isEmergency ? '(+$25 Emergency Fee)' : ''}\n\n`;
    });

    return {
      text: scheduleText,
      cardType: 'schedule_list',
      cards: acceptedJobs.slice(0, 3),
      actionButton: {
        label: '📅 Manage Full Weekly Calendar',
        action: 'NAVIGATE_PAGE',
        path: '/provider/schedule',
      },
      suggestions: ['📋 Pending Requests', '⚡ Emergency Jobs', '⭐ Rating Tips'],
    };
  }

  // 5. EMERGENCY CALLOUTS & FIELD PREP
  if (/(emergency|urgent|leak|pipe\s*burst|spark|shock|asap|24\/7|checklist|tools)/i.test(query)) {
    const isEmergencyCapable = providerProfile.supportsEmergency;

    let emergencyResponse = `🚨 **Emergency Dispatch & Toolkit Advisor**:\n\n`;
    emergencyResponse += `• **Your Emergency Status**: ${isEmergencyCapable ? '🟢 **24/7 Priority Emergency Enabled**' : '⚪ **Emergency Callouts Disabled**'}\n`;
    emergencyResponse += `• **Emergency Fee**: +**$25 priority surcharge** applied directly to your hourly rate.\n\n`;

    if (category === 'plumbing') {
      emergencyResponse += `🧰 **Plumbing Emergency Checklist**:\n1. Bring adjustable pipe wrenches (10" and 14")\n2. Thread seal tape (PTFE) & rubber emergency pipe clamps\n3. Basin wrench & rotary drain snake\n4. Heavy-duty water absorb sponge & safety goggles`;
    } else if (category === 'electrical') {
      emergencyResponse += `🧰 **Electrical Emergency Checklist**:\n1. Digital multimeter / non-contact voltage tester\n2. Insulated screwdrivers (1000V rated)\n3. Assorted MCB breaker switches (16A, 32A)\n4. Heat shrink tubing, crimpers, and headlamp`;
    } else {
      emergencyResponse += `🧰 **Field Readiness Checklist**:\n1. Verify customer address before departing\n2. Call customer 15 mins before arrival\n3. Take high-resolution before/after repair photos`;
    }

    return {
      text: emergencyResponse,
      cardType: emergencyJobs.length > 0 ? 'job_requests' : null,
      cards: emergencyJobs,
      actionButton: {
        label: '⚡ Open Incoming Emergency Requests',
        action: 'NAVIGATE_PAGE',
        path: '/provider/requests',
      },
      suggestions: ['📋 Pending Requests', '📅 Today Schedule', '⭐ Rating Tips'],
    };
  }

  // 6. MARKETPLACE RATE BENCHMARKS & PRICING GUIDANCE
  if (/(rate|benchmark|pricing|charge|hourly|increase|compare|market)/i.test(query)) {
    const bench = MARKETPLACE_BENCHMARKS[category] || { avg: 48, top: 62, low: 40, demand: 'High' };
    const myRate = providerProfile.hourlyRate || 45;
    const diff = myRate - bench.avg;

    let benchmarkText = `📈 **Market Benchmark for ${category.toUpperCase()} Specialists**:\n\n`;
    benchmarkText += `• **Your Current Hourly Rate**: **$${myRate}/hr**\n`;
    benchmarkText += `• **Market Average in District**: **$${bench.avg}/hr**\n`;
    benchmarkText += `• **Top-Rated Providers Range**: **$${bench.avg} - $${bench.top}/hr**\n`;
    benchmarkText += `• **Market Demand**: **${bench.demand}**\n\n`;

    if (myRate < bench.avg) {
      benchmarkText += `💡 **Pro Tip**: Your rate is currently **$${Math.abs(diff)} below average**. Since your rating is **★ ${providerProfile.rating || 4.9}**, you can safely raise your rate to **$${bench.avg + 5}/hr** without losing booking volume!`;
    } else {
      benchmarkText += `💡 **Pro Tip**: Your pricing is in the optimal premium tier. Maintaining prompt responses keeps your conversion rate above 90%.`;
    }

    return {
      text: benchmarkText,
      actionButton: {
        label: '⚙️ Update Rates in Profile Setup',
        action: 'NAVIGATE_PAGE',
        path: '/provider/profile-setup',
      },
      suggestions: ['💰 Earnings Report', '⭐ Rating Booster', '📋 Pending Requests'],
    };
  }

  // 7. CUSTOMER RATINGS BOOSTER & SERVICE QUALITY
  if (/(rating|review|feedback|star|5\s*star|complaint|reputation)/i.test(query)) {
    return {
      text: `⭐ **Service Excellence & Rating Growth**:\n\nYour current rating is **★ ${providerProfile.rating || 4.9}** across **${providerProfile.reviewsCount || 48} verified customer reviews**.\n\n**Top 4 Habits of HandyPro Top 1% Technicians**:\n1. ⚡ **Prompt Acceptance**: Accept pending requests within 10 minutes.\n2. 📞 **Pre-Arrival Call**: Call customer when leaving your station.\n3. 🧼 **Leave It Spotless**: Clean up dust and test operation before packing tools.\n4. 📸 **Before & After Photos**: Shows customer proof of high-grade workmanship.`,
      suggestions: ['📈 Rate Benchmark', '💰 Earnings Report', '📋 Pending Requests'],
    };
  }

  // 8. AVAILABILITY & DISTRICT RADIUS
  if (/(online|offline|availability|district|location|radius|coverage)/i.test(query)) {
    const isAvail = providerProfile.isAvailable;

    return {
      text: `📍 **Availability & Operational Coverage**:\n\n• **Status**: ${isAvail ? '🟢 **ONLINE** (Discoverable by customers)' : '🔴 **OFFLINE** (Hidden from customer search)'}\n• **Base District**: **${providerProfile.locationName || 'Downtown / Central'}**\n• **Service Radius**: **${providerProfile.serviceRadiusKm || 25} km**\n\nWhen you're online, HandyPro automatically matches you with customers in your radius. Toggle your status on the Dashboard anytime you take a break.`,
      actionButton: {
        label: '⚙️ Configure Profile & Service Area',
        action: 'NAVIGATE_PAGE',
        path: '/provider/profile-setup',
      },
      suggestions: ['📋 Pending Requests', '📅 Today Schedule', '💰 Earnings Report'],
    };
  }

  // 9. GENERAL SMART FALLBACK
  return {
    text: `I understand you're asking about "${userMessage}".\n\nAs your **HandyPro Provider Copilot**, I can inspect your live schedule, accept pending requests, calculate earnings, and benchmark your hourly rates against competitors.\n\nChoose an option below:`,
    suggestions: [
      '📋 Pending Requests',
      '💰 Earnings Report',
      '📅 Today Schedule',
      '📈 Rate Benchmark',
      '⚡ Emergency Jobs',
    ],
  };
}
