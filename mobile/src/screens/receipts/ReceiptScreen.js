import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { COLORS, SPACING, RADIUS } from '../../theme';
import useAuthStore from '../../store/authStore';
import { receiptsAPI } from '../../services/api';

export default function ReceiptScreen({ route, navigation }) {
  const { sale } = route.params || {};
  const shop = useAuthStore(s => s.shop);

  if (!sale) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={{ color: COLORS.textMuted }}>No receipt data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const items = Array.isArray(sale.items) ? sale.items : JSON.parse(sale.items_json || '[]');

  const buildHTML = () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: monospace; font-size: 12px; padding: 16px; max-width: 300px; margin: 0 auto; background: white; color: #111; }
        h1 { font-size: 18px; text-align: center; font-weight: 900; margin-bottom: 2px; }
        .subtitle { text-align: center; font-size: 10px; color: #666; margin-bottom: 10px; }
        .divider { border-top: 1px dashed #999; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .label { color: #666; }
        .item-name { font-weight: bold; margin-bottom: 2px; }
        .total-row { font-size: 15px; font-weight: 900; border-top: 2px solid #111; padding-top: 6px; margin-top: 6px; }
        .footer { text-align: center; margin-top: 14px; font-size: 10px; color: #888; }
        .receipt-no { text-align: center; font-size: 10px; background: #f5f5f5; padding: 4px; border-radius: 4px; margin-bottom: 6px; }
      </style>
    </head>
    <body>
      <h1>${shop?.name || 'County Hardware'}</h1>
      <div class="subtitle">OFFICIAL RECEIPT</div>
      <div class="receipt-no">Ref: ${sale.receipt_number}</div>
      <div class="divider"></div>
      <div class="row"><span class="label">Date</span><span>${new Date(sale.date).toLocaleString()}</span></div>
      <div class="row"><span class="label">Cashier</span><span>${sale.cashier_name}</span></div>
      ${sale.customer_name ? `<div class="row"><span class="label">Customer</span><span>${sale.customer_name}</span></div>` : ''}
      <div class="divider"></div>
      ${items.map(item => `
        <div class="item-name">${item.name}</div>
        <div class="row">
          <span>${item.qty} × KES ${parseFloat(item.price).toFixed(2)}</span>
          <span>KES ${(item.qty * item.price).toFixed(2)}</span>
        </div>
      `).join('')}
      <div class="divider"></div>
      <div class="row"><span class="label">Subtotal</span><span>KES ${parseFloat(sale.subtotal).toFixed(2)}</span></div>
      ${sale.discount > 0 ? `<div class="row"><span class="label">Discount</span><span>-KES ${parseFloat(sale.discount).toFixed(2)}</span></div>` : ''}
      <div class="row total-row"><span>TOTAL</span><span>KES ${parseFloat(sale.total).toFixed(2)}</span></div>
      <div class="row"><span class="label">Payment</span><span>${sale.payment_method?.toUpperCase()}</span></div>
      ${sale.mpesa_ref ? `<div class="row"><span class="label">M-Pesa Ref</span><span>${sale.mpesa_ref}</span></div>` : ''}
      <div class="divider"></div>
      <div class="footer">Thank you for shopping at ${shop?.name || 'County Hardware'}</div>
      <div class="footer" style="margin-top:4px">Powered by County Hardware App</div>
    </body>
    </html>
  `;

  const handlePrint = async () => {
    try {
      await Print.printAsync({ html: buildHTML() });
    } catch (err) {
      Alert.alert('Print Failed', err.message);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: buildHTML() });
      const dest = `${FileSystem.documentDirectory}${sale.receipt_number}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: dest });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(dest, {
          mimeType: 'application/pdf',
          dialogTitle: `Receipt ${sale.receipt_number}`,
        });
      } else {
        Alert.alert('Saved!', `PDF saved to: ${dest}`);
      }
    } catch (err) {
      Alert.alert('Download Failed', err.message);
    }
  };

  const handleShareWhatsApp = async () => {
    const text = [
      `*${shop?.name || 'County Hardware'} - Receipt*`,
      `Ref: ${sale.receipt_number}`,
      `Date: ${new Date(sale.date).toLocaleString()}`,
      `---`,
      ...items.map(i => `${i.name}: ${i.qty} × KES ${i.price} = KES ${(i.qty * i.price).toFixed(0)}`),
      `---`,
      `Total: *KES ${parseFloat(sale.total).toFixed(0)}*`,
      `Payment: ${sale.payment_method?.toUpperCase()}`,
      sale.mpesa_ref ? `M-Pesa: ${sale.mpesa_ref}` : '',
      ``,
      `Thank you for shopping with us!`,
    ].filter(Boolean).join('\n');

    await Share.share({ message: text });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Success header */}
        <View style={styles.successHeader}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={36} color={COLORS.white} />
          </View>
          <Text style={styles.successTitle}>Sale Complete!</Text>
          <Text style={styles.receiptNum}>{sale.receipt_number}</Text>
        </View>

        {/* Receipt Card */}
        <View style={styles.receiptCard}>
          <Text style={styles.shopName}>{shop?.name || 'County Hardware'}</Text>
          <Text style={styles.officialText}>OFFICIAL RECEIPT</Text>

          <View style={styles.dashedDivider} />

          <InfoRow label="Date"    value={new Date(sale.date).toLocaleString()} />
          <InfoRow label="Cashier" value={sale.cashier_name} />
          {sale.customer_name && <InfoRow label="Customer" value={sale.customer_name} />}
          {sale.customer_phone && <InfoRow label="Phone" value={sale.customer_phone} />}

          <View style={styles.dashedDivider} />

          {/* Items */}
          <View style={styles.itemsHeader}>
            <Text style={styles.colItem}>ITEM</Text>
            <Text style={styles.colQty}>QTY</Text>
            <Text style={styles.colTotal}>TOTAL</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemUnitPrice}>@ KES {parseFloat(item.price).toLocaleString()}</Text>
              </View>
              <Text style={styles.colQtyVal}>{item.qty}</Text>
              <Text style={styles.colTotalVal}>
                KES {(item.qty * item.price).toLocaleString()}
              </Text>
            </View>
          ))}

          <View style={styles.dashedDivider} />

          <InfoRow label="Subtotal" value={`KES ${parseFloat(sale.subtotal).toLocaleString()}`} />
          {sale.discount > 0 && (
            <InfoRow label="Discount" value={`-KES ${parseFloat(sale.discount).toLocaleString()}`} valueColor={COLORS.success} />
          )}
          <View style={styles.totalBigRow}>
            <Text style={styles.totalBigLabel}>TOTAL</Text>
            <Text style={styles.totalBigValue}>
              KES {parseFloat(sale.total).toLocaleString()}
            </Text>
          </View>

          <InfoRow label="Payment"  value={sale.payment_method?.toUpperCase()} />
          {sale.mpesa_ref && <InfoRow label="M-Pesa Ref" value={sale.mpesa_ref} />}

          <View style={styles.dashedDivider} />
          <Text style={styles.thankYou}>
            Thank you for shopping at {'\n'}{shop?.name || 'County Hardware'}
          </Text>
          <Text style={styles.poweredBy}>Powered by County Hardware App</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleDownloadPDF}>
            <Ionicons name="download-outline" size={22} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Download PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handlePrint}>
            <Ionicons name="print-outline" size={22} color={COLORS.info} />
            <Text style={[styles.actionBtnText, { color: COLORS.info }]}>Print</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.whatsappBtn} onPress={handleShareWhatsApp}>
          <Ionicons name="logo-whatsapp" size={22} color={COLORS.white} />
          <Text style={styles.whatsappBtnText}>Share via WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.navigate('POS')}
        >
          <Text style={styles.doneBtnText}>New Sale →</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, valueColor }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.base, paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successHeader: { alignItems: 'center', paddingVertical: 24 },
  checkCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.success, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  successTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary },
  receiptNum: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  receiptCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    marginBottom: SPACING.base,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  shopName: { fontSize: 18, fontWeight: '900', color: '#111', textAlign: 'center' },
  officialText: { fontSize: 10, color: '#888', textAlign: 'center', letterSpacing: 2, marginTop: 2, marginBottom: 10 },
  dashedDivider: { borderTopWidth: 1, borderTopColor: '#ddd', borderStyle: 'dashed', marginVertical: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  infoLabel: { fontSize: 12, color: '#666' },
  infoValue: { fontSize: 12, color: '#111', fontWeight: '600' },
  itemsHeader: { flexDirection: 'row', marginBottom: 8 },
  colItem: { flex: 1, fontSize: 10, fontWeight: '800', color: '#888', textTransform: 'uppercase' },
  colQty: { width: 40, fontSize: 10, fontWeight: '800', color: '#888', textAlign: 'center' },
  colTotal: { width: 90, fontSize: 10, fontWeight: '800', color: '#888', textAlign: 'right' },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  itemName: { fontSize: 13, fontWeight: '700', color: '#111' },
  itemUnitPrice: { fontSize: 10, color: '#888' },
  colQtyVal: { width: 40, textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#111', marginTop: 2 },
  colTotalVal: { width: 90, textAlign: 'right', fontSize: 13, fontWeight: '700', color: '#111', marginTop: 2 },
  totalBigRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  totalBigLabel: { fontSize: 16, fontWeight: '900', color: '#111' },
  totalBigValue: { fontSize: 20, fontWeight: '900', color: '#111' },
  thankYou: { textAlign: 'center', fontSize: 12, color: '#888', marginTop: 8, lineHeight: 18 },
  poweredBy: { textAlign: 'center', fontSize: 10, color: '#bbb', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, height: 52,
    borderWidth: 1, borderColor: COLORS.border,
  },
  actionBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  whatsappBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#25D366', borderRadius: RADIUS.lg, height: 52, marginBottom: 10,
  },
  whatsappBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  doneBtn: {
    alignItems: 'center', justifyContent: 'center', height: 52,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
  },
  doneBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
