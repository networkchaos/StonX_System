import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../theme';
import { subscriptionAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

const FEATURES = [
  { icon: 'cube-outline',        text: 'Unlimited products & categories' },
  { icon: 'cart-outline',        text: 'Full POS & sales system' },
  { icon: 'receipt-outline',     text: 'PDF receipts (download & share)' },
  { icon: 'bar-chart-outline',   text: 'Advanced KPI dashboard & charts' },
  { icon: 'people-outline',      text: 'Multi-user with role control' },
  { icon: 'barcode-outline',     text: 'Barcode scanning' },
  { icon: 'cloud-outline',       text: 'Cloud Excel sync across devices' },
  { icon: 'notifications-outline', text: 'Low stock alerts' },
  { icon: 'trending-up-outline', text: 'Auto distributed Excel sharding' },
  { icon: 'shield-checkmark-outline', text: '30-day free trial included' },
];

export default function SubscriptionScreen({ navigation }) {
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [subbing, setSubbing] = useState(false);
  const { shop, trialDaysLeft, updateShop } = useAuthStore();

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    try {
      const res = await subscriptionAPI.status();
      setStatus(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  const handleSubscribe = async () => {
    setSubbing(true);
    try {
      const res = await subscriptionAPI.create({
        return_url: 'countyhardware://subscription/success',
        cancel_url: 'countyhardware://subscription/cancel',
      });
      if (res.data.approval_url) {
        await Linking.openURL(res.data.approval_url);
        // After returning, user must activate
        Alert.alert(
          'Subscription Started',
          'Complete payment in your browser, then tap "Activate Subscription".',
          [{
            text: 'Activate Subscription',
            onPress: () => promptActivate(res.data.subscription_id),
          }]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || err.message);
    } finally { setSubbing(false); }
  };

  const promptActivate = (prefilledId) => {
    Alert.prompt(
      'Enter Subscription ID',
      'Paste your PayPal subscription ID to activate:',
      async (id) => {
        if (!id) return;
        try {
          await subscriptionAPI.activate(id);
          updateShop({ subscription_id: id });
          Alert.alert('🎉 Activated!', 'Your subscription is now active.');
          fetchStatus();
        } catch (err) {
          Alert.alert('Activation Failed', err.response?.data?.error || err.message);
        }
      },
      'plain-text',
      prefilledId || '',
    );
  };

  const daysLeft = trialDaysLeft();
  const isActive = status?.status === 'ACTIVE' || status?.status === 'active';
  const isTrial  = status?.status === 'trial';

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Status Banner */}
        {isActive ? (
          <View style={styles.activeBanner}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeBannerTitle}>Subscription Active</Text>
              <Text style={styles.activeBannerSub}>Your shop is fully covered</Text>
            </View>
          </View>
        ) : isTrial ? (
          <View style={[styles.activeBanner, { borderColor: COLORS.warning + '44', backgroundColor: COLORS.warningBg }]}>
            <Ionicons name="time-outline" size={24} color={COLORS.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.activeBannerTitle, { color: COLORS.warning }]}>
                Free Trial — {daysLeft} days left
              </Text>
              <Text style={styles.activeBannerSub}>Subscribe to continue after trial</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.activeBanner, { borderColor: COLORS.danger + '44', backgroundColor: COLORS.dangerBg }]}>
            <Ionicons name="close-circle-outline" size={24} color={COLORS.danger} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.activeBannerTitle, { color: COLORS.danger }]}>Trial Expired</Text>
              <Text style={styles.activeBannerSub}>Subscribe to restore access</Text>
            </View>
          </View>
        )}

        {/* Price Card */}
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>COUNTY HARDWARE PRO</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>$30</Text>
            <Text style={styles.pricePer}>/month</Text>
          </View>
          <Text style={styles.priceSub}>≈ KES 3,900/month · Billed via PayPal</Text>
          <Text style={styles.paypalEmail}>PayPal: Gruchathi@gmail.com</Text>
        </View>

        {/* Features */}
        <Text style={styles.sectionLabel}>WHAT'S INCLUDED</Text>
        <View style={styles.featureCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureRowBorder]}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        {!isActive && (
          <TouchableOpacity
            style={[styles.subscribeBtn, subbing && { opacity: 0.7 }]}
            onPress={handleSubscribe}
            disabled={subbing}
          >
            {subbing
              ? <ActivityIndicator color={COLORS.white} />
              : (
                <>
                  <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.white} />
                  <Text style={styles.subscribeBtnText}>Subscribe with PayPal</Text>
                </>
              )
            }
          </TouchableOpacity>
        )}

        {!isActive && (
          <TouchableOpacity
            style={styles.activateBtn}
            onPress={() => promptActivate('')}
          >
            <Text style={styles.activateBtnText}>Already paid? Activate manually</Text>
          </TouchableOpacity>
        )}

        {/* Trial reminder */}
        {isTrial && (
          <Text style={styles.trialReminder}>
            Your 30-day free trial includes all features. No payment needed during trial.
          </Text>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.base },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.successBg, borderRadius: RADIUS.lg, padding: SPACING.base,
    borderWidth: 1, borderColor: COLORS.success + '44', marginBottom: SPACING.md,
  },
  activeBannerTitle: { fontSize: 15, fontWeight: '800', color: COLORS.success },
  activeBannerSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  priceCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1.5, borderColor: COLORS.primary + '44', alignItems: 'center', marginBottom: SPACING.md,
  },
  priceLabel: { fontSize: 11, fontWeight: '800', color: COLORS.primary, letterSpacing: 1.5, marginBottom: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4 },
  price: { fontSize: 56, fontWeight: '900', color: COLORS.textPrimary, lineHeight: 60 },
  pricePer: { fontSize: 18, color: COLORS.textMuted, fontWeight: '600', marginTop: 16 },
  priceSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 8 },
  paypalEmail: { fontSize: 12, color: COLORS.info, marginTop: 4, fontWeight: '600' },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1.4, marginBottom: 8 },
  featureCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  featureRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  featureIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.primary + '22', alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  subscribeBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10,
  },
  subscribeBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  activateBtn: { alignItems: 'center', paddingVertical: 12 },
  activateBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  trialReminder: { textAlign: 'center', fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginTop: 8 },
});
