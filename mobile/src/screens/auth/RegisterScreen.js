import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../theme';
import useAuthStore from '../../store/authStore';

export default function RegisterScreen({ navigation }) {
  const [step, setStep]   = useState(1); // 1 = personal, 2 = shop
  const [form, setForm]   = useState({
    name: '', email: '', password: '', confirmPassword: '',
    shop_name: '', excel_file_name: '',
  });
  const [loading, setLoading] = useState(false);
  const register = useAuthStore(s => s.register);

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const goStep2 = () => {
    if (!form.name || !form.email || !form.password) {
      return Alert.alert('Missing Fields', 'Fill all required fields');
    }
    if (form.password !== form.confirmPassword) {
      return Alert.alert('Password Mismatch', 'Passwords do not match');
    }
    if (form.password.length < 6) {
      return Alert.alert('Weak Password', 'Password must be at least 6 characters');
    }
    setStep(2);
  };

  const handleRegister = async () => {
    if (!form.shop_name) {
      return Alert.alert('Shop Name Required', 'Enter your shop name');
    }
    setLoading(true);
    try {
      const res = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        shop_name: form.shop_name,
        excel_file_name: form.excel_file_name || form.shop_name.replace(/\s+/g, '_'),
      });
      // Show shop ID to user
      Alert.alert(
        '🎉 Shop Created!',
        `Your Shop ID is:\n\n${res.shop.id}\n\nSave this! Workers need it to log in.`,
        [{ text: 'Got it!' }]
      );
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.steps}>
              {[1,2].map(i => (
                <View key={i} style={[styles.stepDot, step >= i && styles.stepDotActive]} />
              ))}
            </View>
          </View>

          <View style={styles.titleArea}>
            <Text style={styles.title}>{step === 1 ? 'Your Account' : 'Your Shop'}</Text>
            <Text style={styles.subtitle}>
              {step === 1 ? 'Step 1 of 2 — Personal details' : 'Step 2 of 2 — Shop setup'}
            </Text>
          </View>

          <View style={styles.card}>
            {step === 1 ? (
              <>
                <Field label="FULL NAME" icon="person-outline" value={form.name} onChange={v => update('name', v)} placeholder="John Kamau" />
                <Field label="EMAIL" icon="mail-outline" value={form.email} onChange={v => update('email', v)} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
                <Field label="PASSWORD" icon="lock-closed-outline" value={form.password} onChange={v => update('password', v)} placeholder="Min 6 characters" secure />
                <Field label="CONFIRM PASSWORD" icon="lock-closed-outline" value={form.confirmPassword} onChange={v => update('confirmPassword', v)} placeholder="Re-enter password" secure />

                <TouchableOpacity style={styles.primaryBtn} onPress={goStep2}>
                  <Text style={styles.primaryBtnText}>CONTINUE →</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
                  <Text style={styles.infoText}>
                    A cloud Excel database will be created automatically for your shop.
                  </Text>
                </View>

                <Field label="SHOP NAME" icon="storefront-outline" value={form.shop_name} onChange={v => update('shop_name', v)} placeholder="County Hardware Nairobi" />
                <Field
                  label="EXCEL FILE NAME (optional)"
                  icon="document-outline"
                  value={form.excel_file_name}
                  onChange={v => update('excel_file_name', v)}
                  placeholder="e.g. my_hardware_stock"
                  autoCapitalize="none"
                />
                <Text style={styles.hint}>Leave blank to auto-generate from shop name</Text>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color={COLORS.white} />
                    : <Text style={styles.primaryBtnText}>CREATE MY SHOP 🔨</Text>
                  }
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have a shop? Sign in</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, icon, value, onChange, placeholder, secure, keyboardType, autoCapitalize }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name={icon} size={17} color={COLORS.primary} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secure && !show}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShow(!show)}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={17} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, padding: SPACING.base, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 8 },
  backBtn: { padding: 6 },
  steps: { flexDirection: 'row', gap: 8 },
  stepDot: { width: 28, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  stepDotActive: { backgroundColor: COLORS.primary },
  titleArea: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 20, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  label: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12, height: 50,
  },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 15 },
  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  primaryBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 14, letterSpacing: 1.2 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.infoBg, borderRadius: RADIUS.md,
    padding: 12, marginBottom: 16, gap: 8,
  },
  infoText: { flex: 1, color: COLORS.info, fontSize: 12, lineHeight: 18 },
  hint: { fontSize: 11, color: COLORS.textMuted, marginTop: -8, marginBottom: 14, marginLeft: 4 },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
});
