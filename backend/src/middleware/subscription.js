const paypalService = require('../services/paypalService');

/**
 * Checks if shop's subscription is valid (active or in trial).
 * Attach subscription info to req.subscription.
 */
async function checkSubscription(req, res, next) {
  const { subscription_id, trial_end, shop_id } = req.user;

  // Still in trial period
  if (trial_end && new Date() < new Date(trial_end)) {
    req.subscription = { status: 'trial', expires: trial_end };
    return next();
  }

  // No subscription set up yet (trial expired)
  if (!subscription_id) {
    return res.status(402).json({
      error: 'Subscription required',
      code: 'SUBSCRIPTION_REQUIRED',
      message: 'Your 30-day free trial has ended. Subscribe for KES 30/month to continue.',
    });
  }

  try {
    const status = await paypalService.getSubscriptionStatus(subscription_id);
    if (status.status === 'ACTIVE') {
      req.subscription = { status: 'active', paypal: status };
      return next();
    }
    return res.status(402).json({
      error: 'Subscription inactive',
      code: 'SUBSCRIPTION_INACTIVE',
      status: status.status,
    });
  } catch (err) {
    // If PayPal is unreachable, allow through (don't block shop operations)
    console.warn('PayPal check failed, allowing through:', err.message);
    req.subscription = { status: 'unknown' };
    next();
  }
}

module.exports = { checkSubscription };
