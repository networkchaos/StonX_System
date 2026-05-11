const express = require('express');
const router = express.Router();
const excelService = require('../services/excelService');
const { authMiddleware } = require('../middleware/auth');
const { checkSubscription } = require('../middleware/subscription');

router.use(authMiddleware, checkSubscription);

router.get('/kpis', async (req, res) => {
  try {
    const kpis = await excelService.getKPIs(req.user.shop_id);
    res.json(kpis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const settings = await excelService.getSettings(req.user.shop_id);
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owner can update settings' });
    }
    const { key, value } = req.body;
    await excelService.updateSetting(req.user.shop_id, key, value);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
