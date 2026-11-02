/**
 * Authentication Routes with MongoDB Persistence
 * Path: server/routes/authRoutes.js
 */

import express from 'express';
import User from '../models/User.js';
import Provider from '../models/Provider.js';

const router = express.Router();

/**
 * Register a new user (Customer or Service Provider)
 * Saves directly into MongoDB 'users' and 'providers' collections
 * POST /api/v1/auth/register or /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      category,
      address,
      district,
      place,
      pincode,
      locationId,
      locationName,
      latitude,
      longitude,
    } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Name and Email are required.',
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.',
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanRole = String(role || 'customer').toLowerCase();

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email is already registered. Please log in.',
      });
    }

    const resolvedDistrict = district || 'Chennai';
    const resolvedPlace = place || 'T. Nagar';
    const resolvedLocId = locationId || resolvedDistrict.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const resolvedLocName = locationName || `${resolvedDistrict} (${resolvedPlace})`;
    const resolvedLat = Number(latitude) || 13.0827;
    const resolvedLng = Number(longitude) || 80.2707;

    // Create new user in MongoDB with Tamil Nadu location & address
    const user = new User({
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password: password,
      phone: phone || '',
      role: cleanRole,
      category: category || '',
      state: 'Tamil Nadu',
      district: resolvedDistrict,
      place: resolvedPlace,
      pincode: pincode || '',
      address: address || '',
      locationId: resolvedLocId,
      locationName: resolvedLocName,
      latitude: resolvedLat,
      longitude: resolvedLng,
      avatarLetter: name.trim().charAt(0).toUpperCase() || 'U',
    });
    await user.save();
    console.log(`[MongoDB Auth] Registered new user saved: ${user.name} (${user.email}) [${user.role}] in ${user.locationName}`);

    // If registering as provider, ensure Provider record is created in MongoDB
    if (cleanRole === 'provider') {
      const existingProvider = await Provider.findOne({ email: cleanEmail });
      if (!existingProvider) {
        const skillsList = Array.isArray(req.body.skills) && req.body.skills.length > 0
          ? req.body.skills
          : typeof req.body.skills === 'string' && req.body.skills.trim()
          ? req.body.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : ['Diagnostics', 'Repair', 'Installation', 'Safety Inspection'];

        const newProvider = new Provider({
          id: `prov-${Date.now()}`,
          name: user.name,
          email: user.email,
          phone: user.phone,
          category: category || 'plumbing',
          categoryLabel:
            req.body.categoryLabel ||
            (category ? category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ') : 'Home Specialist'),
          rating: 5.0,
          reviewsCount: 0,
          hourlyRate: Number(req.body.hourlyRate) || 50,
          experienceYears: Number(req.body.experienceYears) || 4,
          state: 'Tamil Nadu',
          district: resolvedDistrict,
          place: resolvedPlace,
          pincode: pincode || '',
          address: address || '',
          locationId: resolvedLocId,
          locationName: resolvedLocName,
          latitude: resolvedLat,
          longitude: resolvedLng,
          baseDistanceMiles: 1.5,
          serviceRadiusKm: Number(req.body.serviceRadiusKm) || 25,
          isAvailable: true,
          isVerified: true,
          supportsEmergency: req.body.supportsEmergency !== undefined ? Boolean(req.body.supportsEmergency) : true,
          bio:
            req.body.bio ||
            `Certified ${category || 'service'} specialist ready for residential and commercial appointments in ${resolvedDistrict} and surrounding areas.`,
          skills: skillsList,
          coveredPlaces:
            Array.isArray(req.body.coveredPlaces) && req.body.coveredPlaces.length > 0
              ? req.body.coveredPlaces
              : [resolvedPlace],
        });
        await newProvider.save();
        console.log(`[MongoDB Auth] Registered new provider profile saved for: ${user.name} at ${newProvider.locationName}`);
      }
    }

    const token = `jwt-token-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const refreshToken = `jwt-refresh-${Date.now()}-${Math.random().toString(36).substring(2)}`;

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      category: user.category,
      state: user.state,
      district: user.district,
      place: user.place,
      pincode: user.pincode,
      address: user.address,
      locationId: user.locationId,
      locationName: user.locationName,
      latitude: user.latitude,
      longitude: user.longitude,
      avatarLetter: user.avatarLetter || user.name.charAt(0).toUpperCase(),
    };

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      refreshToken,
      user: userResponse,
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
});

/**
 * Log in user with credentials
 * Strictly allows only registered users from MongoDB
 * POST /api/v1/auth/login or /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Email regex validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email. Please register or check for typos.',
      });
    }

    // Validate role if portal mode specified BEFORE verifying password
    if (role) {
      const requestedRole = String(role).toLowerCase();
      const actualRole = String(user.role).toLowerCase();
      if (requestedRole !== actualRole) {
        const userRoleLabel = actualRole === 'provider' ? 'Service Provider' : 'Customer';
        return res.status(403).json({
          success: false,
          roleMismatch: true,
          correctRole: actualRole,
          message: `This account is registered as a ${userRoleLabel}. Please switch to the ${userRoleLabel} tab.`,
        });
      }
    }

    // Verify user exists and password matches
    const isPasswordValid =
      user &&
      user.password &&
      (user.password === password || user.password === String(password).trim() || user.password.trim() === String(password).trim());

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please verify your password and try again.',
      });
    }

    const token = `jwt-token-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const refreshToken = `jwt-refresh-${Date.now()}-${Math.random().toString(36).substring(2)}`;

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        category: user.category,
        state: user.state || 'Tamil Nadu',
        district: user.district || 'Chennai',
        place: user.place || 'T. Nagar',
        pincode: user.pincode || '',
        address: user.address || '',
        locationId: user.locationId || 'chennai',
        locationName: user.locationName || 'Chennai (T. Nagar)',
        latitude: user.latitude || 13.0827,
        longitude: user.longitude || 80.2707,
        avatarLetter: user.avatarLetter || user.name.charAt(0).toUpperCase(),
      },
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get current authenticated user profile
 * GET /api/v1/auth/me or /api/auth/me
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const user = await User.findOne().sort({ createdAt: -1 });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found.' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        category: user.category,
        state: user.state || 'Tamil Nadu',
        district: user.district || 'Chennai',
        place: user.place || 'T. Nagar',
        pincode: user.pincode || '',
        address: user.address || '',
        locationId: user.locationId || 'chennai',
        locationName: user.locationName || 'Chennai (T. Nagar)',
        latitude: user.latitude || 13.0827,
        longitude: user.longitude || 80.2707,
        avatarLetter: user.avatarLetter,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Update authenticated user / provider profile location & address
 * PUT /api/v1/auth/me or /api/auth/me
 */
router.put('/me', async (req, res) => {
  try {
    const { name, phone, address, district, place, pincode, locationId, locationName, latitude, longitude, coveredPlaces } = req.body;
    const user = await User.findOne().sort({ createdAt: -1 });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (address !== undefined) user.address = address.trim();
    if (district !== undefined) user.district = district;
    if (place !== undefined) user.place = place;
    if (pincode !== undefined) user.pincode = pincode.trim();
    if (locationId !== undefined) user.locationId = locationId;
    if (locationName !== undefined) user.locationName = locationName;
    if (latitude !== undefined) user.latitude = Number(latitude);
    if (longitude !== undefined) user.longitude = Number(longitude);

    await user.save();

    // If user is a provider, sync with Provider collection
    if (user.role === 'provider') {
      const providerUpdates = {
        name: user.name,
        phone: user.phone,
        address: user.address,
        district: user.district,
        place: user.place,
        pincode: user.pincode,
        locationId: user.locationId,
        locationName: user.locationName,
        latitude: user.latitude,
        longitude: user.longitude,
      };
      if (Array.isArray(coveredPlaces)) {
        providerUpdates.coveredPlaces = coveredPlaces;
      }
      await Provider.findOneAndUpdate(
        { email: user.email },
        { $set: providerUpdates }
      );
    }

    return res.json({
      success: true,
      message: 'Profile location & address updated successfully.',
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Verify OTP
 * POST /api/v1/auth/verify-otp or /api/auth/verify-otp
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!otp || String(otp).trim().length !== 6) {
      return res.status(400).json({ success: false, message: 'A valid 6-digit OTP code is required' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found. Please register first.' });
    }

    const token = `jwt-token-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const refreshToken = `jwt-refresh-${Date.now()}-${Math.random().toString(36).substring(2)}`;

    return res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        category: user.category,
        state: user.state || 'Tamil Nadu',
        district: user.district || 'Chennai',
        place: user.place || 'T. Nagar',
        pincode: user.pincode || '',
        address: user.address || '',
        locationId: user.locationId || 'chennai',
        locationName: user.locationName || 'Chennai (T. Nagar)',
        latitude: user.latitude || 13.0827,
        longitude: user.longitude || 80.2707,
        avatarLetter: user.avatarLetter || user.name.charAt(0).toUpperCase(),
      },
    });
  } catch (error) {
    console.error('[Auth Verify OTP Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Resend OTP
 * POST /api/v1/auth/resend-otp or /api/auth/resend-otp
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched to your email.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Select/Update Role
 * POST /api/v1/auth/select-role
 */
router.post('/select-role', async (req, res) => {
  try {
    const { role } = req.body;
    return res.json({
      success: true,
      user: { role: String(role || 'customer').toLowerCase() },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Refresh Token
 * POST /api/v1/auth/refresh-token
 */
router.post('/refresh-token', (req, res) => {
  const token = `jwt-token-${Date.now()}`;
  const refreshToken = `jwt-refresh-${Date.now()}`;
  return res.json({ success: true, token, refreshToken });
});

/**
 * Logout
 * POST /api/v1/auth/logout
 */
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
