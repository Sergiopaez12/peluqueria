import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Navy } from '../constants/theme';
import { API_URL } from '../config/api';

export default function TurnosScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // 'todos' | 'pendiente' | 'confirmado'
  
  const isFocused = useIsFocused();

  const cargarTurnos = async () => {
    try {
      const res = await axios.get(`${API_URL}/turnos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTurnos(res.data);
    } catch (error) {
      console.log('Error cargando turnos', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isFocused) {
      cargarTurnos();
    }
  }, [isFocused]);

  const handleCancelar = (id) => {
    Alert.alert('Cancelar Turno', '¿Estás seguro que querés cancelar este turno?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', onPress: async () => {
        try {
          const res = await axios.delete(`${API_URL}/turnos/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          Alert.alert('¡Éxito!', res.data.message || 'Turno cancelado.');
          cargarTurnos();
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || 'Error al cancelar');
        }
      }, style: 'destructive' }
    ]);
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

    return (
      <View style={styles.card}>
        <View style={styles.dateBlock}>
          <Text style={styles.day}>{day}</Text>
          <Text style={styles.month}>{month}</Text>
        </View>
        <View style={styles.infoBlock}>
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

          <View style={styles.actionsContainer}>
            {isConfirmado && (
              <TouchableOpacity
                style={styles.actionBtnSmall}
                onPress={() => navigation.navigate('Reseñas', { turnoId: item._id, servicio: item.servicio })}
              >
                <Text style={styles.actionBtnSmallText}>⭐ Calificar</Text>
              </TouchableOpacity>
            )}

            {(isConfirmado || isPendiente) && (
              <TouchableOpacity
                style={[styles.actionBtnSmall, { borderColor: Navy.accent }]}
                onPress={() => navigation.navigate('Agendar', { reagendarTurnoId: item._id, servicioInicial: item.servicio })}
              >
                <Text style={[styles.actionBtnSmallText, { color: Navy.accent }]}>🔄 Re-agendar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {!isRechazado && (
          <TouchableOpacity style={styles.btnCancel} onPress={() => handleCancelar(item._id)}>
            <Text style={styles.btnCancelText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.filterBar}>
        {['todos', 'pendiente', 'confirmado'].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, filtro === f && styles.filterPillActive]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filterText, filtro === f && styles.filterTextActive]}>
              {f === 'todos' ? 'Todos' : f === 'pendiente' ? 'Pendientes' : 'Confirmados'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={Navy.accent} size="large" style={{ marginTop: 40 }} />
      ) : filteredTurnos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No hay turnos para mostrar.</Text>
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
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    paddingHorizontal: 20
  },
  filterPill: {
    backgroundColor: Navy.surfaceAlt,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Navy.border
  },
  filterPillActive: {
    backgroundColor: Navy.accent,
    borderColor: Navy.accent
  },
  filterText: {
    color: Navy.textSecondary,
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'capitalize'
  },
  filterTextActive: {
    color: '#060D1F'
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
    borderLeftWidth: 3,
    borderLeftColor: Navy.accent,
    alignItems: 'center'
  },
  dateBlock: {
    backgroundColor: Navy.surfaceAlt,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  day: { color: Navy.accent, fontSize: 24, fontWeight: 'bold' },
  month: { color: Navy.textSecondary, fontSize: 12, textTransform: 'uppercase', marginTop: 4 },
  infoBlock: { flex: 1 },
  service: { color: Navy.textPrimary, fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  time: { color: Navy.textSecondary, fontSize: 14, marginBottom: 8 },
  badge: {
    alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1
  },
  badgeYellow: { backgroundColor: Navy.warningBg, borderColor: 'rgba(251,191,36,0.2)' },
  badgeTextYellow: { color: Navy.warning, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeGreen: { backgroundColor: Navy.successBg, borderColor: 'rgba(16,185,129,0.2)' },
  badgeTextGreen: { color: Navy.success, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeRed: { backgroundColor: Navy.errorBg, borderColor: 'rgba(248,113,113,0.2)' },
  badgeTextRed: { color: Navy.error, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  
  actionsContainer: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtnSmall: {
    borderWidth: 1,
    borderColor: Navy.success,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'transparent'
  },
  actionBtnSmallText: { color: Navy.success, fontSize: 12, fontWeight: 'bold' },

  btnCancel: {
    padding: 8,
  },
  btnCancelText: { color: Navy.error, fontSize: 18, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 64, opacity: 0.5 },
  emptyText: { color: Navy.textSecondary, fontSize: 16, marginTop: 16 }
});
