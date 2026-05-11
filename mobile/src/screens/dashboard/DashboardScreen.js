import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis } from 'victory-native';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../theme';
import useAuthStore from '../../store/authStore';
import { reportsAPI } from '../../services/api';

export default function DashboardScreen({ navigation }) {
  const [kpis, setKpis]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, shop, trialDaysLeft } = useAuthStore();

  const fetchKPIs = useCallback(async () => {
    try {
      const res = await reportsAPI.kpis();
      setKpis(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchKPIs(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchKPIs(); };

  const daysLeft = trialDaysLeft();
  const isTrialEnding = daysLeft <= 7 && daysLeft > 0;

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
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.shopName}>{shop?.name || 'County Hardware'}</Text>
            <Text style={styles.greeting}>Good day, {user?.name?.split(' ')[0]} 👋</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            {kpis?.alerts?.out_of_stock?.length > 0 && <View style={styles.notifDot} />}
            <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Trial Banner */}
        {isTrialEnding && (
          <TouchableOpacity
            style={styles.trialBanner}
            onPress={() => navigation.navigate('Settings', { screen: 'Subscription' })}
          >
            <Ionicons name="time-outline" size={18} color={COLORS.warning} />
            <Text style={styles.trialText}>
              Trial ends in <Text style={{ fontWeight: '800' }}>{daysLeft} days</Text> — Subscribe now
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.warning} />
          </TouchableOpacity>
        )}

        {/* Revenue Cards */}
        <Text style={styles.sectionLabel}>REVENUE</Text>
        <View style={styles.revenueRow}>
          <RevenueCard label="Today" value={kpis?.revenue?.today} currency="KES" accent={COLORS.success} />
          <RevenueCard label="This Week" value={kpis?.revenue?.week} currency="KES" accent={COLORS.info} />
        </View>
        <RevenueCard
          label="This Month" value={kpis?.revenue?.month} currency="KES"
          accent={COLORS.primary} full
        />

        {/* KPI Grid */}
        <Text style={styles.sectionLabel}>INVENTORY</Text>
        <View style={styles.kpiGrid}>
          <KpiCard icon="cube-outline"       label="Total Products"  value={kpis?.inventory?.total}       color={COLORS.primary} />
          <KpiCard icon="layers-outline"     label="Stock Value"     value={`KES ${((kpis?.inventory?.stock_value)||0).toLocaleString()}`} color={COLORS.info} small />
          <KpiCard icon="alert-circle-outline" label="Low Stock"     value={kpis?.inventory?.low_stock}   color={COLORS.warning} />
          <KpiCard icon="close-circle-outline" label="Out of Stock"  value={kpis?.inventory?.out_of_stock} color={COLORS.danger} />
        </View>

        {/* Sales Chart */}
        {kpis?.daily_chart && kpis.daily_chart.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>SALES — LAST 7 DAYS</Text>
            <View style={styles.chartCard}>
              <VictoryChart
                theme={VictoryTheme.grayscale}
                height={200}
                padding={{ top: 10, bottom: 40, left: 60, right: 20 }}
                domainPadding={{ x: 15 }}
              >
                <VictoryAxis
                  tickFormat={kpis.daily_chart.map(d => d.label)}
                  style={{ axis: { stroke: COLORS.border }, tickLabels: { fill: COLORS.textMuted, fontSize: 10 } }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{ axis: { stroke: 'transparent' }, tickLabels: { fill: COLORS.textMuted, fontSize: 9 }, grid: { stroke: COLORS.border, strokeDasharray: '4,4' } }}
                  tickFormat={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                />
                <VictoryBar
                  data={kpis.daily_chart.map((d, i) => ({ x: i + 1, y: d.revenue }))}
                  style={{ data: { fill: COLORS.primary, borderRadius: 4 } }}
                  cornerRadius={{ top: 4 }}
                  animate={{ duration: 800, easing: 'bounce' }}
                />
              </VictoryChart>
            </View>
          </>
        )}

        {/* Top Products */}
        {kpis?.top_products?.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>TOP SELLERS THIS MONTH</Text>
            <View style={styles.card}>
              {kpis.top_products.map((p, i) => (
                <View key={i} style={[styles.topRow, i < kpis.top_products.length - 1 && styles.topRowBorder]}>
                  <View style={[styles.rankBadge, i === 0 && { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.rankText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.topName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.topQty}>{p.qty} sold</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Alerts */}
        {(kpis?.alerts?.out_of_stock?.length > 0 || kpis?.alerts?.low_stock?.length > 0) && (
          <>
            <Text style={styles.sectionLabel}>STOCK ALERTS</Text>
            <View style={styles.card}>
              {kpis.alerts.out_of_stock.slice(0, 3).map((p, i) => (
                <AlertRow key={p.id} name={p.name} type="out" />
              ))}
              {kpis.alerts.low_stock.slice(0, 3).map((p, i) => (
                <AlertRow key={p.id} name={p.name} qty={p.qty} threshold={p.threshold} type="low" />
              ))}
            </View>
          </>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actionRow}>
          <QuickAction icon="cart-outline"    label="New Sale"     color={COLORS.success}  onPress={() => navigation.navigate('Sales')} />
          <QuickAction icon="add-circle-outline" label="Add Product" color={COLORS.primary} onPress={() => navigation.navigate('Inventory', { screen: 'AddEditProduct', params: {} })} />
          <QuickAction icon="bar-chart-outline"  label="Reports"    color={COLORS.info}     onPress={() => navigation.navigate('Reports')} />
          <QuickAction icon="people-outline"     label="Team"       color={COLORS.warning}  onPress={() => navigation.navigate('Settings', { screen: 'Users' })} />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function RevenueCard({ label, value, currency, accent, full }) {
  return (
    <View style={[styles.revenueCard, full && { flex: undefined, marginBottom: 10 }, { borderLeftColor: accent, borderLeftWidth: 3 }]}>
      <Text style={[styles.revenueLabel]}>{label}</Text>
      <Text style={[styles.revenueValue, { color: accent }]}>
        {currency} {((value) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
      </Text>
    </View>
  );
}

function KpiCard({ icon, label, value, color, small }) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.kpiValue, small && { fontSize: 14 }]}>{value ?? '–'}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function AlertRow({ name, qty, threshold, type }) {
  const isOut = type === 'out';
  return (
    <View style={[styles.alertRow]}>
      <View style={[styles.alertDot, { backgroundColor: isOut ? COLORS.danger : COLORS.warning }]} />
      <Text style={styles.alertName} numberOfLines={1}>{name}</Text>
      <Text style={[styles.alertStatus, { color: isOut ? COLORS.danger : COLORS.warning }]}>
        {isOut ? 'OUT OF STOCK' : `${qty} left`}
      </Text>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.base, paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  shopName: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  greeting: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  notifBtn: { padding: 6, position: 'relative' },
  notifDot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger, zIndex: 1 },

  trialBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.warningBg, borderRadius: RADIUS.md,
    padding: 12, marginBottom: SPACING.base,
    borderWidth: 1, borderColor: COLORS.warning + '44',
  },
  trialText: { flex: 1, color: COLORS.warning, fontSize: 13 },

  sectionLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1.4, marginTop: 18, marginBottom: 8 },

  revenueRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  revenueCard: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  revenueLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginBottom: 6 },
  revenueValue: { fontSize: 22, fontWeight: '800' },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  kpiCard: {
    width: '47.5%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'flex-start',
  },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  kpiValue: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  kpiLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },

  chartCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },

  card: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  topRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  topRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rankBadge: { width: 24, height: 24, borderRadius: 6, backgroundColor: COLORS.bgElevated, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 11, fontWeight: '800', color: COLORS.textPrimary },
  topName: { flex: 1, fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  topQty: { fontSize: 12, color: COLORS.textMuted },

  alertRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertName: { flex: 1, fontSize: 13, color: COLORS.textPrimary },
  alertStatus: { fontSize: 11, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 10 },
  quickAction: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  quickActionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickActionLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },
});
