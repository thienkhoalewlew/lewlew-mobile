import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Slot, SplashScreen } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { ErrorBoundary } from "./error-boundary";
import { NotificationProvider } from "../providers/NotificationProvider";
import { useAuthStore } from "../store/authStore";
import { colors } from "../constants/colors";
import { LanguageProvider } from "../i18n";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  const { isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    // Initialize auth state
    initialize();
  }, []);

  useEffect(() => {
    if (loaded && isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isInitialized]);

  if (!loaded || !isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <NotificationProvider>
          <Slot />
        </NotificationProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}