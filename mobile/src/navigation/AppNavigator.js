import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import { COLORS, FONTS } from '../theme';
import useAuthStore from '../store/authStore';
import useSalesStore from '../store/salesStore';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ShopSetupScreen from '../screens/auth/ShopSetupScreen';

// Main Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import ProductDetailScreen from '../screens/inventory/ProductDetailScreen';
import AddEditProductScreen from '../screens/inventory/AddEditProductScreen';
import POSScreen from '../screens/sales/POSScreen';
import CartScreen from '../screens/sales/CartScreen';
import ReceiptScreen from '../screens/receipts/ReceiptScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';
import UsersScreen from '../screens/settings/UsersScreen';
import SalesHistoryScreen from '../screens/sales/SalesHistoryScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: COLORS.bgCard, elevation: 0, shadowOpacity: 0 },
  headerTintColor: COLORS.textPrimary,
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
  cardStyle: { backgroundColor: COLORS.bg },
};

function InventoryStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="InventoryList" component={InventoryScreen} options={{ title: 'Inventory' }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Detail' }} />
      <Stack.Screen name="AddEditProduct" component={AddEditProductScreen}
        options={({ route }) => ({ title: route.params?.product ? 'Edit Product' : 'Add Product' })} />
    </Stack.Navigator>
  );
}

function SalesStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="POS" component={POSScreen} options={{ title: 'Point of Sale' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart & Checkout' }} />
      <Stack.Screen name="Receipt" component={ReceiptScreen} options={{ title: 'Receipt', headerLeft: null }} />
      <Stack.Screen name="SalesHistory" component={SalesHistoryScreen} options={{ title: 'Sales History' }} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Users" component={UsersScreen} options={{ title: 'Manage Team' }} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Subscription' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const cartCount = useSalesStore(s => s.getItemCount());

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bgCard,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Dashboard: focused ? 'grid' : 'grid-outline',
            Inventory: focused ? 'cube' : 'cube-outline',
            Sales:     focused ? 'cart' : 'cart-outline',
            Reports:   focused ? 'bar-chart' : 'bar-chart-outline',
            Settings:  focused ? 'settings' : 'settings-outline',
          };
          return (
            <View>
              <Ionicons name={icons[route.name]} size={22} color={color} />
              {route.name === 'Sales' && cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Inventory" component={InventoryStack} />
      <Tab.Screen name="Sales"     component={SalesStack} />
      <Tab.Screen name="Reports"   component={ReportsScreen} />
      <Tab.Screen name="Settings"  component={SettingsStack} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: COLORS.bg } }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ShopSetup" component={ShopSetupScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
  },
});
