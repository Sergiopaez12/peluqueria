import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Navy } from '../constants/theme';
import { API_URL } from '../config/api';

export default function AdminTurnosScreen() {
  const { token } = useContext(AuthContext);
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // 'todos' | 'pendiente' | 'confirmado' | 'rechazado'

  const isFocused = useIsFocused();

  const cargarTurnos = async () => {
    try {
      const res = await axios.get(`${API_URL}/turnos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTurnos(res.data);
    } catch (e) {
      console.log('Error cargando turnos', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isFocused) {
      cargarTurnos();
    }
  }, [isFocused]);

  const handleCambiarEstado = async (id, nuevoEstado) => {
    try {
      await axios.patch(`${API_URL}/turnos/${id}/estado`, {
        estado: nuevoEstado
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const msj = `Turno ${nuevoEstado === 'confirmado' ? 'confirmado' : 'rechazado'} correctamente.`;
      if (Platform.OS === 'web') window.alert(`¡Éxito! ${msj}`);
      else Alert.alert('¡Éxito!', msj);
      cargarTurnos();
    } catch (e) {
      const msjErr = e.response?.data?.message || 'No se pudo cambiar el estado.';
      if (Platform.OS === 'web') window.alert(`Error: ${msjErr}`);
      else Alert.alert('Error', msjErr);
    }
  };

  const ejecutarEliminarTurno = async (id) => {
    try {
      await axios.delete(`${API_URL}/turnos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Platform.OS === 'web') window.alert('¡Éxito! Turno eliminado.');
      else Alert.alert('¡Éxito!', 'Turno eliminado.');
      cargarTurnos();
    } catch (e) {
      const msjErr = e.response?.data?.message || 'No se pudo eliminar el turno.';
      if (Platform.OS === 'web') window.alert(`Error: ${msjErr}`);
      else Alert.alert('Error', msjErr);
    }
  };

  const handleEliminarTurno = (id) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm('¿Estás seguro de que querés borrar permanentemente este turno?');
      if (ok) ejecutarEliminarTurno(id);
    } else {
      Alert.alert('Eliminar Turno', '¿Estás seguro de que querés borrar permanentemente este turno?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', onPress: () => ejecutarEliminarTurno(id), style: 'destructive' }
      ]);
    }
  };

  const filteredTurnos = turnos.filter(t => {
    if (filtro === 'todos') return true;
    return t.estado === filtro;
  });

  const renderItem = ({ item }) => {
    const isConfirmado = item.estado === 'confirmado';
    const isRechazado = item.estado === 'rechazado';
    const isPendiente = item.estado === 'pendiente';

    // Parse date parts
    const dateParts = item.fecha.split('-');
    const day = dateParts[2] || '';
    const month = dateParts[1] || '';

    // Client name from populated field or fallback
    const nombreCliente = item.usuarioId?.nombre || item.cliente || 'Desconocido';

    return (
      <View style={styles.card}>
        <View style={styles.dateBlock}>
          <Text style={styles.day}>{day}</Text>
          <Text style={styles.month}>{month}</Text>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.clientName}>{nombreCliente}</Text>
          <Text style={styles.service}>{item.servicio}</Text>
          <Text style={styles.time}>🕐 {item.hora} hs</Text>
          
          <View style={[
            styles.badge, 
            isConfirmado ? styles.badgeGreen : isRechazado ? styles.badgeRed : styles.badgeYellow
          ]}>
            <Text style={[
              styles.badgeText, 
              isConfirmado ? styles.badgeTextGreen : isRechazado ? styles.badgeTextRed : styles.badgeTextYellow
            ]}>
              {isConfirmado ? '✅ Confirmado' : isRechazado ? '❌ Rechazado' : '⏳ Pendiente'}
            </Text>
          </View>

          {isPendiente && (
            <View style={styles.adminActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnConfirm]}
                onPress={() => handleCambiarEstado(item._id, 'confirmado')}
              >
                <Text style={styles.actionBtnText}>Confirmar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnReject]}
                onPress={() => handleCambiarEstado(item._id, 'rechazado')}
              >
                <Text style={styles.actionBtnText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.btnDelete} onPress={() => handleEliminarTurno(item._id)}>
          <Text style={styles.btnDeleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['todos', 'pendiente', 'confirmado', 'rechazado'].map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filtro === f && styles.filterPillActive]}
              onPress={() => setFiltro(f)}
            >
              <Text style={[styles.filterText, filtro === f && styles.filterTextActive]}>
                {f === 'todos' ? 'Todos' : f === 'pendiente' ? 'Pendientes' : f === 'confirmado' ? 'Confirmados' : 'Rechazados'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={Navy.accent} size="large" style={{ marginTop: 40 }} />
      ) : filteredTurnos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No hay turnos registrados en este estado.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTurnos}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={cargarTurnos}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Navy.bg },
  filterContainer: { paddingVertical: 12, borderBottomWidth: 1, borderColor: Navy.border },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterPill: {
    backgroundColor: Navy.surfaceAlt,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Navy.border
  },
  filterPillActive: { backgroundColor: Navy.accent, borderColor: Navy.accent },
  filterText: { color: Navy.textSecondary, fontSize: 13, fontWeight: 'bold' },
  filterTextActive: { color: '#060D1F' },
  
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
  dateBlock: {
    backgroundColor: Navy.surfaceAlt,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
    borderWidth: 1,
    borderColor: Navy.border
  },
  day: { color: Navy.accent, fontSize: 24, fontWeight: 'bold' },
  month: { color: Navy.textSecondary, fontSize: 12, textTransform: 'uppercase', marginTop: 4 },
  
  infoBlock: { flex: 1 },
  clientName: { color: Navy.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  service: { color: Navy.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  time: { color: Navy.textMuted, fontSize: 13, marginBottom: 8 },
  
  badge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1, marginBottom: 8 },
  badgeYellow: { backgroundColor: Navy.warningBg, borderColor: 'rgba(251,191,36,0.2)' },
  badgeTextYellow: { color: Navy.warning, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeGreen: { backgroundColor: Navy.successBg, borderColor: 'rgba(16,185,129,0.2)' },
  badgeTextGreen: { color: Navy.success, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeRed: { backgroundColor: Navy.errorBg, borderColor: 'rgba(248,113,113,0.2)' },
  badgeTextRed: { color: Navy.error, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  
  adminActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center', flex: 1 },
  btnConfirm: { backgroundColor: Navy.success },
  btnReject: { backgroundColor: Navy.error },
  actionBtnText: { color: '#060D1F', fontSize: 12, fontWeight: 'bold' },
  
  btnDelete: { padding: 8, marginLeft: 8 },
  btnDeleteText: { fontSize: 18 },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 64, opacity: 0.5 },
  emptyText: { color: Navy.textSecondary, fontSize: 16, marginTop: 16 }
});
