const express = require('express');
const userRouter = express.Router();
const subRouter = express.Router();

const excelService = require('../services/excelService');
const paypalService = require('../services/paypalService');
const { authMiddleware } = require('../middleware/auth');

// ─── Users ────────────────────────────────────────────────────────────────────
userRouter.use(authMiddleware);

userRouter.get('/', async (req, res) => {
  try {
    const users = await excelService.getUsers(req.user.shop_id);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

userRouter.put('/:id/role', async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owner can change roles' });
    }
    await excelService.updateUser(req.user.shop_id, req.params.id, { role: req.body.role });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

userRouter.put('/:id/deactivate', async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owner can deactivate users' });
    }
    await excelService.updateUser(req.user.shop_id, req.params.id, { active: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Subscriptions ────────────────────────────────────────────────────────────
subRouter.use(authMiddleware);

subRouter.post('/create', async (req, res) => {
  try {
    const { return_url, cancel_url } = req.body;
    const result = await paypalService.createSubscription(
      req.user.shop_id,
      process.env.PAYPAL_PLAN_ID,
      return_url || 'https://yourdomain.com/success',
      cancel_url || 'https://yourdomain.com/cancel'
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

subRouter.get('/status', async (req, res) => {
  try {
    const settings = await excelService.getSettings(req.user.shop_id);
    const subscriptionId = settings.subscription_id;

    if (!subscriptionId) {
      const trialEnd = settings.trial_end || req.user.trial_end;
      const daysLeft = trialEnd
        ? Math.max(0, Math.ceil((new Date(trialEnd) - new Date()) / 86400000))
        : 0;
      return res.json({
        status: daysLeft > 0 ? 'trial' : 'expired',
        trial_end: trialEnd,
        days_left: daysLeft,
      });
    }

    const status = await paypalService.getSubscriptionStatus(subscriptionId);
    res.json({ status: status.status, billing_info: status.billing_info });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

subRouter.post('/activate', async (req, res) => {
  try {
    const { subscription_id } = req.body;
    if (!subscription_id) return res.status(400).json({ error: 'subscription_id required' });

    const status = await paypalService.getSubscriptionStatus(subscription_id);
    if (status.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Subscription not active on PayPal' });
    }

    await excelService.updateSetting(req.user.shop_id, 'subscription_id', subscription_id);
    res.json({ success: true, status: 'active' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { userRouter, subRouter };
