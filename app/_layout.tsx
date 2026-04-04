import 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

import { useCallback } from 'react';
import { View } from 'react-native';
import { Stack, SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/context/auth';
import { ThemeProvider } from '@/theme/ThemeContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans: require('@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf'),
    'PlusJakartaSans-SemiBold': require('@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf'),
  });

  const onReady = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <GestureHandlerRootView style={{ flex: 1 }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <View style={{ flex: 1 }} onLayout={onReady}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
