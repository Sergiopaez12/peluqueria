import React, { useContext } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TurnosScreen from '../screens/TurnosScreen';
import AgendarScreen from '../screens/AgendarScreen';
import PerfilScreen from '../screens/PerfilScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CustomTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0a0b10',
    card: '#12141d',
    text: '#f8f9fa',
    border: 'rgba(255,255,255,0.05)',
    primary: '#d4af37',
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#12141d', borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.2)' },
        headerTitleStyle: { fontWeight: 'bold', color: '#f8f9fa' },
        tabBarStyle: { backgroundColor: '#12141d', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingBottom: 5, paddingTop: 5, height: 60 },
        tabBarActiveTintColor: '#d4af37',
        tabBarInactiveTintColor: '#71717a',
        headerTintColor: '#d4af37'
      }}
    >
      <Tab.Screen name="Mis Turnos" component={TurnosScreen} options={{ tabBarIcon: () => <Text style={{fontSize: 20}}>🗓️</Text> }} />
      <Tab.Screen name="Agendar" component={AgendarScreen} options={{ tabBarIcon: () => <Text style={{fontSize: 20}}>➕</Text> }} />
      <Tab.Screen name="Mi Perfil" component={PerfilScreen} options={{ tabBarIcon: () => <Text style={{fontSize: 20}}>👤</Text> }} />
    </Tab.Navigator>
  );
}

import { Text } from 'react-native';

export default function AppNavigator() {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return null; // Podría ser un Splash Screen
  }

  return (
    <NavigationContainer theme={CustomTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token == null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
