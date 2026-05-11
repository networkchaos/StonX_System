import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../theme';
import useInventoryStore from '../../store/inventoryStore';
import useSalesStore from '../../store/salesStore';
import useAuthStore from '../../store/authStore';

export default function ProductDetailScreen({ route, navigation }) {
  const { productId } = route.params || {};
  const { products, updatePrice, updateStock, deleteProduct } = useInventoryStore();
  const addToCart = useSalesStore(s => s.addToCart);
  const isManager = useAuthStore(s => s.isManager());
  const isOwner   = useAuthStore(s => s.isOwner());

  const product = products.find(p => String(p.id) === String(productId));

  const [editPriceModal, setEditPriceModal] = useState(false);
  const [stockModal, setStockModal]         = useState(false);
  const [newPrice, setNewPrice]             = useState('');
  const [stockQty, setStockQty]             = useState('');
  const [stockType, setStockType]           = useState('IN');
  const [stockReason, setStockReason]       = useState('');
  const [saving, setSaving]                 = useState(false);

  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={{ color: COLORS.textMuted }}>Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const qty = parseInt(product.quantity) || 0;
  const threshold = parseInt(product.threshold) || 5;
  const status = qty === 0 ? 'OUT' : qty <= threshold ? 'LOW' : 'IN STOCK';
  const statusColor = qty === 0 ? COLORS.danger : qty <= threshold ? COLORS.warning : COLORS.success;

  const handleUpdatePrice = async () => {
    if (!newPrice || isNaN(parseFloat(newPrice))) {
      return Alert.alert('Invalid Price', 'Enter a valid price');
    }
    setSaving(true);
    try {
      await updatePrice(product.id, parseFloat(newPrice));
      setEditPriceModal(false);
      setNewPrice('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || err.message);
    } finally { setSaving(false); }
  };

  const handleStockUpdate = async () => {
    if (!stockQty || isNaN(parseInt(stockQty))) {
      return Alert.alert('Invalid Quantity', 'Enter a valid quantity');
    }
    setSaving(true);
    try {
      await updateStock(product.id, {
        quantity: parseInt(stockQty),
        type: stockType,
        reason: stockReason || 'Manual adjustment',
      });
      setStockModal(false);
      setStockQty('');
      setStockReason('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || err.message);
    } finally { setSaving(false); }
  };

  const handleDelete = () => {
    Alert.alert('Delete Product', `Delete "${product.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteProduct(product.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleAddToCart = () => {
    addToCart(product, 1);
    Alert.alert('Added!', `${product.name} added to cart`, [
      { text: 'Continue', style: 'default' },
      { text: 'Go to Cart', onPress: () => navigation.navigate('Sales', { screen: 'Cart' }) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Product Header */}
        <View style={styles.productHeader}>
          <View style={styles.productIconWrap}>
            <Ionicons name="cube-outline" size={36} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productCat}>{product.category || 'Uncategorized'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
          </View>
        </View>

        {/* Price + Stock */}
        <View style={styles.bigRow}>
          <TouchableOpacity
            style={[styles.bigCard, { borderColor: COLORS.primary + '44' }]}
            onPress={() => { setNewPrice(String(product.price)); setEditPriceModal(true); }}
            disabled={!isManager}
          >
            <Text style={styles.bigCardLabel}>SELLING PRICE</Text>
            <Text style={styles.bigCardValue}>
              KES {parseFloat(product.price || 0).toLocaleString()}
            </Text>
            {isManager && (
              <View style={styles.editHint}>
                <Ionicons name="create-outline" size={12} color={COLORS.primary} />
                <Text style={styles.editHintText}>Tap to edit</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bigCard, { borderColor: statusColor + '44' }]}
            onPress={() => setStockModal(true)}
            disabled={!isManager}
          >
            <Text style={styles.bigCardLabel}>IN STOCK</Text>
            <Text style={[styles.bigCardValue, { color: statusColor }]}>
              {qty} <Text style={{ fontSize: 14, fontWeight: '600' }}>{product.unit || 'pcs'}</Text>
            </Text>
            {isManager && (
              <View style={styles.editHint}>
                <Ionicons name="create-outline" size={12} color={statusColor} />
                <Text style={[styles.editHintText, { color: statusColor }]}>Adjust stock</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionLabel}>PRODUCT DETAILS</Text>
          <DetailRow label="Barcode"      value={product.barcode || '—'} />
          <DetailRow label="Cost Price"   value={product.cost_price ? `KES ${parseFloat(product.cost_price).toLocaleString()}` : '—'} />
          <DetailRow label="Low Stock At" value={`${product.threshold || 5} ${product.unit || 'pcs'}`} />
          <DetailRow label="Supplier"     value={product.supplier_id || '—'} />
          <DetailRow label="Unit"         value={product.unit || 'pcs'} />
          {product.description ? <DetailRow label="Description" value={product.description} /> : null}
          <DetailRow label="Last Updated" value={product.updated_at ? new Date(product.updated_at).toLocaleDateString() : '—'} />
        </View>

        {/* Profit Margin */}
        {product.cost_price && product.price && (
          <View style={styles.profitCard}>
            <Text style={styles.profitLabel}>PROFIT MARGIN</Text>
            <Text style={styles.profitValue}>
              {(((product.price - product.cost_price) / product.price) * 100).toFixed(1)}%
            </Text>
            <Text style={styles.profitSub}>
              KES {(product.price - product.cost_price).toFixed(2)} per {product.unit || 'unit'}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={handleAddToCart}
            disabled={qty === 0}
          >
            <Ionicons name="cart-outline" size={20} color={qty === 0 ? COLORS.textMuted : COLORS.white} />
            <Text style={[styles.cartBtnText, qty === 0 && { color: COLORS.textMuted }]}>
              {qty === 0 ? 'Out of Stock' : 'Add to Sale'}
            </Text>
          </TouchableOpacity>

          {isManager && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('AddEditProduct', { product })}
            >
              <Ionicons name="create-outline" size={20} color={COLORS.primary} />
              <Text style={styles.editBtnText}>Edit Product</Text>
            </TouchableOpacity>
          )}

          {isOwner && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Edit Price Modal */}
      <Modal visible={editPriceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Selling Price</Text>
            <Text style={styles.modalSub}>Current: KES {parseFloat(product.price || 0).toLocaleString()}</Text>
            <TextInput
              style={styles.modalInput}
              value={newPrice}
              onChangeText={setNewPrice}
              keyboardType="numeric"
              placeholder="New price (KES)"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditPriceModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleUpdatePrice} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.modalConfirmText}>Update Price</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stock Update Modal */}
      <Modal visible={stockModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Adjust Stock</Text>
            <Text style={styles.modalSub}>Current: {qty} {product.unit || 'pcs'}</Text>
            <View style={styles.typeRow}>
              {['IN', 'OUT', 'ADJUST'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, stockType === t && styles.typeBtnActive]}
                  onPress={() => setStockType(t)}
                >
                  <Text style={[styles.typeBtnText, stockType === t && styles.typeBtnTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.modalInput}
              value={stockQty}
              onChangeText={setStockQty}
              keyboardType="numeric"
              placeholder="Quantity"
              placeholderTextColor={COLORS.textMuted}
            />
            <TextInput
              style={[styles.modalInput, { marginTop: 8 }]}
              value={stockReason}
              onChangeText={setStockReason}
              placeholder="Reason (optional)"
              placeholderTextColor={COLORS.textMuted}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setStockModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleStockUpdate} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.modalConfirmText}>Update Stock</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.base, paddingBottom: 30 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  productHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.base, gap: 12 },
  productIconWrap: {
    width: 64, height: 64, backgroundColor: COLORS.bgCard,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  productName: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
  productCat: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.sm },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  bigRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.md },
  bigCard: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: 16, borderWidth: 1.5,
  },
  bigCardLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: 6 },
  bigCardValue: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  editHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  editHintText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  detailsCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.base, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { fontSize: 13, color: COLORS.textMuted },
  detailValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  profitCard: { backgroundColor: COLORS.successBg, borderRadius: RADIUS.lg, padding: SPACING.base, borderWidth: 1, borderColor: COLORS.success + '44', marginBottom: SPACING.md, alignItems: 'center' },
  profitLabel: { fontSize: 10, fontWeight: '700', color: COLORS.success, letterSpacing: 1.2, marginBottom: 4 },
  profitValue: { fontSize: 32, fontWeight: '800', color: COLORS.success },
  profitSub: { fontSize: 12, color: COLORS.success, marginTop: 4, opacity: 0.8 },
  actions: { flexDirection: 'row', gap: 10 },
  cartBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  cartBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  editBtn: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  editBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  deleteBtn: {
    width: 50, height: 50, backgroundColor: COLORS.dangerBg, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.danger + '44',
  },
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },
  modalInput: {
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, height: 50,
    paddingHorizontal: 14, color: COLORS.textPrimary, fontSize: 16,
  },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: { flex: 1, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.bgInput, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 12 },
  typeBtnTextActive: { color: COLORS.white },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalCancel: { flex: 1, height: 50, borderRadius: RADIUS.md, backgroundColor: COLORS.bgInput, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { color: COLORS.textMuted, fontWeight: '700' },
  modalConfirm: { flex: 2, height: 50, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  modalConfirmText: { color: COLORS.white, fontWeight: '800' },
});
