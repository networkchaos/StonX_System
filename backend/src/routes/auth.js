const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const excelService = require('../services/excelService');
const storageService = require('../services/storageService');
const { createShopExcelTemplate } = require('../utils/excelTemplate');
const { authMiddleware } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Creates a new shop owner account + Excel database
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, shop_name, excel_file_name } = req.body;

    if (!name || !email || !password || !shop_name) {
      return res.status(400).json({ error: 'name, email, password, shop_name required' });
    }

    // Generate unique shop ID
    const shopId = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
    const fileName = `shop_${shopId}.xlsx`;

    // Check if file name hint already exists (best effort)
    // Create Excel database for this shop
    const excelBuffer = await createShopExcelTemplate(shop_name);
    await storageService.uploadFile(fileName, excelBuffer);

    // Hash password and create owner user in Excel
    const hashedPassword = await bcrypt.hash(password, 12);
    const ownerId = uuidv4();

    await excelService.addUser(shopId, {
      id: ownerId,
      name,
      email,
      password: hashedPassword,
      role: 'owner',
    });

    // Set custom excel file name in settings if provided
    if (excel_file_name) {
      await excelService.updateSetting(shopId, 'excel_file_name', excel_file_name);
    }
    await excelService.updateSetting(shopId, 'owner_id', ownerId);

    const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const token = jwt.sign(
      {
        user_id: ownerId,
        shop_id: shopId,
        role: 'owner',
        name,
        email,
        shop_name,
        trial_end: trialEnd,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    res.status(201).json({
      token,
      user: { id: ownerId, name, email, role: 'owner' },
      shop: { id: shopId, name: shop_name, trial_end: trialEnd },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Login with email + password + shop_id
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, shop_id } = req.body;

    if (!email || !password || !shop_id) {
      return res.status(400).json({ error: 'email, password, shop_id required' });
    }

    const user = await excelService.getUserByEmail(shop_id, email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.active) return res.status(401).json({ error: 'Account disabled' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const settings = await excelService.getSettings(shop_id);
    const trialEnd = settings.trial_end || new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const token = jwt.sign(
      {
        user_id: user.id,
        shop_id,
        role: user.role,
        name: user.name,
        email: user.email,
        shop_name: settings.shop_name,
        trial_end: trialEnd,
        subscription_id: settings.subscription_id || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      shop: {
        id: shop_id,
        name: settings.shop_name,
        trial_end: trialEnd,
        subscription_id: settings.subscription_id || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/add-worker
 * Owner adds a worker to their shop
 */
router.post('/add-worker', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'owner' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Only owner or manager can add workers' });
    }
    const { name, email, password, role = 'staff' } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);

    const worker = await excelService.addUser(req.user.shop_id, {
      name, email, password: hashedPassword, role,
    });

    res.status(201).json({ worker });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
