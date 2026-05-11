import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { COLORS, SPACING, RADIUS } from '../../theme';
import useSalesStore from '../../store/salesStore';

const PAYMENT_ICONS = {
  cash:   { icon: 'cash-outline',             color: COLORS.success },
  mpesa:  { icon: 'phone-portrait-outline',   color: COLORS.info },
  card:   { icon: 'card-outline',             color: COLORS.warning },
  credit: { icon: 'time-outline',             color: COLORS.danger },
};

export default function SalesHistoryScreen({ navigation }) {
  const { recentSales, fetchRecentSales } = useSalesStore();
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecentSales().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentSales();
    setRefreshing(false);
  };

  const renderSale = ({ item }) => {
    const pm = PAYMENT_ICONS[item.payment_method] || PAYMENT_ICONS.cash;
    const items = Array.isArray(item.items) ? item.items : [];
    const dateStr = item.date ? format(new Date(item.date), 'dd MMM, h:mm a') : '—';

    return (
      <TouchableOpacity
        style={styles.saleCard}
        onPress={() => navigation.navigate('Receipt', { sale: item })}
        activeOpacity={0.85}
      >
        <View style={[styles.pmIcon, { backgroundColor: pm.color + '22' }]}>
          <Ionicons name={pm.icon} size={20} color={pm.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.receiptNum}>{item.receipt_number}</Text>
          <Text style={styles.itemsSummary} numberOfLines={1}>
            {items.map(i => i.name).join(', ') || 'No items'}
          </Text>
          <Text style={styles.dateText}>{dateStr} · {item.cashier_name}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.totalText}>KES {parseFloat(item.total).toLocaleString()}</Text>
          <Text style={[styles.pmLabel, { color: pm.color }]}>
            {item.payment_method?.toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={recentSales}
        keyExtractor={s => String(s.id)}
        renderItem={renderSale}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Sales History</Text>
            <Text style={styles.listSub}>{recentSales.length} recent transactions</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyText}>No sales yet</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: SPACING.base, paddingBottom: 30 },
  listHeader: { marginBottom: 16 },
  listTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  listSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  saleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  pmIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  receiptNum: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  itemsSummary: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  dateText: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  totalText: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  pmLabel: { fontSize: 10, fontWeight: '800', marginTop: 3, letterSpacing: 0.8 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, color: COLORS.textMuted },
});
