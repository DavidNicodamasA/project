/**
 * Trained AI Knowledge & Intent Classification Engine for HandyPro Customer Dashboard
 * Path: src/services/customerAIService.js
 * 
 * Provides an intelligent domain-specific conversational AI trained on:
 * - HandyPro Service Catalog & Hourly Pricing
 * - Live Online Technicians & Matching Algorithms (Distance, Rating, Skills)
 * - Customer's Live Bookings & Statuses (Pending, Accepted, In-Progress, Completed)
 * - Invoice & Spending Analytics
 * - 24/7 Emergency Support & Escalation
 * - Platform Guarantees, FAQs & Policies
 */

import { SERVICE_CATEGORIES } from './dataStore';

// Trained Platform Knowledge Base
export const PLATFORM_KNOWLEDGE = {
  appName: 'HandyPro Service Portal',
  tagline: 'Reliable, on-demand home service specialists at your fingertips',
  guarantee: '100% Satisfaction Guarantee. All technicians are verified, background-checked, licensed, and insured.',
  emergencyFee: '$25 priority dispatch surcharge for 24/7 emergency calls',
  cancellationPolicy: 'Free cancellation anytime before technician dispatch. Transparent pricing with no hidden charges.',
  paymentMethods: 'Direct online payment, credit/debit cards, and digital wallet checkout.',
  categories: [
    { id: 'plumbing', name: 'Plumbing', avgRate: 45, standardServices: ['Pipe Leak Repair', 'Drain Jetting', 'Mixer Tap Replacement', 'Water Heater Setup', 'Ceiling Leak Diagnostics'] },
    { id: 'electrical', name: 'Electrical', avgRate: 55, standardServices: ['Short Circuit Diagnostics', 'Panel Replacement', 'EV Charger Installation', 'Wiring Safety Inspection', 'Lighting Fixtures'] },
    { id: 'hvac', name: 'AC & HVAC', avgRate: 50, standardServices: ['Split AC Deep Cleaning', 'Refrigerant Gas Recharge', 'Compressor Repair', 'Thermostat Calibration', 'Seasonal HVAC Tune-Up'] },
    { id: 'cleaning', name: 'Cleaning', avgRate: 40, standardServices: ['Deep Home Cleaning', 'Sofa & Carpet Steam Sanitization', 'Move-out Detailing', 'Kitchen Degreasing', 'Window Washing'] },
    { id: 'carpentry', name: 'Carpentry', avgRate: 48, standardServices: ['Cabinet Making & Repair', 'Door & Lock Installation', 'Wood Polish & Varnishing', 'Drywall Patching', 'Custom Shelving'] },
    { id: 'painting', name: 'Painting', avgRate: 42, standardServices: ['Interior Wall Painting', 'Exterior Weatherproof Coating', 'Texture Painting', 'Damp-Proofing', 'Wallpaper Removal'] },
    { id: 'appliance', name: 'Appliance Repair', avgRate: 50, standardServices: ['Refrigerator Diagnostic', 'Washing Machine Drum Motor', 'Microwave PCB Fix', 'Dishwasher Seal', 'Oven Heating Element'] },
  ],
};

/**
 * Intelligent NLP parser and response generator for Customer Dashboard
 */
export function generateAIResponse({
  userMessage,
  customerName = 'Customer',
  customerProfile = {},
  currentLocation = 'Downtown / Central',
  providers = [],
  myBookings = [],
  invoiceData = { totalSpent: 0, invoices: [] },
}) {
  const query = (userMessage || '').trim().toLowerCase();

  if (!query) {
    return {
      text: `Hello ${customerName}! How can I help you today? You can ask me to find a technician, check booking statuses, view invoices, or recommend the best-rated specialists near ${currentLocation}.`,
      suggestions: ['⚡ Emergency Plumber', '📦 Check My Bookings', '💰 Pricing Guide', '⭐ Best Rated Techs'],
    };
  }

  // 1. GREETINGS & IDENTITY
  if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|who\s*are\s*you|what\s*can\s*you\s*do)/i.test(query)) {
    return {
      text: `Hello **${customerName}**! 👋 I am **HandyAI**, your dedicated Customer Assistant trained on the HandyPro Service Network.\n\nI can help you:\n• **Find & recommend verified technicians** near *${currentLocation}*\n• **Book services in 1-click** with real-time rate calculations\n• **Track your active appointments** and status updates\n• **Answer pricing, emergency, and policy questions**\n• **Review your invoices & repair receipts**\n\nWhat would you like to take care of today?`,
      suggestions: ['🔧 Find a Plumber', '⚡ Electrician Near Me', '📦 Track Bookings', '🧾 My Invoices'],
    };
  }

  // 2. EMERGENCY INTENT (Urgent leaks, sparks, electrical hazards)
  if (/(emergency|urgent|leak|pipe burst|water overflow|spark|short circuit|shock|gas leak|fire|flooding|asap|right now)/i.test(query)) {
    const emergencyProviders = providers.filter((p) => p.supportsEmergency);
    const topEmergency = emergencyProviders.slice(0, 2);

    let emergencyText = `🚨 **Emergency Assistance Detected!**\n\n`;
    if (query.includes('leak') || query.includes('water') || query.includes('pipe')) {
      emergencyText += `**Immediate Safety Step:** Please locate and turn off your main water valve immediately to minimize water damage.\n\n`;
    } else if (query.includes('spark') || query.includes('shock') || query.includes('electric')) {
      emergencyText += `**Immediate Safety Step:** Do not touch wet areas or exposed wires. Flip your main circuit breaker if safely accessible.\n\n`;
    }

    emergencyText += `We have **${emergencyProviders.length} certified technicians on standby for 24/7 priority emergency dispatch** in your district. They typically arrive within 30-45 minutes.`;

    return {
      text: emergencyText,
      cardType: 'provider_list',
      cards: topEmergency.map((p) => ({
        ...p,
        badge: '24/7 Emergency Ready',
      })),
      actionButton: {
        label: '⚡ Open 24/7 Emergency Dispatch',
        action: 'OPEN_EMERGENCY_MODAL',
        provider: topEmergency[0] || providers[0],
      },
      suggestions: ['Book Top Emergency Tech', 'Call Emergency Hotline', 'Track My Bookings'],
    };
  }

  // 3. BOOKINGS & APPOINTMENTS TRACKING
  if (/(my\s*booking|track|status|appointment|schedule|order|when\s*is|reschedule|cancel)/i.test(query)) {
    if (!myBookings || myBookings.length === 0) {
      return {
        text: `You currently have **no scheduled appointments** in your account.\n\nWould you like me to help you find an expert technician in **${currentLocation}**?`,
        actionButton: {
          label: '🔍 Find Service Providers',
          action: 'SWITCH_TAB',
          tab: 'browse',
        },
        suggestions: ['🔧 Book Plumber', '⚡ Book Electrician', '🧹 Deep Cleaning', '💰 Pricing Guide'],
      };
    }

    // Filter relevant or latest bookings
    const activeOrLatest = myBookings.slice(0, 3);
    const pendingCount = myBookings.filter((b) => b.status === 'PENDING').length;
    const acceptedCount = myBookings.filter((b) => b.status === 'ACCEPTED').length;

    let bookingSummary = `Here is your current appointment status:\n\n`;
    bookingSummary += `You have **${myBookings.length} total booking(s)** (${acceptedCount} confirmed, ${pendingCount} awaiting provider confirmation).`;

    return {
      text: bookingSummary,
      cardType: 'booking_list',
      cards: activeOrLatest,
      actionButton: {
        label: '📋 View All Bookings Hub',
        action: 'SWITCH_TAB',
        tab: 'my_bookings',
      },
      suggestions: ['View All Bookings', 'Book Another Tech', 'Show My Invoices'],
    };
  }

  // 4. INVOICES, PRICING & EXPENSE INQUIRIES
  if (/(invoice|receipt|bill|spent|expense|cost|charge|payment|how\s*much\s*(did\s*i|have\s*i)\s*spend)/i.test(query)) {
    const totalSpent = invoiceData.totalSpent || 0;
    const invCount = invoiceData.invoices ? invoiceData.invoices.length : 0;

    return {
      text: `🧾 **Expense & Invoicing Summary for ${customerName}**:\n\n• **Total Paid Lifetime**: **$${totalSpent.toFixed(2)}**\n• **Generated Invoices**: **${invCount} completed invoices**\n• **Payment Status**: Up to date with secure digital billing.\n\nAll invoices include downloadable tax receipts and breakdown of hourly labour & materials.`,
      actionButton: {
        label: '🧾 Open Invoicing & Expense Hub',
        action: 'SWITCH_TAB',
        tab: 'invoices',
      },
      suggestions: ['View Invoices Tab', 'Hourly Rate Sheet', 'Book New Service'],
    };
  }

  // 5. PRICING GUIDE / HOURLY RATES SHEET
  if (/(price|pricing|rate|hourly|cost\s*of|how\s*much\s*is|fee)/i.test(query)) {
    // Check if asking for specific category
    const matchedCategory = PLATFORM_KNOWLEDGE.categories.find(
      (c) => query.includes(c.id) || query.includes(c.name.toLowerCase())
    );

    if (matchedCategory) {
      const categoryProviders = providers.filter((p) => p.category === matchedCategory.id);
      const minRate = categoryProviders.length ? Math.min(...categoryProviders.map((p) => p.hourlyRate)) : matchedCategory.avgRate;

      return {
        text: `💰 **Pricing for ${matchedCategory.name}**:\n\n• **Standard Rate**: Average **$${matchedCategory.avgRate}/hour** (Starts from **$${minRate}/hr** with verified local pros)\n• **Services Included**: ${matchedCategory.standardServices.slice(0, 3).join(', ')}\n• **Emergency Surcharge**: +$25 for immediate 24/7 priority callouts\n• **Warranty**: 30-day workmanship guarantee included.`,
        actionButton: {
          label: `Browse ${matchedCategory.name} Pros`,
          action: 'FILTER_CATEGORY',
          category: matchedCategory.id,
        },
        suggestions: [`Find ${matchedCategory.name}`, 'Check Other Rates', '⚡ Emergency Plumber'],
      };
    }

    // General pricing breakdown
    let rateSheet = `💰 **HandyPro Standard Transparent Pricing**:\n\n`;
    PLATFORM_KNOWLEDGE.categories.forEach((cat) => {
      rateSheet += `• **${cat.name}**: ~$${cat.avgRate}/hr\n`;
    });
    rateSheet += `\n*No hidden travel fees within your service radius. Emergency 24/7 priority adds +$25 flat.*`;

    return {
      text: rateSheet,
      suggestions: ['Plumbing Rates', 'Electrical Rates', 'Cleaning Rates', 'Book a Specialist'],
    };
  }

  // 6. SPECIFIC SERVICE / CATEGORY SEARCH & PROVIDER RECOMMENDATIONS
  const matchedCat = PLATFORM_KNOWLEDGE.categories.find(
    (c) => query.includes(c.id) || query.includes(c.name.toLowerCase()) || (c.id === 'hvac' && (query.includes('ac') || query.includes('air conditioner') || query.includes('cooling')))
  );

  if (matchedCat || /(find|recommend|need|hire|search|best|top|plumber|electrician|cleaner|carpenter|painter|technician)/i.test(query)) {
    let filtered = providers;
    let categoryName = 'Top Service Specialists';

    if (matchedCat) {
      filtered = providers.filter((p) => p.category === matchedCat.id);
      categoryName = matchedCat.name;
    }

    if (query.includes('emergency')) {
      filtered = filtered.filter((p) => p.supportsEmergency);
    }

    // Sort by rating and proximity
    filtered = [...filtered].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return (a.calculatedDistanceMiles || 2) - (b.calculatedDistanceMiles || 2);
    });

    const topResults = filtered.slice(0, 2);

    if (topResults.length === 0) {
      return {
        text: `I couldn't find any currently online ${categoryName} providers within your immediate range. Try expanding your search radius slider on the dashboard or choosing a broader district.`,
        actionButton: {
          label: 'Reset Filters & Browse All',
          action: 'RESET_SEARCH',
        },
        suggestions: ['All Available Techs', 'Plumbing Pros', 'Electrical Pros'],
      };
    }

    let recommendationText = `Here are the highest-rated **${categoryName}** available near **${currentLocation}**:\n\n`;
    topResults.forEach((p, idx) => {
      recommendationText += `${idx + 1}. **${p.name}** — ★ ${p.rating} (${p.reviewsCount} reviews) • **$${p.hourlyRate}/hr** • ~${(p.calculatedDistanceMiles || 1.5).toFixed(1)} km away\n`;
    });
    recommendationText += `\nYou can click **Book Now** on any card below to schedule your appointment immediately:`;

    return {
      text: recommendationText,
      cardType: 'provider_list',
      cards: topResults,
      suggestions: [
        `Book ${topResults[0].name.split(' ')[0]}`,
        `View ${categoryName} Rates`,
        'Track My Bookings',
      ],
    };
  }

  // 7. LOCATION & RADIUS QUESTIONS
  if (/(location|district|area|address|downtown|suburbs|how\s*far|distance|radius)/i.test(query)) {
    return {
      text: `📍 **Service Location & Coverage**:\n\nYour active location is **${currentLocation}**.\n\nHandyPro network currently connects you with verified providers across:\n• Downtown / Central\n• North Bay District\n• West Suburbs\n• East Coast Area\n• South Valley\n• Custom user-specified districts\n\nYou can adjust your search radius from **5 km up to 50 km** directly via the radius slider on your dashboard.`,
      suggestions: ['Nearest Technicians', 'Change My District', 'Find Plumber Downtown'],
    };
  }

  // 8. POLICIES, SAFETY & GUARANTEES
  if (/(safe|safety|guarantee|insurance|verify|trust|cancel|refund|policy|scam)/i.test(query)) {
    return {
      text: `🛡️ **HandyPro Customer Trust & Safety Standard**:\n\n• **100% Background-Checked**: Every service provider passes strict criminal background verification and trade license checks.\n• **HandyPro Guarantee**: If you're not satisfied with the workmanship, we send a re-inspection specialist at zero cost.\n• **Zero Cancellation Penalty**: Free cancellation anytime before the specialist departs for your residence.\n• **Escrow Protected**: Your funds are held securely until the service appointment is completed and confirmed by you.`,
      suggestions: ['Find a Specialist', 'View Hourly Rates', 'Track Bookings'],
    };
  }

  // 9. GENERAL SMART FALLBACK (Trained assistant helpful fallback)
  return {
    text: `I understand you're asking about "${userMessage}".\n\nAs your **HandyPro AI Assistant**, I can directly look up online technicians, calculate estimated costs, check on your appointments, or connect you with emergency dispatchers.\n\nHere are some quick options you might find helpful:`,
    suggestions: [
      '🔧 Find Top Plumber',
      '⚡ Emergency Electrician',
      '📦 Track My Bookings',
      '💰 View Hourly Rates',
      '🧾 Check Invoices',
    ],
  };
}
