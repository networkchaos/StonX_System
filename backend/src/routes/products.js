const express = require('express');
const router = express.Router();
const excelService = require('../services/excelService');
const { authMiddleware } = require('../middleware/auth');
const { checkSubscription } = require('../middleware/subscription');

router.use(authMiddleware, checkSubscription);

// GET all products (with optional search)
router.get('/', async (req, res) => {
  try {
    const { search, category, low_stock, out_of_stock } = req.query;
    let products = await excelService.getProducts(req.user.shop_id);

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    if (category) {
      products = products.filter(p =>
        p.category && p.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (out_of_stock === 'true') {
      products = products.filter(p => parseInt(p.quantity) === 0);
    } else if (low_stock === 'true') {
      products = products.filter(p => {
        const qty = parseInt(p.quantity) || 0;
        return qty > 0 && qty <= (parseInt(p.threshold) || 5);
      });
    }

    res.json({ products, total: products.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const product = await excelService.getProductById(req.user.shop_id, req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET by barcode
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const products = await excelService.getProducts(req.user.shop_id);
    const product = products.find(p => p.barcode === req.params.barcode);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create product
router.post('/', async (req, res) => {
  try {
    if (req.user.role === 'staff') {
      return res.status(403).json({ error: 'Staff cannot add products' });
    }
    const product = await excelService.addProduct(req.user.shop_id, req.body);
    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update product
router.put('/:id', async (req, res) => {
  try {
    const product = await excelService.updateProduct(
      req.user.shop_id, req.params.id, req.body
    );
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update price only
router.patch('/:id/price', async (req, res) => {
  try {
    const { price } = req.body;
    if (price === undefined) return res.status(400).json({ error: 'price required' });
    const product = await excelService.updateProduct(
      req.user.shop_id, req.params.id, { price: parseFloat(price) }
    );
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update stock quantity
router.patch('/:id/stock', async (req, res) => {
  try {
    const { quantity, type, reason } = req.body;
    const movement = await excelService.addStockMovement(req.user.shop_id, {
      product_id: req.params.id,
      type: type || 'ADJUST',
      qty: parseInt(quantity),
      reason: reason || 'Manual adjustment',
      user_id: req.user.user_id,
    });
    const product = await excelService.getProductById(req.user.shop_id, req.params.id);
    res.json({ product, movement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Only owner can delete products' });
    }
    await excelService.deleteProduct(req.user.shop_id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET categories
router.get('/meta/categories', async (req, res) => {
  try {
    const products = await excelService.getProducts(req.user.shop_id);
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    res.json({ categories: cats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
