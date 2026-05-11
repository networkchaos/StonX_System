const ExcelJS = require('exceljs');
const { v4: uuidv4 } = require('uuid');
const storageService = require('./storageService');

const SHARD_THRESHOLD = parseInt(process.env.SHARD_THRESHOLD) || 800;

/**
 * Downloads a shop's Excel file from cloud, returns workbook
 */
async function getWorkbook(shopId, shardIndex = 1) {
  const fileName = shardIndex === 1
    ? `shop_${shopId}.xlsx`
    : `shop_${shopId}_shard${shardIndex}.xlsx`;

  const buffer = await storageService.downloadFile(fileName);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  return wb;
}

/**
 * Saves workbook back to cloud
 */
async function saveWorkbook(wb, shopId, shardIndex = 1) {
  const fileName = shardIndex === 1
    ? `shop_${shopId}.xlsx`
    : `shop_${shopId}_shard${shardIndex}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  await storageService.uploadFile(fileName, buffer);
}

/**
 * Parse a worksheet into array of plain objects
 */
function sheetToJson(worksheet) {
  const headers = [];
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value;
  });

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      obj[headers[colNumber]] = cell.value;
    });
    if (obj[headers[1]]) rows.push(obj);
  });
  return rows;
}

// ═══════════════════════════════════════════════════════════════════════════
//  PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════

async function getProducts(shopId) {
  const wb = await getWorkbook(shopId);
  const sheet = wb.getWorksheet('products');
  const products = sheetToJson(sheet);

  // Also check shards
  const settingsSheet = wb.getWorksheet('settings');
  const settings = sheetToJson(settingsSheet);
  const shardCountRow = settings.find(s => s.key === 'shard_count');
  const shardCount = shardCountRow ? parseInt(shardCountRow.value) : 1;

  if (shardCount > 1) {
    for (let i = 2; i <= shardCount; i++) {
      const shardWb = await getWorkbook(shopId, i);
      const shardSheet = shardWb.getWorksheet('products');
      const shardProducts = sheetToJson(shardSheet);
      products.push(...shardProducts);
    }
  }

  return products;
}

async function getProductById(shopId, productId) {
  const products = await getProducts(shopId);
  return products.find(p => String(p.id) === String(productId)) || null;
}

async function addProduct(shopId, productData) {
  const wb = await getWorkbook(shopId);
  const sheet = wb.getWorksheet('products');
  const existing = sheetToJson(sheet);

  // Check if shard needed
  let targetWb = wb;
  let targetSheet = sheet;
  let shardIndex = 1;

  if (existing.length >= SHARD_THRESHOLD) {
    const result = await getOrCreateShard(shopId, wb);
    targetWb = result.wb;
    targetSheet = result.sheet;
    shardIndex = result.shardIndex;
  }

  const newProduct = {
    id: uuidv4(),
    name: productData.name,
    category: productData.category || '',
    description: productData.description || '',
    price: parseFloat(productData.price) || 0,
    cost_price: parseFloat(productData.cost_price) || 0,
    quantity: parseInt(productData.quantity) || 0,
    threshold: parseInt(productData.threshold) || 5,
    barcode: productData.barcode || '',
    unit: productData.unit || 'pcs',
    supplier_id: productData.supplier_id || '',
    shard: shardIndex,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  targetSheet.addRow(newProduct);
  await saveWorkbook(targetWb, shopId, shardIndex);
  if (shardIndex > 1) await saveWorkbook(wb, shopId, 1); // save updated shard count

  return newProduct;
}

async function updateProduct(shopId, productId, updates) {
  const wb = await getWorkbook(shopId);
  const sheet = wb.getWorksheet('products');
  const headers = getHeaders(sheet);

  let found = false;
  let shardIndex = 1;

  sheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) return;
    const idCell = row.getCell(headers.indexOf('id') + 1);
    if (String(idCell.value) === String(productId)) {
      Object.keys(updates).forEach(key => {
        const colIndex = headers.indexOf(key) + 1;
        if (colIndex > 0) row.getCell(colIndex).value = updates[key];
      });
      const shardCol = headers.indexOf('shard') + 1;
      shardIndex = row.getCell(shardCol).value || 1;
      const updatedCol = headers.indexOf('updated_at') + 1;
      row.getCell(updatedCol).value = new Date().toISOString();
      found = true;
    }
  });

  if (!found) {
    // Try shards
    const shardCount = await getShardCount(wb);
    for (let i = 2; i <= shardCount; i++) {
      const shardWb = await getWorkbook(shopId, i);
      const shardSheet = shardWb.getWorksheet('products');
      const shardHeaders = getHeaders(shardSheet);
      shardSheet.eachRow((row, rowIndex) => {
        if (rowIndex === 1) return;
        const idCell = row.getCell(shardHeaders.indexOf('id') + 1);
        if (String(idCell.value) === String(productId)) {
          Object.keys(updates).forEach(key => {
            const colIndex = shardHeaders.indexOf(key) + 1;
            if (colIndex > 0) row.getCell(colIndex).value = updates[key];
          });
          const updatedCol = shardHeaders.indexOf('updated_at') + 1;
          row.getCell(updatedCol).value = new Date().toISOString();
          found = true;
          shardIndex = i;
        }
      });
      if (found) {
        await saveWorkbook(shardWb, shopId, i);
        return await getProductById(shopId, productId);
      }
    }
  }

  if (!found) throw new Error('Product not found');
  await saveWorkbook(wb, shopId, 1);
  return await getProductById(shopId, productId);
}

async function deleteProduct(shopId, productId) {
  const wb = await getWorkbook(shopId);
  const sheet = wb.getWorksheet('products');
  const headers = getHeaders(sheet);

  let rowToDelete = null;
  sheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) return;
    const idCell = row.getCell(headers.indexOf('id') + 1);
    if (String(idCell.value) === String(productId)) {
      rowToDelete = rowIndex;
    }
  });

  if (rowToDelete) {
    sheet.spliceRows(rowToDelete, 1);
    await saveWorkbook(wb, shopId, 1);
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
//  SALES
// ═══════════════════════════════════════════════════════════════════════════

async function recordSale(shopId, saleData) {
  const wb = await getWorkbook(shopId);
  const salesSheet = wb.getWorksheet('sales');
  const movementsSheet = wb.getWorksheet('movements');

  const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
  const saleId = uuidv4();

  const sale = {
    id: saleId,
    receipt_number: receiptNumber,
    items_json: JSON.stringify(saleData.items),
    subtotal: saleData.subtotal,
    discount: saleData.discount || 0,
    total: saleData.total,
    payment_method: saleData.payment_method,
    mpesa_ref: saleData.mpesa_ref || '',
    cashier_id: saleData.cashier_id,
    cashier_name: saleData.cashier_name,
    customer_name: saleData.customer_name || '',
    customer_phone: saleData.customer_phone || '',
    date: new Date().toISOString(),
  };

  salesSheet.addRow(sale);

  // Update stock quantities + log movements
  for (const item of saleData.items) {
    await _updateStockInWb(wb, shopId, item.product_id, -item.qty);
    movementsSheet.addRow({
      id: uuidv4(),
      product_id: item.product_id,
      type: 'OUT',
      qty: item.qty,
      reason: `Sale ${receiptNumber}`,
      user_id: saleData.cashier_id,
      date: new Date().toISOString(),
    });
  }

  await saveWorkbook(wb, shopId, 1);
  return { ...sale, items: saleData.items };
}

async function getSales(shopId, { startDate, endDate, limit = 50 } = {}) {
  const wb = await getWorkbook(shopId);
  const sheet = wb.getWorksheet('sales');
  let sales = sheetToJson(sheet);

  if (startDate) sales = sales.filter(s => new Date(s.date) >= new Date(startDate));
  if (endDate) sales = sales.filter(s => new Date(s.date) <= new Date(endDate));

  sales.sort((a, b) => new Date(b.date) - new Date(a.date));
  return sales.slice(0, limit).map(s => ({
    ...s,
    items: JSON.parse(s.items_json || '[]'),
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
//  STOCK MOVEMENTS
// ═══════════════════════════════════════════════════════════════════════════

async function addStockMovement(shopId, movement) {
  const wb = await getWorkbook(shopId);
  const movementsSheet = wb.getWorksheet('movements');

  const record = {
    id: uuidv4(),
    product_id: movement.product_id,
    type: movement.type, // IN / OUT / ADJUST
    qty: parseInt(movement.qty),
    reason: movement.reason || '',
    user_id: movement.user_id,
    date: new Date().toISOString(),
  };

  movementsSheet.addRow(record);

  // Update product quantity
  const delta = movement.type === 'IN' ? record.qty
    : movement.type === 'OUT' ? -record.qty
    : record.qty; // ADJUST is absolute delta

  await _updateStockInWb(wb, shopId, movement.product_id, delta);
  await saveWorkbook(wb, shopId, 1);
  return record;
}

// ═══════════════════════════════════════════════════════════════════════════
//  USERS
// ═══════════════════════════════════════════════════════════════════════════

async function getUsers(shopId) {
  const wb = await getWorkbook(shopId);
  const sheet = wb.getWorksheet('users');
  return sheetToJson(sheet).map(u => ({ ...u, password: undefined }));
}

async function getUserByEmail(shopId, email) {
  const wb = await getWorkbook(shopId);
  const sheet = wb.getWorksheet('users');
  const users = sheetToJson(sheet);
  return users.find(u => u.email === email) || null;
}

async function addUser(shopId, userData) {
  const wb = await getWorkbook(shopId);
  const sheet = wb.getWorksheet('users');

  const user = {
    id: uuidv4(),
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: userData.role || 'staff',
    active: true,
    created_at: new Date().toISOString(),
  };

  sheet.addRow(user);
  await saveWorkbook(wb, shopId, 1);
  return { ...user, password: undefined };
}

async function updateUser(shopId, userId, updates) {
  const wb = await getWorkbook(shopId);
  const sheet = wb.getWorksheet('users');
  const headers = getHeaders(sheet);

  sheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) return;
    const idCell = row.getCell(headers.indexOf('id') + 1);
    if (String(idCell.value) === String(userId)) {
      Object.keys(updates).forEach(key => {
        const colIndex = headers.indexOf(key) + 1;
        if (colIndex > 0) row.getCell(colIndex).value = updates[key];
      });
    }
  });

  await saveWorkbook(wb, shopId, 1);
}

// ═══════════════════════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

async function getSettings(shopId) {
  const wb = await getWorkbook(shopId);
  const sheet = wb.getWorksheet('settings');
  const rows = sheetToJson(sheet);
  return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
}

async function updateSetting(shopId, key, value) {
  const wb = await getWorkbook(shopId);
  const sheet = wb.getWorksheet('settings');
  const headers = getHeaders(sheet);
  let found = false;

  sheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) return;
    if (row.getCell(1).value === key) {
      row.getCell(2).value = value;
      found = true;
    }
  });

  if (!found) sheet.addRow({ key, value });
  await saveWorkbook(wb, shopId, 1);
}

// ═══════════════════════════════════════════════════════════════════════════
//  REPORTS / KPIs
// ═══════════════════════════════════════════════════════════════════════════

async function getKPIs(shopId) {
  const wb = await getWorkbook(shopId);
  const productsSheet = wb.getWorksheet('products');
  const salesSheet = wb.getWorksheet('sales');

  const products = sheetToJson(productsSheet);
  const sales = sheetToJson(salesSheet).map(s => ({
    ...s,
    items: JSON.parse(s.items_json || '[]'),
  }));

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const weekAgo = new Date(today - 7 * 86400000);
  const monthAgo = new Date(today - 30 * 86400000);

  const todaySales = sales.filter(s => s.date && s.date.startsWith(todayStr));
  const weekSales = sales.filter(s => s.date && new Date(s.date) >= weekAgo);
  const monthSales = sales.filter(s => s.date && new Date(s.date) >= monthAgo);

  const totalRevToday = todaySales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
  const totalRevWeek = weekSales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
  const totalRevMonth = monthSales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);

  const totalProducts = products.length;
  const outOfStock = products.filter(p => parseInt(p.quantity) === 0);
  const lowStock = products.filter(p => {
    const qty = parseInt(p.quantity) || 0;
    const threshold = parseInt(p.threshold) || 5;
    return qty > 0 && qty <= threshold;
  });
  const totalStockValue = products.reduce(
    (sum, p) => sum + (parseFloat(p.price) || 0) * (parseInt(p.quantity) || 0), 0
  );

  // Top products by sales qty
  const productSalesMap = {};
  monthSales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSalesMap[item.product_id]) {
        productSalesMap[item.product_id] = { name: item.name, qty: 0, revenue: 0 };
      }
      productSalesMap[item.product_id].qty += item.qty;
      productSalesMap[item.product_id].revenue += item.price * item.qty;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Daily sales for chart (last 7 days)
  const dailySales = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today - i * 86400000);
    const dayStr = d.toISOString().split('T')[0];
    const daySales = sales.filter(s => s.date && s.date.startsWith(dayStr));
    dailySales.push({
      date: dayStr,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: daySales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0),
      count: daySales.length,
    });
  }

  return {
    revenue: { today: totalRevToday, week: totalRevWeek, month: totalRevMonth },
    inventory: {
      total: totalProducts,
      out_of_stock: outOfStock.length,
      low_stock: lowStock.length,
      stock_value: totalStockValue,
    },
    sales: {
      today_count: todaySales.length,
      week_count: weekSales.length,
      month_count: monthSales.length,
    },
    top_products: topProducts,
    daily_chart: dailySales,
    alerts: {
      out_of_stock: outOfStock.slice(0, 10).map(p => ({ id: p.id, name: p.name })),
      low_stock: lowStock.slice(0, 10).map(p => ({
        id: p.id, name: p.name, qty: p.quantity, threshold: p.threshold,
      })),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  PRIVATE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getHeaders(worksheet) {
  const headers = [];
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber - 1] = cell.value;
  });
  return headers;
}

async function _updateStockInWb(wb, shopId, productId, delta) {
  const sheet = wb.getWorksheet('products');
  const headers = getHeaders(sheet);
  let found = false;

  sheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1 || found) return;
    const idCell = row.getCell(headers.indexOf('id') + 1);
    if (String(idCell.value) === String(productId)) {
      const qtyCol = headers.indexOf('quantity') + 1;
      const current = parseInt(row.getCell(qtyCol).value) || 0;
      row.getCell(qtyCol).value = Math.max(0, current + delta);
      found = true;
    }
  });
}

async function getShardCount(wb) {
  const sheet = wb.getWorksheet('settings');
  const rows = sheetToJson(sheet);
  const row = rows.find(r => r.key === 'shard_count');
  return row ? parseInt(row.value) : 1;
}

async function getOrCreateShard(shopId, mainWb) {
  const shardCount = await getShardCount(mainWb);
  const newShardIndex = shardCount + 1;

  // Try current last shard
  try {
    const lastShardWb = await getWorkbook(shopId, shardCount);
    const lastShardSheet = lastShardWb.getWorksheet('products');
    const existingRows = sheetToJson(lastShardSheet);
    if (existingRows.length < SHARD_THRESHOLD) {
      return { wb: lastShardWb, sheet: lastShardSheet, shardIndex: shardCount };
    }
  } catch {}

  // Create new shard
  const { createShopExcelTemplate } = require('../utils/excelTemplate');
  const buffer = await createShopExcelTemplate(shopId + '_shard' + newShardIndex);
  await storageService.uploadFile(`shop_${shopId}_shard${newShardIndex}.xlsx`, buffer);

  const newShardWb = new ExcelJS.Workbook();
  await newShardWb.xlsx.load(buffer);
  const newShardSheet = newShardWb.getWorksheet('products');

  // Update shard count in main
  const settingsSheet = mainWb.getWorksheet('settings');
  const headers = getHeaders(settingsSheet);
  settingsSheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) return;
    if (row.getCell(1).value === 'shard_count') {
      row.getCell(2).value = String(newShardIndex);
    }
  });

  return { wb: newShardWb, sheet: newShardSheet, shardIndex: newShardIndex };
}

module.exports = {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  recordSale,
  getSales,
  addStockMovement,
  getUsers,
  getUserByEmail,
  addUser,
  updateUser,
  getSettings,
  updateSetting,
  getKPIs,
};
