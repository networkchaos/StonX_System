# 🔨 County Hardware — Full Stack App

> **Inventory + Sales + Receipts + KPIs for hardware shops**
> React Native (Expo) + Node.js + Excel-as-Database (Supabase Storage) + PayPal Subscriptions

---

## 📁 Project Structure

```
county-hardware/
├── backend/               ← Node.js API server
│   ├── src/
│   │   ├── app.js         ← Entry point
│   │   ├── config/
│   │   │   └── supabase.js
│   │   ├── middleware/
│   │   │   ├── auth.js        ← JWT verification
│   │   │   └── subscription.js ← Trial/PayPal check
│   │   ├── routes/
│   │   │   ├── auth.js        ← Register, login, add-worker
│   │   │   ├── products.js    ← Full CRUD
│   │   │   ├── sales.js       ← Record & fetch sales
│   │   │   ├── receipts.js    ← PDF receipt download
│   │   │   ├── reports.js     ← KPIs & settings
│   │   │   └── users.js       ← Users + subscriptions
│   │   ├── services/
│   │   │   ├── excelService.js   ← All Excel read/write + sharding
│   │   │   ├── storageService.js ← Supabase file upload/download
│   │   │   ├── receiptService.js ← PDF generation (PDFKit)
│   │   │   └── paypalService.js  ← PayPal subscription management
│   │   └── utils/
│   │       └── excelTemplate.js  ← Creates new Excel DBs for shops
│   ├── package.json
│   └── .env.example
│
└── mobile/                ← React Native (Expo) app
    ├── App.js             ← Root entry
    ├── app.json           ← Expo config
    ├── babel.config.js
    ├── package.json
    └── src/
        ├── navigation/
        │   └── AppNavigator.js    ← Full navigation tree
        ├── screens/
        │   ├── auth/
        │   │   ├── LoginScreen.js
        │   │   ├── RegisterScreen.js
        │   │   └── ShopSetupScreen.js
        │   ├── dashboard/
        │   │   └── DashboardScreen.js  ← KPIs, charts, alerts
        │   ├── inventory/
        │   │   ├── InventoryScreen.js
        │   │   ├── ProductDetailScreen.js
        │   │   └── AddEditProductScreen.js
        │   ├── sales/
        │   │   ├── POSScreen.js         ← Point of Sale
        │   │   ├── CartScreen.js        ← Cart + checkout
        │   │   └── SalesHistoryScreen.js
        │   ├── receipts/
        │   │   └── ReceiptScreen.js     ← PDF + WhatsApp share
        │   ├── reports/
        │   │   └── ReportsScreen.js     ← Charts + analytics
        │   ├── settings/
        │   │   ├── SettingsScreen.js
        │   │   └── UsersScreen.js
        │   └── subscription/
        │       └── SubscriptionScreen.js  ← PayPal subscribe
        ├── store/
        │   ├── authStore.js       ← Zustand auth state
        │   ├── inventoryStore.js  ← Products state
        │   └── salesStore.js      ← Cart + sales state
        ├── services/
        │   └── api.js             ← Axios client + all API calls
        └── theme/
            └── index.js           ← Colors, typography, spacing
```

---

## 🛠️ STEP-BY-STEP SETUP GUIDE

---

### STEP 1 — Prerequisites

Install these on your machine:

```bash
# Node.js (v18+)
https://nodejs.org/

# Expo CLI
npm install -g expo-cli eas-cli

# For Android testing: Android Studio
https://developer.android.com/studio

# For iOS testing (Mac only): Xcode from App Store

# Expo Go app on your phone
# Android: https://play.google.com/store/apps/details?id=host.exp.exponent
# iOS: https://apps.apple.com/app/expo-go/id982107779
```

---

### STEP 2 — Supabase Setup (Cloud Excel Storage)

1. Go to **https://supabase.com** → Create free account
2. Create new project (e.g. "county-hardware")
3. Go to **Storage** → Create bucket named: `county-hardware-excels`
4. Set bucket to **Private**
5. Go to **Settings → API** → Copy:
   - `Project URL`
   - `anon/public key`
   - `service_role key`

---

### STEP 3 — PayPal Setup

1. Go to **https://developer.paypal.com**
2. Create App → get `Client ID` and `Secret`
3. Set mode to `sandbox` for testing, `live` for production
4. You'll create the billing plan via API (or use the admin endpoint below)

---

### STEP 4 — Backend Setup

```bash
cd county-hardware/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Now edit `.env` with your real values:

```env
PORT=3000
NODE_ENV=development

JWT_SECRET=your_super_secret_key_make_it_long_random_123456

# From Supabase dashboard
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...
SUPABASE_BUCKET=county-hardware-excels

# From PayPal developer dashboardw
PAYPAL_CLIENT_ID=AaBbCcDd...
PAYPAL_CLIENT_SECRET=EeFfGgHh...
PAYPAL_MODE=sandbox
PAYPAL_PLAN_ID=  ← leave blank for now, fill after Step 5

PAYPAL_EMAIL=Gruchathi@gmail.com
TRIAL_DAYS=30
SUBSCRIPTION_PRICE=30
SHARD_THRESHOLD=800
```

Start the backend:

```bash
npm run dev
```

You should see:
```
🔨 County Hardware API running on port 3000
📡 Environment: development
🌐 http://localhost:3000/health
```

Test it:
```bash
curl http://localhost:3000/health
# → {"status":"ok","app":"County Hardware API","version":"1.0.0"}
```

---

### STEP 5 — Create PayPal Billing Plan (one-time)

Once backend is running, call this to create the plan:

```bash
curl -X POST http://localhost:3000/api/subscription/setup-plan \
  -H "Content-Type: application/json"
```

Copy the returned `id` and add it to your `.env` as `PAYPAL_PLAN_ID`, then restart.

---

### STEP 6 — Deploy Backend (Railway — free tier)

1. Go to **https://railway.app** → Create account
2. New Project → Deploy from GitHub (push your backend folder)
3. Add all `.env` variables in Railway's Variables tab
4. Railway gives you a URL like: `https://county-hardware-api.railway.app`
5. Copy that URL

---

### STEP 7 — Mobile App Setup

```bash
cd county-hardware/mobile

# Install dependencies
npm install
```

Edit `src/services/api.js` — update this line:

```js
export const API_BASE_URL = 'https://your-backend.railway.app';
// ↑ Replace with your actual Railway URL
```

Start the app:

```bash
npx expo start
```

You'll see a QR code. Options:
- **Phone**: Scan QR code with Expo Go app
- **Android Emulator**: Press `a`
- **iOS Simulator** (Mac): Press `i`

---

### STEP 8 — Create Your First Shop

1. Open app → tap **"Create your shop"**
2. Fill in your name, email, password
3. Enter shop name: **County Hardware**
4. Tap **"Create My Shop 🔨"**
5. **SAVE THE SHOP ID** shown in the alert — workers need this!

---

### STEP 9 — Add Workers

As the owner:
1. Go to **Settings → Manage Team**
2. Share your **Shop ID** with workers
3. Workers install the app → tap "Login"
4. They enter **your Shop ID** + their email + password

To add a worker from the app (or via API):

```bash
curl -X POST https://your-backend.railway.app/api/auth/add-worker \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@shop.com","password":"pass123","role":"staff"}'
```

Roles available:
- `owner` — Full access
- `manager` — Everything except delete
- `staff` — Can sell, cannot edit prices or products

---

## 📱 App Features Guide

### Making a Sale
1. Tap **Sales** tab
2. Search or scroll to find product
3. Tap **+** to add to cart
4. Tap the orange cart bar at bottom
5. Select payment method (Cash / M-Pesa / Card / Credit)
6. If M-Pesa: enter transaction reference
7. Tap **"Complete Sale"**
8. Receipt appears → Download PDF / Share WhatsApp

### Editing Stock
1. Tap **Inventory** tab → find product
2. Tap product → tap the **stock number**
3. Choose: **IN** (restock), **OUT** (adjustment), **ADJUST**
4. Enter quantity + optional reason

### Editing Price
1. Tap any product → tap the **price**
2. Enter new price → **Update Price**

### Dashboard KPIs
- Pulls live from Excel
- Pull down to refresh
- Shows daily/weekly/monthly revenue
- Low stock alerts
- Top selling products

---

## 🔄 Excel Sharding (Auto Distribution)

When a shop has **800+ products**, the system automatically:

1. Creates a new Excel file: `shop_SHOPID_shard2.xlsx`
2. New products go to the newest shard
3. Reads merge all shards together
4. Shard count tracked in `settings` sheet

This keeps files fast and under cloud storage limits.

To change the threshold, update `.env`:
```env
SHARD_THRESHOLD=500   ← lower = more shards (faster per file)
SHARD_THRESHOLD=1500  ← higher = fewer shards (simpler)
```

---

## 💳 Subscription Flow

1. **30-day free trial** starts on registration
2. After trial, app shows "Subscribe" screen
3. User taps **Subscribe with PayPal**
4. PayPal opens in browser for $30/month
5. User completes payment → taps **Activate Subscription**
6. Enters PayPal subscription ID → backend verifies → shop unlocked

---

## 🚀 Building for Production (APK / Play Store)

### Android APK (for local install):
```bash
cd mobile
eas build --platform android --profile preview
```

### Google Play Store:
```bash
eas build --platform android --profile production
eas submit --platform android
```

### iOS App Store:
```bash
eas build --platform ios
eas submit --platform ios
```

You need an Expo account: https://expo.dev

---

## 🔧 Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| `SUPABASE_SERVICE_KEY` error | Use service_role key, not anon key |
| Excel download fails | Check Supabase bucket is named correctly |
| Login says "Shop not found" | Make sure Shop ID is correct (all caps) |
| Charts not showing | Pull to refresh dashboard |
| PayPal button fails | Check CLIENT_ID and mode (sandbox vs live) |
| Expo error on start | Run `npx expo install --fix` |

---

## 📊 Excel Schema Reference

Each shop gets these sheets in their Excel file:

| Sheet | Purpose |
|-------|---------|
| `products` | All products with price, qty, barcode |
| `sales` | Every completed sale with items JSON |
| `movements` | Stock IN/OUT/ADJUST history |
| `users` | Shop team members + hashed passwords |
| `suppliers` | Supplier contacts |
| `settings` | Shop config, subscription ID, shard count |
| `meta` | Schema version, shard info |

---

## 🛣️ Roadmap / What to Build Next

- [ ] Barcode scanning with phone camera (`expo-camera`)
- [ ] Push notifications for low stock
- [ ] Supplier purchase orders
- [ ] M-Pesa STK Push integration (Daraja API)
- [ ] Offline mode (cache + sync)
- [ ] Export sales report as Excel/PDF
- [ ] Multi-shop dashboard (franchise support)
- [ ] AI assistant ("What sold most this week?")

---

## 📞 Support

For setup help, contact the developer or open an issue.

**PayPal subscriptions go to:** Gruchathi@gmail.com

---

*Built with ❤️ for small hardware businesses in Kenya and across Africa*
