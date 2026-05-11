const express = require('express');
const router = express.Router();
const excelService = require('../services/excelService');
const { authMiddleware } = require('../middleware/auth');
const { checkSubscription } = require('../middleware/subscription');

router.use(authMiddleware, checkSubscription);

// POST create a sale
router.post('/', async (req, res) => {
  try {
    const { items, payment_method, mpesa_ref, customer_name, customer_phone, discount = 0 } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'items required' });
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const total = subtotal - parseFloat(discount || 0);

    const sale = await excelService.recordSale(req.user.shop_id, {
      items,
      subtotal,
      discount: parseFloat(discount || 0),
      total,
      payment_method: payment_method || 'cash',
      mpesa_ref,
      cashier_id: req.user.user_id,
      cashier_name: req.user.name,
      customer_name,
      customer_phone,
    });

    res.status(201).json({ sale });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET sales list
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, limit } = req.query;
    const sales = await excelService.getSales(req.user.shop_id, {
      startDate: start_date,
      endDate: end_date,
      limit: parseInt(limit) || 50,
    });
    res.json({ sales, total: sales.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
