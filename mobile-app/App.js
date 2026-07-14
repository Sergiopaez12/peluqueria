import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        /* Reducir escala general ligeramente (92%) para una lectura cómoda y proporcionada en PC */
        body, html, #root {
          zoom: 0.92;
          background-color: #060D1F;
        }
        /* Limitar el ancho en monitores ultra anchos */
        @media (min-width: 1024px) {
          #root > div {
            max-width: 1350px !important;
            margin: 0 auto !important;
            box-shadow: 0 0 50px rgba(0, 0, 0, 0.7);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
