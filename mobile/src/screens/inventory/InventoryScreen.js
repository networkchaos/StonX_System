import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../../theme';
import useInventoryStore from '../../store/inventoryStore';
import useAuthStore from '../../store/authStore';

export default function InventoryScreen({ navigation }) {
  const {
    products, isLoading, fetchProducts, fetchCategories, categories,
    searchQuery, setSearch, activeCategory, setCategory, getFiltered,
  } = useInventoryStore();

  const isManager = useAuthStore(s => s.isManager());
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => {
    fetchProducts();
    fetchCategories();
  }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const filtered = getFiltered();

  const stockStatus = (qty, threshold) => {
    const q = parseInt(qty) || 0;
    if (q === 0) return { label: 'OUT', color: COLORS.danger };
    if (q <= (parseInt(threshold) || 5)) return { label: 'LOW', color: COLORS.warning };
    return { label: 'OK', color: COLORS.success };
  };

  const renderProduct = ({ item }) => {
    const status = stockStatus(item.quantity, item.threshold);
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        activeOpacity={0.85}
      >
        <View style={styles.productLeft}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText} numberOfLines={1}>
              {item.category || '—'}
            </Text>
          </View>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productBarcode}>{item.barcode || 'No barcode'}</Text>
        </View>

        <View style={styles.productRight}>
          <Text style={styles.productPrice}>
            KES {parseFloat(item.price || 0).toLocaleString()}
          </Text>
          <View style={[styles.stockBadge, { backgroundColor: status.color + '22' }]}>
            <View style={[styles.stockDot, { backgroundColor: status.color }]} />
            <Text style={[styles.stockQty, { color: status.color }]}>
              {parseInt(item.quantity) || 0} {item.unit || 'pcs'}
            </Text>
          </View>
          <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, barcode, category..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Barcode scan button */}
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => navigation.navigate('ProductDetail', { scanMode: true })}
        >
          <Ionicons name="barcode-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <View>
        <FlatList
          data={categories.length > 0 ? categories : ['All']}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i}
          contentContainerStyle={styles.catList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catChip, activeCategory === item && styles.catChipActive]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.catChipText, activeCategory === item && styles.catChipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{filtered.length}</Text>
          {' '}products
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => setCategory('low_stock')}>
            <Text style={styles.statsLink}>Low stock</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCategory('out_of_stock')}>
            <Text style={[styles.statsLink, { color: COLORS.danger }]}>Out of stock</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Product List */}
      {isLoading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No products found</Text>
              {isManager && (
                <TouchableOpacity
                  style={styles.addFirstBtn}
                  onPress={() => navigation.navigate('AddEditProduct', {})}
                >
                  <Text style={styles.addFirstBtnText}>Add your first product →</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB - Add Product */}
      {isManager && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddEditProduct', {})}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  searchRow: { flexDirection: 'row', gap: 10, padding: SPACING.base, paddingBottom: 8 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, height: 46,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },
  scanBtn: {
    width: 46, height: 46, backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  catList: { paddingHorizontal: SPACING.base, paddingBottom: 8, gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  catChipTextActive: { color: COLORS.white },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.base, paddingBottom: 8,
  },
  statsText: { fontSize: 13, color: COLORS.textMuted },
  statsLink: { fontSize: 12, color: COLORS.warning, fontWeight: '600' },
  list: { paddingHorizontal: SPACING.base, paddingBottom: 80, gap: 8 },
  productCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: 14, flexDirection: 'row', borderWidth: 1, borderColor: COLORS.border,
  },
  productLeft: { flex: 1, marginRight: 12 },
  categoryBadge: {
    alignSelf: 'flex-start', backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6,
  },
  categoryBadgeText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
  productName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  productBarcode: { fontSize: 11, color: COLORS.textMuted },
  productRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  productPrice: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  stockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4,
  },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockQty: { fontSize: 12, fontWeight: '700' },
  statusLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 16 },
  addFirstBtn: { marginTop: 8 },
  addFirstBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
});
