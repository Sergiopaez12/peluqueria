import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config/api';

const SERVICIOS = ['Corte de cabello', 'Barba', 'Corte + Barba', 'Coloración', 'Tratamiento capilar'];

export default function AgendarScreen({ navigation }) {
  const { token } = useContext(AuthContext);
  const [servicio, setServicio] = useState('');
  
  // Para demo, usamos fecha de mañana
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const fechaStr = manana.toISOString().split('T')[0];
  
  const [hora, setHora] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cargarSlots = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/horarios/slots?fecha=${fechaStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.cerrado) {
        setSlots([]);
        Alert.alert('Cerrado', res.data.mensaje);
      } else {
        setSlots(res.data.slots);
      }
    } catch (e) {
      console.log('Error', e);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    cargarSlots();
  }, []);

  const handleAgendar = async () => {
    if (!servicio || !hora) {
      Alert.alert('Error', 'Seleccioná un servicio y un horario.');
      return;
    }
    setEnviando(true);
    try {
      await axios.post(`${API_URL}/turnos`, { servicio, fecha: fechaStr, hora }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('¡Éxito!', 'Turno agendado correctamente.', [
        { text: 'OK', onPress: () => {
            setServicio(''); setHora(''); cargarSlots();
            navigation.navigate('Mis Turnos');
        }}
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Error al agendar');
    }
    setEnviando(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>1. Elegí tu servicio</Text>
        <View style={styles.grid}>
          {SERVICIOS.map(s => (
            <TouchableOpacity 
              key={s} 
              style={[styles.serviceBtn, servicio === s && styles.serviceBtnActive]}
              onPress={() => setServicio(s)}
            >
              <Text style={[styles.serviceText, servicio === s && styles.serviceTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.title}>2. Horario para mañana ({fechaStr})</Text>
        {loading ? <ActivityIndicator color="#d4af37" /> : (
          <View style={styles.gridSlots}>
            {slots.map(s => (
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
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.btnPrimary, (!servicio || !hora) && { opacity: 0.5 }]} 
          disabled={!servicio || !hora || enviando}
          onPress={handleAgendar}
        >
          {enviando ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>AGENDAR TURNO</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0b10', padding: 20 },
  card: { backgroundColor: '#12141d', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  title: { color: '#f8f9fa', fontSize: 16, fontWeight: 'bold', marginBottom: 16, marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  serviceBtn: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  serviceBtnActive: { borderColor: '#d4af37', backgroundColor: 'rgba(212,175,55,0.1)' },
  serviceText: { color: '#a1a1aa', fontSize: 14 },
  serviceTextActive: { color: '#d4af37', fontWeight: 'bold' },
  gridSlots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  slotBtn: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, width: '31%', alignItems: 'center', borderRadius: 8 },
  slotBtnDisabled: { opacity: 0.3, backgroundColor: 'transparent' },
  slotBtnActive: { borderColor: '#d4af37', backgroundColor: '#d4af37' },
  slotText: { color: '#f8f9fa', fontSize: 14, fontWeight: 'bold' },
  slotTextDisabled: { textDecorationLine: 'line-through' },
  slotTextActive: { color: '#000' },
  btnPrimary: { backgroundColor: '#d4af37', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#000', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
});
