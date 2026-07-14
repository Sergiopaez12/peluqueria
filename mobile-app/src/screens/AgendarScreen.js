import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Navy } from '../constants/theme';
import { API_URL } from '../config/api';

export default function AgendarScreen({ navigation, route }) {
  const { token } = useContext(AuthContext);
  const params = route.params || {};
  const isReagendar = !!params.reagendarTurnoId;
  const originalTurnoId = params.reagendarTurnoId;

  const [servicios, setServicios] = useState([]);
  const [servicio, setServicio] = useState(params.servicioInicial || '');

  // Estado del Calendario Mensual
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [hora, setHora] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      const res = await axios.get(`${API_URL}/servicios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServicios(res.data);
    } catch (e) {
      console.log('Error cargando servicios', e);
    }
    setLoadingServicios(false);
  };

  const cargarSlots = async (fecha) => {
    if (!fecha) return;
    setLoadingSlots(true);
    try {
      const res = await axios.get(`${API_URL}/horarios/slots?fecha=${fecha}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.cerrado) {
        setSlots([]);
        if (Platform.OS === 'web') window.alert(`Cerrado: ${res.data.mensaje}`);
        else Alert.alert('Cerrado', res.data.mensaje);
      } else {
        setSlots(res.data.slots);
      }
    } catch (e) {
      console.log('Error cargando slots', e);
    }
    setLoadingSlots(false);
  };

  // Cargar slots automáticamente cuando cambia la fecha seleccionada en el calendario
  useEffect(() => {
    if (selectedDate) {
      cargarSlots(selectedDate);
      setHora('');
    }
  }, [selectedDate]);

  // Funciones de ayuda para generar la grilla del calendario mensual
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const diasCortos = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

  const generarGridCalendario = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const celdas = [];
    for (let i = 0; i < firstDay; i++) {
      celdas.push({ empty: true, key: `empty-${i}` });
    }
    for (let d = 1; d <= totalDays; d++) {
      const yyyy = year;
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const isPast = dateStr < todayStr;

      celdas.push({
        empty: false,
        day: d,
        dateStr,
        isPast,
        isSelected: dateStr === selectedDate,
        isToday: dateStr === todayStr,
        key: dateStr
      });
    }
    return celdas;
  };

  const handleAgendar = async () => {
    if (!servicio || !hora) {
      if (Platform.OS === 'web') window.alert('Seleccioná un servicio y un horario.');
      else Alert.alert('Error', 'Seleccioná un servicio y un horario.');
      return;
    }
    setEnviando(true);
    try {
      if (isReagendar) {
        await axios.put(`${API_URL}/turnos/${originalTurnoId}`, {
          servicio,
          fecha: selectedDate,
          hora
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const msj = 'Turno re-agendado correctamente.';
        if (Platform.OS === 'web') window.alert(`¡Éxito! ${msj}`);
        else Alert.alert('¡Éxito!', msj);
        navigation.navigate('Mis Turnos');
      } else {
        await axios.post(`${API_URL}/turnos`, { servicio, fecha: selectedDate, hora }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const msj = 'Turno agendado correctamente.';
        if (Platform.OS === 'web') window.alert(`¡Éxito! ${msj}`);
        else Alert.alert('¡Éxito!', msj);
        setServicio(''); setHora('');
        navigation.navigate('Mis Turnos');
      }
    } catch (err) {
      const msjErr = err.response?.data?.message || 'Error al agendar';
      if (Platform.OS === 'web') window.alert(`Error: ${msjErr}`);
      else Alert.alert('Error', msjErr);
    }
    setEnviando(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.card}>
        <Text style={styles.headerTitle}>{isReagendar ? '🔄 Re-agendar Turno' : '📅 Reservar un Turno'}</Text>
        {isReagendar && (
          <Text style={styles.warningText}>El turno volverá a estado pendiente hasta que sea aprobado por el peluquero.</Text>
        )}

        <Text style={styles.title}>1. Elegí tu servicio</Text>
        {loadingServicios ? <ActivityIndicator color={Navy.accent} /> : (
          <View style={styles.grid}>
            {servicios.map(s => (
              <TouchableOpacity 
                key={s._id} 
                style={[styles.serviceBtn, servicio === s.nombre && styles.serviceBtnActive]}
                onPress={() => setServicio(s.nombre)}
              >
                <Text style={[styles.serviceText, servicio === s.nombre && styles.serviceTextActive]}>
                  {s.nombre}
                </Text>
                <Text style={[styles.servicePrice, servicio === s.nombre && styles.servicePriceActive]}>
                  ${s.precio} • {s.duracionMin} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.title}>2. Seleccioná el día ({selectedDate})</Text>
        
        {/* Calendario Interactivo */}
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={styles.calendarNavBtn}
              onPress={() => {
                const prev = new Date(currentMonth);
                prev.setMonth(prev.getMonth() - 1);
                const hoy = new Date();
                if (prev.getFullYear() >= hoy.getFullYear() && prev.getMonth() >= hoy.getMonth()) {
                  setCurrentMonth(prev);
                }
              }}
            >
              <Text style={styles.calendarNavText}>◄</Text>
            </TouchableOpacity>
            
            <Text style={styles.calendarMonthTitle}>
              {nombresMeses[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>

            <TouchableOpacity
              style={styles.calendarNavBtn}
              onPress={() => {
                const next = new Date(currentMonth);
                next.setMonth(next.getMonth() + 1);
                setCurrentMonth(next);
              }}
            >
              <Text style={styles.calendarNavText}>►</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.daysHeaderRow}>
            {diasCortos.map((dia, index) => (
              <Text key={index} style={styles.dayHeaderText}>{dia}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {generarGridCalendario().map(item => {
              if (item.empty) {
                return <View key={item.key} style={styles.calendarDayEmpty} />;
              }
              return (
                <TouchableOpacity
                  key={item.key}
                  disabled={item.isPast}
                  style={[
                    styles.calendarDayBtn,
                    item.isToday && styles.calendarDayToday,
                    item.isSelected && styles.calendarDaySelected,
                    item.isPast && styles.calendarDayPast
                  ]}
                  onPress={() => setSelectedDate(item.dateStr)}
                >
                  <Text style={[
                    styles.calendarDayText,
                    item.isToday && styles.calendarDayTextToday,
                    item.isSelected && styles.calendarDayTextSelected,
                    item.isPast && styles.calendarDayTextPast
                  ]}>{item.day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.title}>3. Elegí el horario ({selectedDate})</Text>
        {loadingSlots ? <ActivityIndicator color={Navy.accent} /> : (
          <View style={styles.gridSlots}>
            {slots.length === 0 ? (
              <Text style={styles.noSlotsText}>No hay horarios disponibles para esta fecha o la barbería está cerrada.</Text>
            ) : (
              slots.map(s => (
                <TouchableOpacity 
                  key={s.hora} 
                  disabled={!s.disponible}
                  style={[
                    styles.slotBtn, 
                    !s.disponible && styles.slotBtnDisabled,
                    hora === s.hora && styles.slotBtnActive
                  ]}
                  onPress={() => setHora(s.hora)}
                >
                  <Text style={[
                    styles.slotText,
                    !s.disponible && styles.slotTextDisabled,
                    hora === s.hora && styles.slotTextActive
                  ]}>{s.hora}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.btnPrimary, (!servicio || !hora) && { opacity: 0.5 }]} 
          disabled={!servicio || !hora || enviando}
          onPress={handleAgendar}
        >
          {enviando ? <ActivityIndicator color="#060D1F" /> : (
            <Text style={styles.btnText}>{isReagendar ? 'RE-AGENDAR AHORA' : 'AGENDAR TURNO'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Navy.bg, padding: 20 },
  card: {
    backgroundColor: Navy.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Navy.border
  },
  headerTitle: { color: Navy.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  warningText: { color: Navy.warning, fontSize: 13, backgroundColor: Navy.warningBg, padding: 12, borderRadius: 8, marginBottom: 16, textAlign: 'center' },
  title: { color: Navy.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 16, marginTop: 15 },
  
  grid: { flexDirection: 'column', gap: 10, marginBottom: 16 },
  serviceBtn: {
    backgroundColor: Navy.surfaceAlt,
    borderWidth: 1,
    borderColor: Navy.border,
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  serviceBtnActive: { borderColor: Navy.accent, backgroundColor: 'rgba(56,189,248,0.08)' },
  serviceText: { color: Navy.textPrimary, fontSize: 15, fontWeight: '600' },
  serviceTextActive: { color: Navy.accent },
  servicePrice: { color: Navy.textSecondary, fontSize: 13 },
  servicePriceActive: { color: Navy.accent },

  /* Estilos del Calendario Mensual */
  calendarContainer: {
    backgroundColor: Navy.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Navy.border,
    padding: 16,
    marginBottom: 20
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  calendarNavBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderRadius: 6
  },
  calendarNavText: { color: Navy.accent, fontSize: 16, fontWeight: 'bold' },
  calendarMonthTitle: { color: Navy.textPrimary, fontSize: 16, fontWeight: 'bold', textTransform: 'capitalize' },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: 6
  },
  dayHeaderText: { color: Navy.textSecondary, width: '14%', textAlign: 'center', fontWeight: 'bold', fontSize: 13 },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start'
  },
  calendarDayEmpty: { width: '14.28%', height: 40 },
  calendarDayBtn: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2
  },
  calendarDayToday: { borderWidth: 1, borderColor: Navy.accent },
  calendarDaySelected: { backgroundColor: Navy.accent },
  calendarDayPast: { opacity: 0.25 },
  calendarDayText: { color: Navy.textPrimary, fontSize: 14, fontWeight: '500' },
  calendarDayTextToday: { color: Navy.accent, fontWeight: 'bold' },
  calendarDayTextSelected: { color: '#060D1F', fontWeight: 'bold' },
  calendarDayTextPast: { textDecorationLine: 'line-through' },

  gridSlots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  slotBtn: {
    backgroundColor: Navy.surfaceAlt,
    borderWidth: 1,
    borderColor: Navy.border,
    paddingVertical: 10,
    width: '31%',
    alignItems: 'center',
    borderRadius: 8
  },
  slotBtnDisabled: { opacity: 0.15, backgroundColor: 'transparent' },
  slotBtnActive: { borderColor: Navy.accent, backgroundColor: Navy.accent },
  slotText: { color: Navy.textPrimary, fontSize: 14, fontWeight: 'bold' },
  slotTextDisabled: { textDecorationLine: 'line-through' },
  slotTextActive: { color: '#060D1F' },
  noSlotsText: { color: Navy.textSecondary, fontStyle: 'italic', width: '100%', textAlign: 'center', padding: 10 },

  btnPrimary: { backgroundColor: Navy.accent, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#060D1F', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
});
