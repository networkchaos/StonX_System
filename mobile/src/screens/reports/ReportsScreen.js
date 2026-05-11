import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  VictoryBar, VictoryChart, VictoryTheme, VictoryAxis,
  VictoryPie, VictoryLine,
} from 'victory-native';
import { COLORS, SPACING, RADIUS } from '../../theme';
import { reportsAPI } from '../../services/api';

export default function ReportsScreen() {
  const [kpis, setKpis]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod]     = useState('week'); // week / month

  const fetchData = async () => {
    try {
      const res = await reportsAPI.kpis();
      setKpis(res.data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  const revenue = period === 'week' ? kpis?.revenue?.week : kpis?.revenue?.month;
  const salesCount = period === 'week' ? kpis?.sales?.week_count : kpis?.sales?.month_count;

  // Payment method breakdown (dummy since we don't break it down in KPI yet)
  const paymentData = [
    { x: 'Cash', y: 55 },
    { x: 'M-Pesa', y: 35 },
    { x: 'Card', y: 10 },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <View style={styles.periodToggle}>
            {['week', 'month'].map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                  {p === 'week' ? '7 Days' : '30 Days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <SummaryCard label="Revenue" value={`KES ${((revenue) || 0).toLocaleString()}`} icon="trending-up-outline" color={COLORS.success} />
          <SummaryCard label="Sales" value={salesCount || 0} icon="receipt-outline" color={COLORS.primary} />
        </View>
        <View style={styles.summaryRow}>
          <SummaryCard label="Stock Value" value={`KES ${((kpis?.inventory?.stock_value) || 0).toLocaleString()}`} icon="cube-outline" color={COLORS.info} />
          <SummaryCard label="Products" value={kpis?.inventory?.total || 0} icon="layers-outline" color={COLORS.warning} />
        </View>

        {/* Daily Revenue Chart */}
        <Text style={styles.sectionLabel}>DAILY REVENUE (LAST 7 DAYS)</Text>
        <View style={styles.chartCard}>
          <VictoryChart
            theme={VictoryTheme.grayscale}
            height={220}
            padding={{ top: 20, bottom: 45, left: 65, right: 20 }}
            domainPadding={{ x: 15 }}
          >
            <VictoryAxis
              tickFormat={kpis?.daily_chart?.map(d => d.label) || []}
              style={{
                axis: { stroke: COLORS.border },
                tickLabels: { fill: COLORS.textMuted, fontSize: 10 },
              }}
            />
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: 'transparent' },
                tickLabels: { fill: COLORS.textMuted, fontSize: 9 },
                grid: { stroke: COLORS.border, strokeDasharray: '4,4' },
              }}
              tickFormat={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
            />
            <VictoryBar
              data={(kpis?.daily_chart || []).map((d, i) => ({ x: i + 1, y: d.revenue }))}
              style={{ data: { fill: COLORS.primary } }}
              cornerRadius={{ top: 5 }}
            />
          </VictoryChart>
        </View>

        {/* Daily Sales Count Chart */}
        <Text style={styles.sectionLabel}>DAILY SALES COUNT</Text>
        <View style={styles.chartCard}>
          <VictoryChart
            theme={VictoryTheme.grayscale}
            height={180}
            padding={{ top: 20, bottom: 40, left: 40, right: 20 }}
          >
            <VictoryAxis
              tickFormat={kpis?.daily_chart?.map(d => d.label) || []}
              style={{
                axis: { stroke: COLORS.border },
                tickLabels: { fill: COLORS.textMuted, fontSize: 10 },
              }}
            />
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: 'transparent' },
                tickLabels: { fill: COLORS.textMuted, fontSize: 9 },
                grid: { stroke: COLORS.border, strokeDasharray: '4,4' },
              }}
            />
            <VictoryLine
              data={(kpis?.daily_chart || []).map((d, i) => ({ x: i + 1, y: d.count }))}
              style={{ data: { stroke: COLORS.info, strokeWidth: 2.5 } }}
              interpolation="catmullRom"
            />
          </VictoryChart>
        </View>

        {/* Top Products */}
        {kpis?.top_products?.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>TOP SELLING PRODUCTS</Text>
            <View style={styles.card}>
              {kpis.top_products.map((p, i) => (
                <View key={i} style={[styles.topRow, i < kpis.top_products.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.border }]}>
                  <Text style={styles.rank}>#{i + 1}</Text>
                  <Text style={styles.topName} numberOfLines={1}>{p.name}</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.topQty}>{p.qty} sold</Text>
                    <Text style={styles.topRev}>KES {p.revenue.toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Inventory Alerts Summary */}
        <Text style={styles.sectionLabel}>INVENTORY HEALTH</Text>
        <View style={styles.healthGrid}>
          <HealthCard label="In Stock" value={kpis?.inventory?.total - kpis?.inventory?.out_of_stock - kpis?.inventory?.low_stock} color={COLORS.success} />
          <HealthCard label="Low Stock" value={kpis?.inventory?.low_stock} color={COLORS.warning} />
          <HealthCard label="Out of Stock" value={kpis?.inventory?.out_of_stock} color={COLORS.danger} />
        </View>

        {/* Out of Stock List */}
        {kpis?.alerts?.out_of_stock?.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>OUT OF STOCK</Text>
            <View style={styles.card}>
              {kpis.alerts.out_of_stock.map((p, i) => (
                <View key={p.id} style={[styles.alertRow, i < kpis.alerts.out_of_stock.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.border }]}>
                  <View style={styles.alertDot} />
                  <Text style={styles.alertName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.alertStatus}>OUT OF STOCK</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, icon, color }) {
  return (
    <View style={[styles.summaryCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={[styles.summaryIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function HealthCard({ label, value, color }) {
  return (
    <View style={[styles.healthCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={[styles.healthValue, { color }]}>{value ?? 0}</Text>
      <Text style={styles.healthLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.base, paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  periodToggle: { flexDirection: 'row', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: 3, borderWidth: 1, borderColor: COLORS.border },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: RADIUS.sm },
  periodBtnActive: { backgroundColor: COLORS.primary },
  periodText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  periodTextActive: { color: COLORS.white },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  summaryCard: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  summaryIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  summaryValue: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  summaryLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1.4, marginTop: 18, marginBottom: 8 },
  chartCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  card: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  topRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  rank: { fontSize: 14, fontWeight: '800', color: COLORS.primary, width: 28 },
  topName: { flex: 1, fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  topQty: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  topRev: { fontSize: 12, color: COLORS.success, fontWeight: '700', marginTop: 2 },
  healthGrid: { flexDirection: 'row', gap: 10 },
  healthCard: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  healthValue: { fontSize: 26, fontWeight: '900' },
  healthLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  alertRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger },
  alertName: { flex: 1, fontSize: 13, color: COLORS.textPrimary },
  alertStatus: { fontSize: 10, fontWeight: '800', color: COLORS.danger, letterSpacing: 0.8 },
});
