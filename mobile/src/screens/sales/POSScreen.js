import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../theme';
import useInventoryStore from '../../store/inventoryStore';
import useSalesStore from '../../store/salesStore';

export default function POSScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  const products     = useInventoryStore(s => s.products);
  const fetchProducts = useInventoryStore(s => s.fetchProducts);
  const addToCart    = useSalesStore(s => s.addToCart);
  const cartCount    = useSalesStore(s => s.getItemCount());
  const subtotal     = useSalesStore(s => s.getSubtotal());

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setResults(products.slice(0, 20));
      return;
    }
    const q = search.toLowerCase();
    setResults(
      products.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.barcode?.includes(q) ||
        p.category?.toLowerCase().includes(q)
      ).slice(0, 30)
    );
  }, [search, products]);

  const handleAdd = (product) => {
    const qty = parseInt(product.quantity) || 0;
    if (qty === 0) {
      return Alert.alert('Out of Stock', `${product.name} is currently out of stock`);
    }
    addToCart(product, 1);
    // Brief visual feedback
  };

  const renderItem = ({ item }) => {
    const qty = parseInt(item.quantity) || 0;
    const isOut = qty === 0;
    return (
      <TouchableOpacity
        style={[styles.productItem, isOut && styles.productItemDisabled]}
        onPress={() => handleAdd(item)}
        disabled={isOut}
        activeOpacity={0.75}
      >
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <View style={styles.productMeta}>
            <Text style={styles.productCat}>{item.category || '—'}</Text>
            <View style={[
              styles.stockPill,
              { backgroundColor: isOut ? COLORS.dangerBg : COLORS.successBg }
            ]}>
              <Text style={[styles.stockPillText, { color: isOut ? COLORS.danger : COLORS.success }]}>
                {isOut ? 'Out' : `${qty} left`}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.productAction}>
          <Text style={[styles.productPrice, isOut && { color: COLORS.textMuted }]}>
            KES {parseFloat(item.price || 0).toLocaleString()}
          </Text>
          <View style={[styles.addBtn, isOut && styles.addBtnDisabled]}>
            <Ionicons name="add" size={20} color={isOut ? COLORS.textMuted : COLORS.white} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Search / Scan */}
      <View style={styles.searchArea}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search product or scan barcode..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.scanBtn}>
          <Ionicons name="scan-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Product Grid */}
      <FlatList
        data={results}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.listHeader}>
            {search ? `${results.length} results` : 'All Products'}
          </Text>
        }
      />

      {/* Cart Summary Bar */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.cartBar}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.9}
        >
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>
          <Text style={styles.cartBarText}>View Cart</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.cartBarPrice}>
            KES {subtotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  searchArea: { flexDirection: 'row', gap: 10, padding: SPACING.base, paddingBottom: 8 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, height: 50,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 15 },
  scanBtn: {
    width: 50, height: 50, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  listHeader: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginBottom: 10 },
  list: { paddingHorizontal: SPACING.base, paddingBottom: 100 },
  productItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  productItemDisabled: { opacity: 0.5 },
  productInfo: { flex: 1, marginRight: 12 },
  productName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productCat: { fontSize: 11, color: COLORS.textMuted },
  stockPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  stockPillText: { fontSize: 10, fontWeight: '700' },
  productAction: { alignItems: 'flex-end', gap: 8 },
  productPrice: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  addBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: COLORS.bgElevated },
  cartBar: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.xl,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  cartBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  cartBadgeText: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  cartBarText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  cartBarPrice: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
