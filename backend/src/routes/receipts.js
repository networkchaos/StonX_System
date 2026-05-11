// receipts.js
const express = require('express');
const router = express.Router();
const excelService = require('../services/excelService');
const { generateReceiptPDF } = require('../services/receiptService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/:receipt_number/pdf', async (req, res) => {
  try {
    const sales = await excelService.getSales(req.user.shop_id, { limit: 1000 });
    const sale = sales.find(s => s.receipt_number === req.params.receipt_number);
    if (!sale) return res.status(404).json({ error: 'Receipt not found' });

    const settings = await excelService.getSettings(req.user.shop_id);
    const pdfBuffer = await generateReceiptPDF(sale, settings);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${sale.receipt_number}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
