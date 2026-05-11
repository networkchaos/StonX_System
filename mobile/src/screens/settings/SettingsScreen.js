// ── Settings Screen ───────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../theme';
import useAuthStore from '../../store/authStore';

export default function SettingsScreen({ navigation }) {
  const { user, shop, logout, isOwner, trialDaysLeft } = useAuthStore();
  const daysLeft = trialDaysLeft();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const SettingsRow = ({ icon, label, subtitle, onPress, color, right }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.settingIcon, { backgroundColor: (color || COLORS.primary) + '22' }]}>
        <Ionicons name={icon} size={20} color={color || COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {right || <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileRole}>{user?.role?.toUpperCase()} · {shop?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Shop Info */}
        <View style={styles.shopInfoCard}>
          <View style={styles.shopInfoRow}>
            <Text style={styles.shopInfoLabel}>Shop ID</Text>
            <Text style={styles.shopInfoValue} selectable>{shop?.id}</Text>
          </View>
          <View style={styles.shopInfoRow}>
            <Text style={styles.shopInfoLabel}>Share this ID with workers to join your shop</Text>
          </View>
        </View>

        {/* Subscription Status */}
        <TouchableOpacity
          style={[styles.subCard, { borderColor: daysLeft > 0 ? COLORS.warning + '44' : COLORS.danger + '44' }]}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Ionicons name={daysLeft > 0 ? 'time-outline' : 'shield-checkmark-outline'} size={22} color={daysLeft > 0 ? COLORS.warning : COLORS.success} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.subCardTitle}>
              {shop?.subscription_id ? 'Subscription Active' : `Free Trial · ${daysLeft} days left`}
            </Text>
            <Text style={styles.subCardSub}>
              {shop?.subscription_id ? 'Manage your plan' : 'Subscribe for $30/month after trial'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>MANAGEMENT</Text>
        <View style={styles.sectionCard}>
          {isOwner() && (
            <SettingsRow icon="people-outline" label="Manage Team" subtitle="Add workers, set roles" onPress={() => navigation.navigate('Users')} />
          )}
          <SettingsRow icon="storefront-outline" label="Shop Settings" subtitle="Name, currency, receipt footer" onPress={() => {}} />
          <SettingsRow icon="notifications-outline" label="Stock Alerts" subtitle="Low stock thresholds" onPress={() => {}} />
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.sectionCard}>
          <SettingsRow icon="shield-outline" label="Change Password" onPress={() => {}} />
          <SettingsRow icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
          <SettingsRow icon="document-text-outline" label="Terms & Privacy" onPress={() => {}} />
          <SettingsRow icon="information-circle-outline" label="App Version" subtitle="County Hardware v1.0.0" onPress={() => {}}
            right={<Text style={{ color: COLORS.textMuted, fontSize: 13 }}>1.0.0</Text>} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.base, paddingBottom: 40 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: SPACING.base, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '800', color: COLORS.white },
  profileName: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  profileRole: { fontSize: 11, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
  profileEmail: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  shopInfoCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  shopInfoRow: { marginBottom: 6 },
  shopInfoLabel: { fontSize: 11, color: COLORS.textMuted },
  shopInfoValue: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginTop: 2 },
  subCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, marginBottom: SPACING.md },
  subCardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  subCardSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2, marginTop: 8, marginBottom: 8 },
  sectionCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  settingSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.dangerBg, borderRadius: RADIUS.lg, height: 52, borderWidth: 1, borderColor: COLORS.danger + '44' },
  logoutText: { color: COLORS.danger, fontWeight: '800', fontSize: 15 },
});
