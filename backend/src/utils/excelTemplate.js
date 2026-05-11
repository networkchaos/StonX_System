const ExcelJS = require('exceljs');

/**
 * Creates a fresh County Hardware Excel database for a new shop.
 * Returns a Buffer that can be uploaded to cloud storage.
 */
async function createShopExcelTemplate(shopName) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'County Hardware';
  wb.created = new Date();

  // ── Sheet: products ──────────────────────────────────────────────────────
  const products = wb.addWorksheet('products');
  products.columns = [
    { header: 'id',           key: 'id',           width: 10 },
    { header: 'name',         key: 'name',         width: 30 },
    { header: 'category',     key: 'category',     width: 20 },
    { header: 'description',  key: 'description',  width: 40 },
    { header: 'price',        key: 'price',        width: 12 },
    { header: 'cost_price',   key: 'cost_price',   width: 12 },
    { header: 'quantity',     key: 'quantity',     width: 12 },
    { header: 'threshold',    key: 'threshold',    width: 12 },
    { header: 'barcode',      key: 'barcode',      width: 20 },
    { header: 'unit',         key: 'unit',         width: 10 },
    { header: 'supplier_id',  key: 'supplier_id',  width: 12 },
    { header: 'shard',        key: 'shard',        width: 8 },
    { header: 'created_at',   key: 'created_at',   width: 20 },
    { header: 'updated_at',   key: 'updated_at',   width: 20 },
  ];
  styleHeader(products);

  // ── Sheet: sales ─────────────────────────────────────────────────────────
  const sales = wb.addWorksheet('sales');
  sales.columns = [
    { header: 'id',             key: 'id',             width: 14 },
    { header: 'receipt_number', key: 'receipt_number', width: 18 },
    { header: 'items_json',     key: 'items_json',     width: 50 },
    { header: 'subtotal',       key: 'subtotal',       width: 14 },
    { header: 'discount',       key: 'discount',       width: 12 },
    { header: 'total',          key: 'total',          width: 14 },
    { header: 'payment_method', key: 'payment_method', width: 16 },
    { header: 'mpesa_ref',      key: 'mpesa_ref',      width: 18 },
    { header: 'cashier_id',     key: 'cashier_id',     width: 12 },
    { header: 'cashier_name',   key: 'cashier_name',   width: 20 },
    { header: 'customer_name',  key: 'customer_name',  width: 20 },
    { header: 'customer_phone', key: 'customer_phone', width: 16 },
    { header: 'date',           key: 'date',           width: 20 },
  ];
  styleHeader(sales);

  // ── Sheet: movements ─────────────────────────────────────────────────────
  const movements = wb.addWorksheet('movements');
  movements.columns = [
    { header: 'id',         key: 'id',         width: 14 },
    { header: 'product_id', key: 'product_id', width: 12 },
    { header: 'type',       key: 'type',       width: 10 }, // IN / OUT / ADJUST
    { header: 'qty',        key: 'qty',        width: 10 },
    { header: 'reason',     key: 'reason',     width: 30 },
    { header: 'user_id',    key: 'user_id',    width: 12 },
    { header: 'date',       key: 'date',       width: 20 },
  ];
  styleHeader(movements);

  // ── Sheet: users ─────────────────────────────────────────────────────────
  const users = wb.addWorksheet('users');
  users.columns = [
    { header: 'id',         key: 'id',         width: 12 },
    { header: 'name',       key: 'name',       width: 25 },
    { header: 'email',      key: 'email',      width: 30 },
    { header: 'password',   key: 'password',   width: 65 },
    { header: 'role',       key: 'role',       width: 12 }, // owner/manager/staff
    { header: 'active',     key: 'active',     width: 8 },
    { header: 'created_at', key: 'created_at', width: 20 },
  ];
  styleHeader(users);

  // ── Sheet: suppliers ─────────────────────────────────────────────────────
  const suppliers = wb.addWorksheet('suppliers');
  suppliers.columns = [
    { header: 'id',         key: 'id',         width: 12 },
    { header: 'name',       key: 'name',       width: 25 },
    { header: 'phone',      key: 'phone',      width: 16 },
    { header: 'email',      key: 'email',      width: 30 },
    { header: 'address',    key: 'address',    width: 40 },
    { header: 'created_at', key: 'created_at', width: 20 },
  ];
  styleHeader(suppliers);

  // ── Sheet: settings ───────────────────────────────────────────────────────
  const settings = wb.addWorksheet('settings');
  settings.columns = [
    { header: 'key',   key: 'key',   width: 25 },
    { header: 'value', key: 'value', width: 50 },
  ];
  styleHeader(settings);

  // Default settings
  settings.addRows([
    { key: 'shop_name',          value: shopName },
    { key: 'currency',           value: 'KES' },
    { key: 'receipt_footer',     value: 'Thank you for shopping at ' + shopName },
    { key: 'low_stock_enabled',  value: 'true' },
    { key: 'shard_count',        value: '1' },
    { key: 'created_at',         value: new Date().toISOString() },
  ]);

  // ── Sheet: meta ───────────────────────────────────────────────────────────
  const meta = wb.addWorksheet('meta');
  meta.columns = [
    { header: 'key',   key: 'key',   width: 25 },
    { header: 'value', key: 'value', width: 50 },
  ];
  meta.addRows([
    { key: 'schema_version', value: '1.0' },
    { key: 'shard_index',    value: '1' },
    { key: 'is_shard',       value: 'false' },
    { key: 'parent_file',    value: '' },
  ]);

  const buffer = await wb.xlsx.writeBuffer();
  return buffer;
}

function styleHeader(worksheet) {
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A1A2E' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFF97316' } },
    };
  });
  worksheet.getRow(1).height = 22;
}

module.exports = { createShopExcelTemplate };
