import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Helper to generate referral code
const generateReferralCode = () => {
  return 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'dapp_secret_jwt_key_987654321_secure',
    { expiresIn: '30d' }
  );
};

export const register = async (req, res) => {
  try {
    const { name, email, password, referralCode, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    let referredByUser = null;
    if (referralCode) {
      referredByUser = await User.findOne({ referralCode: referralCode.trim() });
      if (!referredByUser) {
        return res.status(400).json({ success: false, message: 'Invalid referral code' });
      }
      // Rule: Inactive user cannot refer
      if (referredByUser.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Referrer is not an active member. Referral code cannot be used.',
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate unique referral code for this new user
    let userReferralCode = generateReferralCode();
    while (await User.findOne({ referralCode: userReferralCode })) {
      userReferralCode = generateReferralCode();
    }

    const assignedRole = role === 'admin' ? 'admin' : 'user';
    // Admin is active by default; users are inactive until purchasing a package
    const initialStatus = assignedRole === 'admin' ? 'active' : 'inactive';

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: assignedRole,
      status: initialStatus,
      referralCode: userReferralCode,
      referredBy: referredByUser ? referredByUser._id : null,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        referralCode: user.referralCode,
        canRefer: user.status === 'active',
        purchasedPackage: user.purchasedPackage,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, username, userId } = req.body;
    const identifier = (email || username || userId || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide User ID / Email and password' });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { userId: identifier.toUpperCase() },
        { userId: identifier },
      ],
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        referralCode: user.referralCode,
        canRefer: user.status === 'active',
        purchasedPackage: user.purchasedPackage,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during login' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('referredBy', 'name email');

    // Count referrals
    const referralCount = await User.countDocuments({ referredBy: user._id });
    const activeReferralCount = await User.countDocuments({ referredBy: user._id, status: 'active' });

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        referralCode: user.referralCode,
        canRefer: user.status === 'active',
        purchasedPackage: user.purchasedPackage,
        referredBy: user.referredBy,
        referralStats: {
          total: referralCount,
          active: activeReferralCount,
        },
      },
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

