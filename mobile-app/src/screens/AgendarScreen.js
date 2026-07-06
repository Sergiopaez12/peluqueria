import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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
  
  // Date chips generation: Hoy, Mañana, Pasado Mañana, En 3 días
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [dateChips, setDateChips] = useState([]);

  const [hora, setHora] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    // Generate dates
    const chips = [];
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const label = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : `${diasSemana[d.getDay()]} ${d.getDate()}`;
      const valor = d.toISOString().split('T')[0];
      chips.push({ label, valor });
    }
    setDateChips(chips);

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
        // Si el día está cerrado, mostramos el mensaje que viene del backend
        Alert.alert('Cerrado', res.data.mensaje);
      } else {
        setSlots(res.data.slots);
      }
    } catch (e) {
      console.log('Error cargando slots', e);
    }
    setLoadingSlots(false);
  };

  // Cargar slots cuando cambia la fecha seleccionada
  useEffect(() => {
    if (dateChips.length > 0) {
      cargarSlots(dateChips[selectedDateIndex].valor);
      setHora('');
    }
  }, [selectedDateIndex, dateChips]);

  const handleAgendar = async () => {
    if (!servicio || !hora) {
      Alert.alert('Error', 'Seleccioná un servicio y un horario.');
      return;
    }
    const fecha = dateChips[selectedDateIndex].valor;
    setEnviando(true);
    try {
      if (isReagendar) {
        await axios.put(`${API_URL}/turnos/${originalTurnoId}`, {
          servicio,
          fecha,
          hora
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('¡Éxito!', 'Turno re-agendado correctamente.', [
          { text: 'OK', onPress: () => {
              navigation.navigate('Mis Turnos');
          }}
        ]);
      } else {
        await axios.post(`${API_URL}/turnos`, { servicio, fecha, hora }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('¡Éxito!', 'Turno agendado correctamente.', [
          { text: 'OK', onPress: () => {
              setServicio(''); setHora('');
              navigation.navigate('Mis Turnos');
          }}
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Error al agendar');
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

        <Text style={styles.title}>2. Seleccioná el día</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesContainer}>
          {dateChips.map((chip, idx) => (
            <TouchableOpacity
              key={chip.valor}
              style={[styles.dateChip, selectedDateIndex === idx && styles.dateChipActive]}
              onPress={() => setSelectedDateIndex(idx)}
            >
              <Text style={[styles.dateChipText, selectedDateIndex === idx && styles.dateChipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.title}>3. Elegí el horario</Text>
        {loadingSlots ? <ActivityIndicator color={Navy.accent} /> : (
          <View style={styles.gridSlots}>
            {slots.length === 0 ? (
              <Text style={styles.noSlotsText}>No hay horarios disponibles para esta fecha.</Text>
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

  datesContainer: { flexDirection: 'row', marginBottom: 16 },
  dateChip: {
    backgroundColor: Navy.surfaceAlt,
    borderWidth: 1,
    borderColor: Navy.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10
  },
  dateChipActive: { borderColor: Navy.accent, backgroundColor: Navy.accent },
  dateChipText: { color: Navy.textSecondary, fontSize: 14, fontWeight: '600' },
  dateChipTextActive: { color: '#060D1F' },

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
