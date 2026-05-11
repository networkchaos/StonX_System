// AddEditProductScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../theme';
import useInventoryStore from '../../store/inventoryStore';

export default function AddEditProductScreen({ route, navigation }) {
  const { product } = route.params || {};
  const isEdit = !!product;

  const [form, setForm] = useState({
    name:        product?.name || '',
    category:    product?.category || '',
    description: product?.description || '',
    price:       String(product?.price || ''),
    cost_price:  String(product?.cost_price || ''),
    quantity:    String(product?.quantity || ''),
    threshold:   String(product?.threshold || '5'),
    barcode:     product?.barcode || '',
    unit:        product?.unit || 'pcs',
  });

  const [saving, setSaving] = useState(false);
  const { addProduct, updateProduct } = useInventoryStore();

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim())  return Alert.alert('Required', 'Product name is required');
    if (!form.price)        return Alert.alert('Required', 'Price is required');

    setSaving(true);
    try {
      if (isEdit) {
        await updateProduct(product.id, form);
      } else {
        await addProduct(form);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || err.message);
    } finally { setSaving(false); }
  };

  const Field = ({ label, field, placeholder, keyboardType, multiline }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={form[field]}
        onChangeText={v => update(field, v)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Field label="PRODUCT NAME *"    field="name"        placeholder="e.g. Hammer 16oz" />
            <Field label="CATEGORY"          field="category"    placeholder="e.g. Tools, Paint, Electrical" />
            <Field label="DESCRIPTION"       field="description" placeholder="Brief description..." multiline />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="SELLING PRICE (KES) *" field="price"      placeholder="0.00" keyboardType="numeric" />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="COST PRICE (KES)"      field="cost_price" placeholder="0.00" keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="QUANTITY"      field="quantity"  placeholder="0"   keyboardType="numeric" />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="LOW STOCK AT"  field="threshold" placeholder="5"   keyboardType="numeric" />
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="UNIT"    field="unit"    placeholder="pcs, kg, m..." />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="BARCODE" field="barcode" placeholder="Scan or type" />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={COLORS.white} />
              : <>
                  <Ionicons name={isEdit ? 'checkmark-circle-outline' : 'add-circle-outline'} size={22} color={COLORS.white} />
                  <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Add Product'}</Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: SPACING.base, paddingBottom: 30 },
  card: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl, padding: SPACING.base, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row' },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: 6 },
  input: { backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, height: 48, paddingHorizontal: 14, color: COLORS.textPrimary, fontSize: 14 },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  saveBtn: { marginTop: 16, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  saveBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
