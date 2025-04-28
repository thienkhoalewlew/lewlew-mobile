import React from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { colors } from '../constants/colors';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  
  // Use a simple conditional render instead of useEffect for initial navigation
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
      {isAuthenticated ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />}
    </View>
  );
}