import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../theme';
import useSalesStore from '../../store/salesStore';

const PAYMENT_METHODS = [
  { key: 'cash',     label: 'Cash',     icon: 'cash-outline' },
  { key: 'mpesa',    label: 'M-Pesa',   icon: 'phone-portrait-outline' },
  { key: 'card',     label: 'Card',     icon: 'card-outline' },
  { key: 'credit',   label: 'Credit',   icon: 'time-outline' },
];

export default function CartScreen({ navigation }) {
  const { cart, removeFromCart, updateCartQty, clearCart, checkout, isProcessing, getSubtotal } = useSalesStore();

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [mpesaRef, setMpesaRef]           = useState('');
  const [discount, setDiscount]           = useState('');
  const [customerName, setCustomerName]   = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const subtotal = getSubtotal();
  const discountAmt = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmt);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      return Alert.alert('Empty Cart', 'Add products to proceed');
    }
    if (paymentMethod === 'mpesa' && !mpesaRef) {
      return Alert.alert('M-Pesa Reference Required', 'Enter the M-Pesa transaction reference');
    }

    try {
      const sale = await checkout({
        paymentMethod, mpesaRef, discount: discountAmt,
        customerName, customerPhone,
      });
      navigation.replace('Receipt', { sale });
    } catch (err) {
      Alert.alert('Checkout Failed', err.response?.data?.error || err.message);
    }
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.shopBtnText}>← Back to Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Cart Items */}
        <Text style={styles.sectionLabel}>CART ITEMS ({cart.length})</Text>
        {cart.map((item, i) => (
          <View key={item.product_id} style={styles.cartItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemPrice}>KES {item.price.toLocaleString()} / {item.unit || 'pcs'}</Text>
            </View>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateCartQty(item.product_id, item.qty - 1)}
              >
                <Ionicons name="remove" size={16} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.qty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateCartQty(item.product_id, item.qty + 1)}
              >
                <Ionicons name="add" size={16} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={{ alignItems: 'flex-end', minWidth: 80 }}>
              <Text style={styles.itemTotal}>
                KES {(item.price * item.qty).toLocaleString()}
              </Text>
              <TouchableOpacity onPress={() => removeFromCart(item.product_id)} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.clearBtn} onPress={() => Alert.alert('Clear Cart?', '', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: clearCart },
        ])}>
          <Text style={styles.clearBtnText}>Clear all</Text>
        </TouchableOpacity>

        {/* Customer (optional) */}
        <Text style={styles.sectionLabel}>CUSTOMER (OPTIONAL)</Text>
        <View style={styles.card}>
          <InputRow
            icon="person-outline" placeholder="Customer name"
            value={customerName} onChange={setCustomerName}
          />
          <InputRow
            icon="call-outline" placeholder="Phone number"
            value={customerPhone} onChange={setCustomerPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Payment Method */}
        <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
        <View style={styles.paymentGrid}>
          {PAYMENT_METHODS.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[styles.paymentChip, paymentMethod === m.key && styles.paymentChipActive]}
              onPress={() => setPaymentMethod(m.key)}
            >
              <Ionicons
                name={m.icon}
                size={20}
                color={paymentMethod === m.key ? COLORS.white : COLORS.textMuted}
              />
              <Text style={[styles.paymentChipText, paymentMethod === m.key && styles.paymentChipTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* M-Pesa Ref */}
        {paymentMethod === 'mpesa' && (
          <View style={styles.card}>
            <InputRow
              icon="phone-portrait-outline" placeholder="M-Pesa Transaction Ref (required)"
              value={mpesaRef} onChange={setMpesaRef} autoCapitalize="characters"
            />
          </View>
        )}

        {/* Discount */}
        <Text style={styles.sectionLabel}>DISCOUNT (OPTIONAL)</Text>
        <View style={styles.card}>
          <InputRow
            icon="pricetag-outline" placeholder="Discount amount (KES)"
            value={discount} onChange={setDiscount} keyboardType="numeric"
          />
        </View>

        {/* Order Summary */}
        <Text style={styles.sectionLabel}>ORDER SUMMARY</Text>
        <View style={styles.summaryCard}>
          <SummaryRow label="Subtotal" value={`KES ${subtotal.toLocaleString()}`} />
          {discountAmt > 0 && (
            <SummaryRow label="Discount" value={`-KES ${discountAmt.toLocaleString()}`} valueColor={COLORS.success} />
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>KES {total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Checkout Button */}
        <TouchableOpacity
          style={[styles.checkoutBtn, isProcessing && { opacity: 0.7 }]}
          onPress={handleCheckout}
          disabled={isProcessing}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="receipt-outline" size={22} color={COLORS.white} />
              <Text style={styles.checkoutBtnText}>
                Complete Sale · KES {total.toLocaleString()}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InputRow({ icon, placeholder, value, onChange, keyboardType, autoCapitalize }) {
  return (
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function SummaryRow({ label, value, valueColor }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.base, paddingBottom: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyTitle: { fontSize: 18, color: COLORS.textMuted, fontWeight: '600' },
  shopBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  shopBtnText: { color: COLORS.primary, fontWeight: '700' },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1.4, marginTop: 18, marginBottom: 8 },
  cartItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  itemPrice: { fontSize: 11, color: COLORS.textMuted },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: COLORS.bgElevated, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, minWidth: 24, textAlign: 'center' },
  itemTotal: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  removeBtn: { marginTop: 4, padding: 2 },
  clearBtn: { alignSelf: 'flex-end', padding: 8 },
  clearBtnText: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },
  card: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', marginBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 50, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  paymentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
  },
  paymentChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  paymentChipText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 13 },
  paymentChipTextActive: { color: COLORS.white },
  summaryCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.base, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 14, color: COLORS.textMuted },
  summaryValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 6, borderTopWidth: 1, borderTopColor: COLORS.border },
  totalLabel: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  totalValue: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  checkoutBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  checkoutBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
