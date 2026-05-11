const PDFDocument = require('pdfkit');

/**
 * Generates a PDF receipt buffer for a completed sale
 */
function generateReceiptPDF(sale, shopSettings) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [226, 600], margin: 10 });
    const buffers = [];

    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const shopName = shopSettings.shop_name || 'County Hardware';
    const currency = shopSettings.currency || 'KES';
    const footer = shopSettings.receipt_footer || `Thank you for shopping at ${shopName}`;

    const W = 206; // usable width

    // ─── Header ───────────────────────────────────────────────────────────
    doc.fontSize(14).font('Helvetica-Bold')
       .text(shopName, { align: 'center', width: W });

    doc.fontSize(7).font('Helvetica')
       .text('OFFICIAL RECEIPT', { align: 'center', width: W });

    doc.moveDown(0.3);
    dashedLine(doc, W);

    // ─── Receipt Info ─────────────────────────────────────────────────────
    doc.fontSize(7).font('Helvetica');
    row(doc, 'Receipt No:', sale.receipt_number, W);
    row(doc, 'Date:', new Date(sale.date).toLocaleString(), W);
    row(doc, 'Cashier:', sale.cashier_name, W);
    if (sale.customer_name) row(doc, 'Customer:', sale.customer_name, W);

    dashedLine(doc, W);

    // ─── Items ────────────────────────────────────────────────────────────
    doc.fontSize(7).font('Helvetica-Bold');
    doc.text('ITEM', { continued: true, width: 100 });
    doc.text('QTY', { continued: true, width: 30, align: 'right' });
    doc.text('PRICE', { continued: true, width: 40, align: 'right' });
    doc.text('TOTAL', { width: 36, align: 'right' });

    doc.font('Helvetica');
    const items = Array.isArray(sale.items)
      ? sale.items
      : JSON.parse(sale.items_json || '[]');

    items.forEach(item => {
      const lineTotal = (item.price * item.qty).toFixed(2);
      doc.text(item.name.substring(0, 18), { continued: true, width: 100 });
      doc.text(String(item.qty), { continued: true, width: 30, align: 'right' });
      doc.text(item.price.toFixed(2), { continued: true, width: 40, align: 'right' });
      doc.text(lineTotal, { width: 36, align: 'right' });
    });

    dashedLine(doc, W);

    // ─── Totals ───────────────────────────────────────────────────────────
    doc.font('Helvetica');
    row(doc, 'Subtotal:', `${currency} ${parseFloat(sale.subtotal).toFixed(2)}`, W);
    if (sale.discount > 0) {
      row(doc, 'Discount:', `-${currency} ${parseFloat(sale.discount).toFixed(2)}`, W);
    }
    doc.font('Helvetica-Bold').fontSize(9);
    row(doc, 'TOTAL:', `${currency} ${parseFloat(sale.total).toFixed(2)}`, W);
    doc.font('Helvetica').fontSize(7);
    row(doc, 'Payment:', sale.payment_method, W);
    if (sale.mpesa_ref) row(doc, 'M-Pesa Ref:', sale.mpesa_ref, W);

    dashedLine(doc, W);

    // ─── Footer ───────────────────────────────────────────────────────────
    doc.moveDown(0.5);
    doc.fontSize(7).font('Helvetica')
       .text(footer, { align: 'center', width: W });

    doc.moveDown(0.3);
    doc.fontSize(6).fillColor('#888888')
       .text('Powered by County Hardware App', { align: 'center', width: W });

    doc.end();
  });
}

function dashedLine(doc, W) {
  doc.moveDown(0.3)
     .fontSize(7)
     .text('- '.repeat(Math.floor(W / 7)), { width: W })
     .moveDown(0.1);
}

function row(doc, label, value, W) {
  doc.fontSize(7);
  const labelW = 75;
  const valueW = W - labelW;
  doc.text(label, { continued: true, width: labelW });
  doc.text(String(value || ''), { width: valueW, align: 'right' });
}

module.exports = { generateReceiptPDF };
