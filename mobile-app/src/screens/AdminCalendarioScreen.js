import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Navy } from '../constants/theme';
import { API_URL } from '../config/api';

export default function AdminCalendarioScreen() {
  const { token } = useContext(AuthContext);
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState([]);

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
    // Generate current week dates (Mon to Sun)
    const dates = [];
    const diasNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    const hoy = new Date();
    // Start of week (Monday)
    const currentDay = hoy.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() + distanceToMonday);

    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      dates.push({
        labelDay: d.getDate(),
        labelName: diasNombres[d.getDay()],
        valor: dateStr
      });
    }

    setDaysOfWeek(dates);
    
    // Set default selected date to today (or Monday if today is outside the range, but today is inside the range)
    const todayStr = hoy.toISOString().split('T')[0];
    // Check if today is in the week range
    const isTodayInRange = dates.some(d => d.valor === todayStr);
    setSelectedDate(isTodayInRange ? todayStr : dates[0].valor);

    if (isFocused) {
      cargarTurnos();
    }
  }, [isFocused]);

  // Filter turnos for selected date and sort them by hour
  const turnosDia = turnos
    .filter(t => t.fecha === selectedDate && t.estado !== 'rechazado')
    .sort((a, b) => a.hora.localeCompare(b.hora));

  const renderTimelineItem = ({ item }) => {
    const isConfirmado = item.estado === 'confirmado';
    const nombreCliente = item.usuarioId?.nombre || item.cliente || 'Desconocido';

    return (
      <View style={styles.timelineRow}>
        <Text style={styles.timeLabel}>{item.hora}</Text>
        
        <View style={[
          styles.card, 
          isConfirmado ? styles.cardConfirmado : styles.cardPendiente
        ]}>
          <View style={styles.cardContent}>
            <Text style={styles.clientName}>{nombreCliente}</Text>
            <Text style={styles.serviceName}>{item.servicio}</Text>
          </View>
          <View style={[
            styles.badge, 
            isConfirmado ? styles.badgeGreen : styles.badgeYellow
          ]}>
            <Text style={[
              styles.badgeText, 
              isConfirmado ? styles.badgeTextGreen : styles.badgeTextYellow
            ]}>
              {isConfirmado ? 'Confirmado' : 'Pendiente'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Selector de días de la semana */}
      <View style={styles.calendarHeader}>
        {daysOfWeek.map((day) => {
          const isSelected = selectedDate === day.valor;
          const isHoy = new Date().toISOString().split('T')[0] === day.valor;
          
          return (
            <TouchableOpacity
              key={day.valor}
              style={[
                styles.dayTab,
                isSelected && styles.dayTabSelected,
                isHoy && !isSelected && styles.dayTabHoy
              ]}
              onPress={() => setSelectedDate(day.valor)}
            >
              <Text style={[
                styles.dayNameLabel,
                isSelected && styles.dayNameLabelSelected
              ]}>
                {day.labelName}
              </Text>
              <Text style={[
                styles.dayNumLabel,
                isSelected && styles.dayNumLabelSelected
              ]}>
                {day.labelDay}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lista de Turnos */}
      {loading ? (
        <ActivityIndicator color={Navy.accent} size="large" style={{ marginTop: 40 }} />
      ) : turnosDia.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>No hay turnos agendados para este día.</Text>
        </View>
      ) : (
        <FlatList
          data={turnosDia}
          keyExtractor={(item) => item._id}
          renderItem={renderTimelineItem}
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
  
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: Navy.border,
    backgroundColor: Navy.surface
  },
  dayTab: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 2
  },
  dayTabSelected: {
    backgroundColor: Navy.accent
  },
  dayTabHoy: {
    borderWidth: 1,
    borderColor: Navy.borderAccent
  },
  dayNameLabel: {
    color: Navy.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  dayNameLabelSelected: {
    color: '#060D1F'
  },
  dayNumLabel: {
    color: Navy.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4
  },
  dayNumLabelSelected: {
    color: '#060D1F'
  },

  list: { padding: 20 },
  
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center'
  },
  timeLabel: {
    color: Navy.accent,
    fontSize: 14,
    fontWeight: 'bold',
    width: 60,
    textAlign: 'center'
  },
  card: {
    flex: 1,
    backgroundColor: Navy.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Navy.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cardConfirmado: {
    borderLeftWidth: 3,
    borderLeftColor: Navy.success
  },
  cardPendiente: {
    borderLeftWidth: 3,
    borderLeftColor: Navy.warning
  },
  cardContent: { flex: 1 },
  clientName: { color: Navy.textPrimary, fontSize: 15, fontWeight: 'bold' },
  serviceName: { color: Navy.textSecondary, fontSize: 13, marginTop: 2 },
  
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1 },
  badgeYellow: { backgroundColor: Navy.warningBg, borderColor: 'rgba(251,191,36,0.1)' },
  badgeTextYellow: { color: Navy.warning, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeGreen: { backgroundColor: Navy.successBg, borderColor: 'rgba(16,185,129,0.1)' },
  badgeTextGreen: { color: Navy.success, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 64, opacity: 0.5 },
  emptyText: { color: Navy.textSecondary, fontSize: 16, marginTop: 16 }
});
