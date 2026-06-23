import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode'; // Importación correcta
import axios from 'axios';
import { API_URL } from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarSesion();
  }, []);

  const cargarSesion = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('barber_token');
      const storedUser = await AsyncStorage.getItem('barber_usuario');

      if (storedToken && storedUser) {
        const decoded = jwtDecode(storedToken);
        if (decoded.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setUsuario(JSON.parse(storedUser));
        } else {
          logout();
        }
      }
    } catch (e) {
      console.log('Error cargando sesión', e);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, usuario } = res.data;
      await AsyncStorage.setItem('barber_token', token);
      await AsyncStorage.setItem('barber_usuario', JSON.stringify(usuario));
      setToken(token);
      setUsuario(usuario);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al iniciar sesión' };
    }
  };

  const register = async (nombre, email, password) => {
    try {
      await axios.post(`${API_URL}/auth/register`, { nombre, email, password, rol: 'cliente' });
      return await login(email, password);
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al registrarse' };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('barber_token');
    await AsyncStorage.removeItem('barber_usuario');
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ token, usuario, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
