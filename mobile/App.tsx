import React, { useEffect, useState } from 'react';
import { Linking, Platform, View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { OfflineProvider } from './src/contexts/OfflineContext';
import { SignInScreen } from './src/screens/auth/SignInScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { TodayScreen } from './src/screens/today/TodayScreen';
import { CheckInScreen } from './src/screens/today/CheckInScreen';
import { CoachScreen } from './src/screens/coach/CoachScreen';
import { CommunityScreen } from './src/screens/community/CommunityScreen';
import { ProgressScreen } from './src/screens/progress/ProgressScreen';
import { apiFetch } from './src/lib/apiFetch';
import { API_BASE, Endpoints } from './src/constants/api';
import { Colors } from './src/constants/colors';

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.cream,
    card: Colors.white,
    text: Colors.ink,
    primary: Colors.orange,
    border: Colors.border,
  },
};

function TodayStack() {
  const [screen, setScreen] = useState<'today' | 'checkin'>('today');
  if (screen === 'checkin') {
    return (
      <CheckInScreen
        onDone={() => setScreen('today')}
        onBack={() => setScreen('today')}
      />
    );
  }
  return (
    <TodayScreen
      onGoCheckIn={() => setScreen('checkin')}
      onGoHabits={() => Linking.openURL(`${API_BASE}/recovery/dashboard`)}
    />
  );
}

async function registerPushToken() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    await apiFetch(Endpoints.pushToken, {
      method: 'POST',
      body: JSON.stringify({ token: tokenData.data, platform: Platform.OS }),
    });
  } catch {
    // Push is best-effort; never block the app on it.
  }
}

function AuthedApp() {
  useEffect(() => {
    registerPushToken();
  }, []);

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: Colors.orange,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarStyle: {
            backgroundColor: Colors.white,
            borderTopColor: Colors.border,
            height: 64,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarIcon: ({ color, size, focused }) => {
            let name: keyof typeof Ionicons.glyphMap = 'sunny-outline';
            if (route.name === 'Today') name = focused ? 'sunny' : 'sunny-outline';
            if (route.name === 'Coach') name = focused ? 'chatbubbles' : 'chatbubbles-outline';
            if (route.name === 'Community') name = focused ? 'people' : 'people-outline';
            if (route.name === 'Progress') name = focused ? 'trending-up' : 'trending-up-outline';
            return <Ionicons name={name} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="Today"
          component={TodayStack}
          options={{ tabBarAccessibilityLabel: 'Today tab. Daily check-in and reps.' }}
        />
        <Tab.Screen
          name="Coach"
          component={CoachScreen}
          options={{ tabBarAccessibilityLabel: 'Coach tab. Chat with the Sasquatch coach.' }}
        />
        <Tab.Screen
          name="Community"
          component={CommunityScreen}
          options={{ tabBarAccessibilityLabel: 'Community tab. Your accountability pod.' }}
        />
        <Tab.Screen
          name="Progress"
          component={ProgressScreen}
          options={{ tabBarAccessibilityLabel: 'Progress tab. Your recovery arc.' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<'signin' | 'register'>('signin');

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.orange} />
        <Text style={styles.splashText}>Stroke Recovery Academy</Text>
      </View>
    );
  }

  if (!user) {
    if (authScreen === 'register') {
      return <RegisterScreen onGoSignIn={() => setAuthScreen('signin')} />;
    }
    return <SignInScreen onGoRegister={() => setAuthScreen('register')} />;
  }

  return <AuthedApp />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OfflineProvider>
          <StatusBar style="dark" backgroundColor={Colors.cream} />
          <Gate />
        </OfflineProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  splashText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.ink,
  },
});
