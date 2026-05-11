import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';

// This screen is shown post-registration if needed for further setup
export default function ShopSetupScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: COLORS.textPrimary, fontSize: 18 }}>Shop Setup</Text>
    </SafeAreaView>
  );
}
