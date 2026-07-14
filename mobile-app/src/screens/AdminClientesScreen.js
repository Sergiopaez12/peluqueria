import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Navy } from '../constants/theme';
import { API_URL } from '../config/api';

export default function AdminClientesScreen() {
  const { token } = useContext(AuthContext);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const isFocused = useIsFocused();

  const cargarClientes = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/clientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientes(res.data);
    } catch (e) {
      console.log('Error cargando clientes', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isFocused) {
      cargarClientes();
    }
  }, [isFocused]);

  const ejecutarEliminarCliente = async (id) => {
    try {
      await axios.delete(`${API_URL}/auth/clientes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Platform.OS === 'web') window.alert('¡Éxito! Cliente eliminado del sistema.');
      else Alert.alert('¡Éxito!', 'Cliente eliminado del sistema.');
      cargarClientes();
    } catch (e) {
      const msjErr = e.response?.data?.message || 'No se pudo eliminar el cliente.';
      if (Platform.OS === 'web') window.alert(`Error: ${msjErr}`);
      else Alert.alert('Error', msjErr);
    }
  };

  const handleEliminarCliente = (id, nombre) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(`¿Estás seguro de que querés eliminar a ${nombre}? Esto borrará también todos sus turnos asociados de forma definitiva.`);
      if (ok) ejecutarEliminarCliente(id);
    } else {
      Alert.alert(
        'Eliminar Cliente',
        `¿Estás seguro de que querés eliminar a ${nombre}? Esto borrará también todos sus turnos asociados de forma definitiva.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar Cliente', onPress: () => ejecutarEliminarCliente(id), style: 'destructive' }
        ]
      );
    }
  };

  const filteredClientes = clientes.filter(c => {
    const query = busqueda.toLowerCase();
    return c.nombre.toLowerCase().includes(query) || c.email.toLowerCase().includes(query);
  });

  const renderItem = ({ item }) => {
    const initials = item.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          <Text style={styles.email}>{item.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.turnosCount || 0} turnos agendados</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.btnDelete} 
          onPress={() => handleEliminarCliente(item._id, item.nombre)}
        >
          <Text style={styles.btnDeleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cliente por nombre o email..."
          placeholderTextColor="#4e6585"
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={Navy.accent} size="large" style={{ marginTop: 40 }} />
      ) : filteredClientes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>No se encontraron clientes.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredClientes}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={cargarClientes}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Navy.bg },
  searchContainer: { padding: 20, borderBottomWidth: 1, borderColor: Navy.border },
  searchInput: {
    backgroundColor: Navy.surfaceAlt,
    borderWidth: 1,
    borderColor: Navy.border,
    borderRadius: 8,
    padding: 12,
    color: Navy.textPrimary,
    fontSize: 14
  },
  list: { padding: 20 },
  card: {
    backgroundColor: Navy.surface,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Navy.border,
    alignItems: 'center'
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Navy.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: Navy.border
  },
  avatarText: { color: Navy.accent, fontSize: 16, fontWeight: 'bold' },
  info: { flex: 1 },
  nombre: { color: Navy.textPrimary, fontSize: 16, fontWeight: 'bold' },
  email: { color: Navy.textSecondary, fontSize: 13, marginTop: 2 },
  badge: {
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderWidth: 1,
    borderColor: Navy.border,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6
  },
  badgeText: { color: Navy.accent, fontSize: 11, fontWeight: '600' },
  btnDelete: { padding: 8, marginLeft: 8 },
  btnDeleteText: { fontSize: 18 },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 64, opacity: 0.5 },
  emptyText: { color: Navy.textSecondary, fontSize: 16, marginTop: 16 }
});
