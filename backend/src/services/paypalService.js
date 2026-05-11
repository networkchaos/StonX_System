const axios = require('axios');

const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const response = await axios.post(
    `${PAYPAL_BASE}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_CLIENT_SECRET,
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );
  return response.data.access_token;
}

/**
 * Creates a PayPal subscription plan (run once to setup)
 */
async function createPlan() {
  const token = await getAccessToken();

  const plan = {
    product_id: await createProduct(token),
    name: 'County Hardware Monthly',
    description: 'Monthly subscription for County Hardware inventory system',
    billing_cycles: [
      {
        frequency: { interval_unit: 'MONTH', interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // unlimited
        pricing_scheme: {
          fixed_price: { value: '30', currency_code: 'USD' },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: { value: '0', currency_code: 'USD' },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
  };

  const response = await axios.post(
    `${PAYPAL_BASE}/v1/billing/plans`,
    plan,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
}

async function createProduct(token) {
  const product = {
    name: 'County Hardware',
    description: 'Inventory and sales management for hardware shops',
    type: 'SERVICE',
    category: 'SOFTWARE',
  };
  const response = await axios.post(
    `${PAYPAL_BASE}/v1/catalogs/products`,
    product,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.id;
}

/**
 * Creates a subscription for a shop
 */
async function createSubscription(shopId, planId, returnUrl, cancelUrl) {
  const token = await getAccessToken();
  const activePlanId = planId || process.env.PAYPAL_PLAN_ID;

  const subscription = {
    plan_id: activePlanId,
    custom_id: shopId,
    application_context: {
      brand_name: 'County Hardware',
      user_action: 'SUBSCRIBE_NOW',
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };

  const response = await axios.post(
    `${PAYPAL_BASE}/v1/billing/subscriptions`,
    subscription,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return {
    subscription_id: response.data.id,
    status: response.data.status,
    approval_url: response.data.links.find(l => l.rel === 'approve')?.href,
  };
}

/**
 * Verifies a subscription is active
 */
async function getSubscriptionStatus(subscriptionId) {
  const token = await getAccessToken();
  const response = await axios.get(
    `${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return {
    id: response.data.id,
    status: response.data.status, // ACTIVE / SUSPENDED / CANCELLED
    start_time: response.data.start_time,
    billing_info: response.data.billing_info,
  };
}

async function cancelSubscription(subscriptionId, reason = 'Cancelled by user') {
  const token = await getAccessToken();
  await axios.post(
    `${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    { reason },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

module.exports = {
  createSubscription,
  getSubscriptionStatus,
  cancelSubscription,
  createPlan,
};
