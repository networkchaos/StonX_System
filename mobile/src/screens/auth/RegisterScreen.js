import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../theme';
import useAuthStore from '../../store/authStore';
import { API_BASE_URL } from '../../services/api';

export default function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    shop_name: '', excel_file_name: '',
  });
  const [loading, setLoading]   = useState(false);
  const [serverOk, setServerOk] = useState(null); // null=checking true=ok false=down

  const register = useAuthStore(s => s.register);

  useEffect(() => { checkServer(); }, []);

  // ── Server health check ──────────────────────────────────────────────────
  const checkServer = async () => {
    setServerOk(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      console.log('[HEALTH]', data);
      setServerOk(true);
    } catch (err) {
      console.error('[HEALTH FAIL]', err.message);
      setServerOk(false);
    }
  };

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── Step 1 → Step 2 ──────────────────────────────────────────────────────
  const goStep2 = () => {
    if (!form.name.trim())  return Alert.alert('Required', 'Enter your full name');
    if (!form.email.trim()) return Alert.alert('Required', 'Enter your email');
    if (!form.password)     return Alert.alert('Required', 'Enter a password');
    if (form.password.length < 6) return Alert.alert('Too short', 'Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return Alert.alert('Mismatch', 'Passwords do not match');
    setStep(2);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!form.shop_name.trim()) {
      return Alert.alert('Required', 'Enter your shop name');
    }

    if (serverOk === false) {
      Alert.alert(
        '⚠️ Cannot reach server',
        `URL: ${API_BASE_URL}\n\nMake sure:\n• Backend is running (npm run dev)\n• You are using the correct URL in api.js`,
        [
          { text: 'Retry', onPress: checkServer },
          { text: 'Try anyway', onPress: doRegister },
        ]
      );
      return;
    }

    doRegister();
  };

  const doRegister = async () => {
    setLoading(true);
    console.log('[REGISTER] Submitting to', API_BASE_URL);

    try {
      const result = await register({
        name:            form.name.trim(),
        email:           form.email.trim().toLowerCase(),
        password:        form.password,
        shop_name:       form.shop_name.trim(),
        excel_file_name: form.excel_file_name.trim() ||
                         form.shop_name.trim().replace(/\s+/g, '_').toLowerCase(),
      });

      console.log('[REGISTER] ✅ Shop created:', result.shop.id);

      Alert.alert(
        '🎉 Shop Created!',
        `Your Shop ID is:\n\n${result.shop.id}\n\n⚠️ Write this down — workers need it to log in.\n\n30 days free trial starts now.`,
        [{ text: "Let's go!" }]
      );

    } catch (err) {
      console.error('[REGISTER] failed:', err.message);

      let title = 'Registration Failed';
      let msg   = '';

      if (!err.response) {
        title = 'No Server Response';
        msg   = `Could not reach:\n${API_BASE_URL}\n\nCheck that your backend is running with "npm run dev" and the URL in api.js is correct.`;
      } else if (err.response.status === 500) {
        title = 'Server Error (500)';
        msg   = (err.response.data?.error || 'Unknown server error') +
                '\n\nHint: Check that your Supabase keys in .env are correct.';
      } else if (err.response.status === 400) {
        title = 'Bad Request';
        msg   = err.response.data?.error || 'Check all fields and try again.';
      } else {
        msg = err.response?.data?.error || err.message;
      }

      Alert.alert(title, msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Back + step dots */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.steps}>
              {[1, 2].map(i => (
                <View key={i} style={[styles.stepDot, step >= i && styles.stepDotActive]} />
              ))}
            </View>
          </View>

          {/* Server status banner — always visible */}
          <ServerBanner status={serverOk} url={API_BASE_URL} onRetry={checkServer} />

          {/* Title */}
          <View style={styles.titleArea}>
            <Text style={styles.title}>{step === 1 ? 'Your Account' : 'Your Shop'}</Text>
            <Text style={styles.subtitle}>
              {step === 1 ? 'Step 1 of 2 — Personal details' : 'Step 2 of 2 — Shop setup'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.card}>
            {step === 1 ? (
              <>
                <Field label="FULL NAME"        icon="person-outline"      value={form.name}            onChange={v => update('name', v)}            placeholder="John Kamau" />
                <Field label="EMAIL"            icon="mail-outline"        value={form.email}           onChange={v => update('email', v)}           placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" />
                <Field label="PASSWORD"         icon="lock-closed-outline" value={form.password}        onChange={v => update('password', v)}        placeholder="Min 6 characters" secure />
                <Field label="CONFIRM PASSWORD" icon="lock-closed-outline" value={form.confirmPassword} onChange={v => update('confirmPassword', v)} placeholder="Re-enter password" secure />

                <TouchableOpacity style={styles.primaryBtn} onPress={goStep2} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnText}>CONTINUE →</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
                  <Text style={styles.infoText}>
                    A cloud Excel database is created for your shop automatically. Save the Shop ID you'll receive — workers need it to log in.
                  </Text>
                </View>

                <Field label="SHOP NAME *"                icon="storefront-outline" value={form.shop_name}       onChange={v => update('shop_name', v)}       placeholder="County Hardware Nairobi" />
                <Field label="EXCEL FILE NAME (optional)" icon="document-outline"   value={form.excel_file_name} onChange={v => update('excel_file_name', v)} placeholder="e.g. my_hardware_stock" autoCapitalize="none" />
                <Text style={styles.hint}>Leave blank — auto-generated from shop name</Text>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && { opacity: 0.65 }]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                        <ActivityIndicator color={COLORS.white} size="small" />
                        <Text style={styles.primaryBtnText}>Creating shop…</Text>
                      </View>
                    : <Text style={styles.primaryBtnText}>CREATE MY SHOP 🔨</Text>
                  }
                </TouchableOpacity>

                <Text style={styles.debugUrl}>{API_BASE_URL}</Text>
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

// ── Server Banner ──────────────────────────────────────────────────────────────
function ServerBanner({ status, url, onRetry }) {
  if (status === null) {
    return (
      <View style={[bannerS.wrap, { borderColor: COLORS.border }]}>
        <ActivityIndicator size="small" color={COLORS.textMuted} />
        <Text style={[bannerS.text, { color: COLORS.textMuted }]}>Checking server connection…</Text>
      </View>
    );
  }
  if (status === true) {
    return (
      <View style={[bannerS.wrap, { borderColor: COLORS.success + '55', backgroundColor: COLORS.successBg }]}>
        <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
        <Text style={[bannerS.text, { color: COLORS.success }]}>Backend connected ✓</Text>
      </View>
    );
  }
  return (
    <TouchableOpacity
      style={[bannerS.wrap, { borderColor: COLORS.danger + '55', backgroundColor: COLORS.dangerBg }]}
      onPress={onRetry}
    >
      <Ionicons name="wifi-outline" size={16} color={COLORS.danger} />
      <View style={{ flex: 1 }}>
        <Text style={[bannerS.text, { color: COLORS.danger }]}>Backend unreachable — tap to retry</Text>
        <Text style={[bannerS.sub]} numberOfLines={1}>{url}</Text>
      </View>
    </TouchableOpacity>
  );
}

const bannerS = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: RADIUS.md, borderWidth: 1, padding: 10, marginBottom: 14 },
  text: { fontSize: 12, fontWeight: '600', flex: 1 },
  sub:  { fontSize: 10, color: COLORS.danger + '99', marginTop: 2 },
});

// ── Field ──────────────────────────────────────────────────────────────────────
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
          autoCapitalize={autoCapitalize || 'words'}
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
  safe:        { flex: 1, backgroundColor: COLORS.bg },
  scroll:      { flexGrow: 1, padding: SPACING.base, paddingBottom: 40 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  backBtn:     { padding: 6 },
  steps:       { flexDirection: 'row', gap: 8 },
  stepDot:     { width: 28, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  stepDotActive: { backgroundColor: COLORS.primary },
  titleArea:   { marginBottom: 16 },
  title:       { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary },
  subtitle:    { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  card:        { backgroundColor: COLORS.bgCard, borderRadius: 20, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  label:       { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: 6 },
  inputRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgInput, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, height: 50 },
  input:       { flex: 1, color: COLORS.textPrimary, fontSize: 15 },
  primaryBtn:  { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 14, letterSpacing: 1.2 },
  infoBox:     { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.infoBg, borderRadius: RADIUS.md, padding: 12, marginBottom: 16, gap: 8 },
  infoText:    { flex: 1, color: COLORS.info, fontSize: 12, lineHeight: 18 },
  hint:        { fontSize: 11, color: COLORS.textMuted, marginTop: -8, marginBottom: 14, marginLeft: 4 },
  loginLink:   { alignItems: 'center', marginTop: 20 },
  loginLinkText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  debugUrl:    { fontSize: 9, color: COLORS.textMuted, textAlign: 'center', marginTop: 10 },
});