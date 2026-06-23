import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config/api';

export default function TurnosScreen() {
  const { token } = useContext(AuthContext);
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);

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
    cargarTurnos();
  }, []);

  const handleCancelar = (id) => {
    Alert.alert('Cancelar Turno', '¿Estás seguro que querés cancelar este turno?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', onPress: async () => {
        try {
          await axios.delete(`${API_URL}/turnos/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          cargarTurnos();
        } catch (err) {
          Alert.alert('Error', err.response?.data?.message || 'Error al cancelar');
        }
      }, style: 'destructive' }
    ]);
  };

  const renderItem = ({ item }) => {
    const isConfirmado = item.estado === 'confirmado';
    const isRechazado = item.estado === 'rechazado';
    
    return (
      <View style={styles.card}>
        <View style={styles.dateBlock}>
          <Text style={styles.day}>{item.fecha.split('-')[2]}</Text>
          <Text style={styles.month}>{item.fecha.split('-')[1]}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.service}>{item.servicio}</Text>
          <Text style={styles.time}>🕐 {item.hora} hs</Text>
          <View style={[styles.badge, isConfirmado ? styles.badgeGreen : isRechazado ? styles.badgeRed : styles.badgeYellow]}>
            <Text style={[styles.badgeText, isConfirmado ? styles.badgeTextGreen : isRechazado ? styles.badgeTextRed : styles.badgeTextYellow]}>
              {isConfirmado ? '✅ Confirmado' : isRechazado ? '❌ Rechazado' : '⏳ Pendiente'}
            </Text>
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
      {loading ? (
        <ActivityIndicator color="#d4af37" size="large" style={{ marginTop: 40 }} />
      ) : turnos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Todavía no tenés turnos agendados.</Text>
        </View>
      ) : (
        <FlatList
          data={turnos}
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
  container: { flex: 1, backgroundColor: '#0a0b10' },
  list: { padding: 20 },
  card: {
    backgroundColor: '#12141d',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderLeftWidth: 3,
    borderLeftColor: '#d4af37',
    alignItems: 'center'
  },
  dateBlock: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  day: { color: '#d4af37', fontSize: 24, fontWeight: 'bold' },
  month: { color: '#a1a1aa', fontSize: 12, textTransform: 'uppercase', marginTop: 4 },
  infoBlock: { flex: 1 },
  service: { color: '#f8f9fa', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  time: { color: '#a1a1aa', fontSize: 14, marginBottom: 8 },
  badge: {
    alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1
  },
  badgeYellow: { backgroundColor: 'rgba(212,175,55,0.1)', borderColor: 'rgba(212,175,55,0.2)' },
  badgeTextYellow: { color: '#d4af37', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeGreen: { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)' },
  badgeTextGreen: { color: '#10b981', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeRed: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' },
  badgeTextRed: { color: '#ef4444', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  btnCancel: {
    padding: 8,
  },
  btnCancelText: { color: '#ef4444', fontSize: 18, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 64, opacity: 0.5 },
  emptyText: { color: '#a1a1aa', fontSize: 16, marginTop: 16 }
});
