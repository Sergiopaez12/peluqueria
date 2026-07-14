import React, { useContext, useEffect } from 'react';
import { Text, Platform } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';
import { Navy } from '../constants/theme';

// Common Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PerfilScreen from '../screens/PerfilScreen';

// Client Screens
import TurnosScreen from '../screens/TurnosScreen';
import AgendarScreen from '../screens/AgendarScreen';
import ResenasScreen from '../screens/ResenasScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminTurnosScreen from '../screens/AdminTurnosScreen';
import AdminCalendarioScreen from '../screens/AdminCalendarioScreen';
import AdminAjustesScreen from '../screens/AdminAjustesScreen';
import AdminServiciosScreen from '../screens/AdminServiciosScreen';
import AdminHorariosScreen from '../screens/AdminHorariosScreen';
import AdminClientesScreen from '../screens/AdminClientesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ClientTurnosStack = createNativeStackNavigator();
const AdminSettingsStack = createNativeStackNavigator();

const CustomTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Navy.bg,
    card: Navy.surface,
    text: Navy.textPrimary,
    border: Navy.border,
    primary: Navy.accent,
  },
};

// Client Stack for "Mis Turnos" to support review submission
function ClientTurnosStackNavigator() {
  return (
    <ClientTurnosStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientTurnosStack.Screen name="TurnosHome" component={TurnosScreen} />
      <ClientTurnosStack.Screen name="Reseñas" component={ResenasScreen} />
    </ClientTurnosStack.Navigator>
  );
}

// Admin Stack for settings menu navigation
function AdminSettingsStackNavigator() {
  return (
    <AdminSettingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Navy.surface },
        headerTintColor: Navy.accent,
        headerTitleStyle: { fontWeight: 'bold', color: Navy.textPrimary },
        headerShadowVisible: false
      }}
    >
      <AdminSettingsStack.Screen name="AjustesHome" component={AdminAjustesScreen} options={{ title: 'Ajustes' }} />
      <AdminSettingsStack.Screen name="AdminServicios" component={AdminServiciosScreen} options={{ title: 'Servicios y Precios' }} />
      <AdminSettingsStack.Screen name="AdminHorarios" component={AdminHorariosScreen} options={{ title: 'Horarios de Atención' }} />
      <AdminSettingsStack.Screen name="AdminClientes" component={AdminClientesScreen} options={{ title: 'Clientes' }} />
      <AdminSettingsStack.Screen name="AdminPerfil" component={PerfilScreen} options={{ title: 'Mi Perfil' }} />
    </AdminSettingsStack.Navigator>
  );
}

// Client Tab Navigation
function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Navy.surface, borderBottomWidth: 1, borderBottomColor: Navy.border },
        headerTitleStyle: { fontWeight: 'bold', color: Navy.textPrimary },
        tabBarStyle: { backgroundColor: Navy.surface, borderTopWidth: 1, borderTopColor: Navy.border, paddingBottom: 5, paddingTop: 5, height: 60 },
        tabBarActiveTintColor: Navy.accent,
        tabBarInactiveTintColor: Navy.textSecondary,
        headerTintColor: Navy.accent
      }}
    >
      <Tab.Screen 
        name="Mis Turnos" 
        component={ClientTurnosStackNavigator} 
        options={{ tabBarIcon: () => <Text style={{fontSize: 20}}>🗓️</Text> }} 
      />
      <Tab.Screen 
        name="Agendar" 
        component={AgendarScreen} 
        options={{ tabBarIcon: () => <Text style={{fontSize: 20}}>➕</Text> }} 
      />
      <Tab.Screen 
        name="Reseñas de Clientes" 
        component={ResenasScreen} 
        options={{ tabBarIcon: () => <Text style={{fontSize: 20}}>⭐</Text>, title: 'Reseñas' }} 
      />
      <Tab.Screen 
        name="Mi Perfil" 
        component={PerfilScreen} 
        options={{ tabBarIcon: () => <Text style={{fontSize: 20}}>👤</Text> }} 
      />
    </Tab.Navigator>
  );
}

// Admin Tab Navigation
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Navy.surface, borderBottomWidth: 1, borderBottomColor: Navy.border },
        headerTitleStyle: { fontWeight: 'bold', color: Navy.textPrimary },
        tabBarStyle: { backgroundColor: Navy.surface, borderTopWidth: 1, borderTopColor: Navy.border, paddingBottom: 5, paddingTop: 5, height: 60 },
        tabBarActiveTintColor: Navy.accent,
        tabBarInactiveTintColor: Navy.textSecondary,
        headerTintColor: Navy.accent
      }}
    >
      <Tab.Screen 
        name="Métricas" 
        component={AdminDashboardScreen} 
        options={{ tabBarIcon: () => <Text style={{fontSize: 20}}>📊</Text> }} 
      />
      <Tab.Screen 
        name="Turnos" 
        component={AdminTurnosScreen} 
        options={{ tabBarIcon: () => <Text style={{fontSize: 20}}>📥</Text> }} 
      />
      <Tab.Screen 
        name="Agenda" 
        component={AdminCalendarioScreen} 
        options={{ tabBarIcon: () => <Text style={{fontSize: 20}}>📅</Text> }} 
      />
      <Tab.Screen 
        name="Ajustes" 
        component={AdminSettingsStackNavigator} 
        options={{ tabBarIcon: () => <Text style={{fontSize: 20}}>⚙️</Text>, headerShown: false }} 
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, usuario, loading, logout } = useContext(AuthContext);

  useEffect(() => {
    if (Platform.OS === 'web' && token != null) {
      // Agregamos un punto en el historial al iniciar sesión
      window.history.pushState({ loggedIn: true }, '');

      const handlePopState = () => {
        // Al tocar la flecha hacia atrás de Google/Chrome, cerramos sesión
        logout();
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [token, logout]);

  if (loading) {
    return null;
  }

  const isAdmin = usuario?.rol === 'admin';

  return (
    <NavigationContainer theme={CustomTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token == null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <Stack.Screen name="Main" component={isAdmin ? AdminTabs : ClientTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
