import { Platform } from 'react-native';

// Si abrimos la app en la Web de tu PC, usa 'localhost' automáticamente (nunca más falla por cambio de IP).
// Si se abre en el celular por Wi-Fi, usa la IP local actual de tu PC (192.168.100.6).
export const API_URL = Platform.OS === 'web'
  ? 'http://localhost:5000/api'
  : 'http://192.168.100.6:5000/api';
