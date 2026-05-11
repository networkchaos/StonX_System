// UsersScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../theme';
import { usersAPI, authAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';

export default function UsersScreen({ navigation }) {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: me } = useAuthStore();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data.users);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  const ROLE_COLORS = { owner: COLORS.primary, manager: COLORS.info, staff: COLORS.success };

  return (
    <SafeAreaView style={styles.safe}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => String(u.id)}
          contentContainerStyle={{ padding: SPACING.base, paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{item.name} {item.id === me?.user_id ? '(You)' : ''}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: (ROLE_COLORS[item.role] || COLORS.primary) + '22' }]}>
                <Text style={[styles.roleText, { color: ROLE_COLORS[item.role] || COLORS.primary }]}>
                  {item.role?.toUpperCase()}
                </Text>
              </View>
            </View>
          )}
          ListHeaderComponent={<Text style={styles.heading}>Team Members ({users.length})</Text>}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => Alert.alert('Add Worker', 'Use Settings > Add Worker')}>
        <Ionicons name="person-add" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  userName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  userEmail: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.sm },
  roleText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
});
