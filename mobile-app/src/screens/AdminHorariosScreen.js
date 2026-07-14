import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Navy } from '../constants/theme';
import { API_URL } from '../config/api';

const DIAS_NOMBRES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function AdminHorariosScreen() {
  const { token } = useContext(AuthContext);
  const [config, setConfig] = useState([]);
  const [bloqueados, setBloqueados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Blocked day form states
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevoMotivo, setNuevoMotivo] = useState('');
  const [bloqueando, setBloqueando] = useState(false);

  const isFocused = useIsFocused();

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resConfig = await axios.get(`${API_URL}/horarios/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(resConfig.data);

      const resBloqueados = await axios.get(`${API_URL}/horarios/bloqueados`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBloqueados(resBloqueados.data);
    } catch (e) {
      console.log('Error cargando configuración', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isFocused) {
      cargarDatos();
    }
  }, [isFocused]);

  const handleToggleDia = (diaSemana) => {
    setConfig(prev => prev.map(item => {
      if (item.diaSemana === diaSemana) {
        return { ...item, activo: !item.activo };
      }
      return item;
    }));
  };

  const handleTimeChange = (diaSemana, field, value) => {
    setConfig(prev => prev.map(item => {
      if (item.diaSemana === diaSemana) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleGuardarConfig = async () => {
    // Validate times (simple length/format check)
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const h of config) {
      if (h.activo) {
        if (!timeRegex.test(h.horaInicio) || !timeRegex.test(h.horaFin)) {
          Alert.alert('Error', `Horario inválido en el día ${DIAS_NOMBRES[h.diaSemana]}. Usar formato HH:MM (ej: 09:00).`);
          return;
        }
      }
    }

    setGuardando(true);
    try {
      await axios.put(`${API_URL}/horarios/config`, config, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('¡Éxito!', 'Configuración de horarios guardada.');
      cargarDatos();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la configuración.');
    }
    setGuardando(false);
  };

  const handleBloquearDia = async () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(nuevaFecha)) {
      Alert.alert('Error', 'La fecha debe tener formato YYYY-MM-DD (ej: 2026-12-25).');
      return;
    }

    setBloqueando(true);
    try {
      await axios.post(`${API_URL}/horarios/bloqueados`, {
        fecha: nuevaFecha,
        motivo: nuevoMotivo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('¡Éxito!', `El día ${nuevaFecha} ha sido bloqueado.`);
      setNuevaFecha('');
      setNuevoMotivo('');
      cargarDatos();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo bloquear el día.');
    }
    setBloqueando(false);
  };

  const ejecutarDesbloquearDia = async (id) => {
    try {
      await axios.delete(`${API_URL}/horarios/bloqueados/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Platform.OS === 'web') window.alert('¡Éxito! Día habilitado nuevamente.');
      else Alert.alert('¡Éxito!', 'Día habilitado nuevamente.');
      cargarDatos();
    } catch (e) {
      if (Platform.OS === 'web') window.alert('Error: No se pudo habilitar el día.');
      else Alert.alert('Error', 'No se pudo habilitar el día.');
    }
  };

  const handleDesbloquearDia = (id, fecha) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm(`¿Querés volver a habilitar el día ${fecha}?`);
      if (ok) ejecutarDesbloquearDia(id);
    } else {
      Alert.alert('Desbloquear Día', `¿Querés volver a habilitar el día ${fecha}?`, [
        { text: 'No', style: 'cancel' },
        { text: 'Habilitar', onPress: () => ejecutarDesbloquearDia(id) }
      ]);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Navy.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.sectionTitle}>Agenda Semanal</Text>
      <Text style={styles.sectionSubtitle}>Habilitá los días de atención y sus respectivos horarios:</Text>
      
      {config.map((h) => (
        <View key={h.diaSemana} style={styles.dayCard}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayName}>{DIAS_NOMBRES[h.diaSemana]}</Text>
            <Switch
              value={h.activo}
              onValueChange={() => handleToggleDia(h.diaSemana)}
              trackColor={{ false: '#3D5A80', true: Navy.borderAccent }}
              thumbColor={h.activo ? Navy.accent : '#7A9CC6'}
            />
          </View>

          {h.activo && (
            <View style={styles.timeInputsRow}>
              <View style={styles.timeInputCol}>
                <Text style={styles.timeLabel}>Apertura</Text>
                <TextInput
                  style={styles.timeInput}
                  value={h.horaInicio}
                  onChangeText={(val) => handleTimeChange(h.diaSemana, 'horaInicio', val)}
                  placeholder="09:00"
                  placeholderTextColor="#4e6585"
                  maxLength={5}
                />
              </View>

              <View style={styles.timeInputCol}>
                <Text style={styles.timeLabel}>Cierre</Text>
                <TextInput
                  style={styles.timeInput}
                  value={h.horaFin}
                  onChangeText={(val) => handleTimeChange(h.diaSemana, 'horaFin', val)}
                  placeholder="19:00"
                  placeholderTextColor="#4e6585"
                  maxLength={5}
                />
              </View>
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity 
        style={styles.btnPrimary} 
        onPress={handleGuardarConfig}
        disabled={guardando}
      >
        {guardando ? <ActivityIndicator color="#060D1F" /> : <Text style={styles.btnText}>GUARDAR HORARIOS</Text>}
      </TouchableOpacity>

      {/* Días Bloqueados */}
      <View style={styles.divider} />
      
      <Text style={styles.sectionTitle}>Días Bloqueados (Vacaciones/Feriados)</Text>
      <Text style={styles.sectionSubtitle}>Agregá fechas especiales que deben permanecer cerradas:</Text>

      {/* Formulario Bloqueo */}
      <View style={styles.blockFormCard}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={nuevaFecha}
            onChangeText={setNuevaFecha}
            placeholder="Ej: 2026-12-25"
            placeholderTextColor="#4e6585"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Motivo (Ej: Navidad)</Text>
          <TextInput
            style={styles.input}
            value={nuevoMotivo}
            onChangeText={setNuevoMotivo}
            placeholder="Motivo del cierre..."
            placeholderTextColor="#4e6585"
          />
        </View>

        <TouchableOpacity 
          style={[styles.btnPrimary, { backgroundColor: Navy.error }]} 
          onPress={handleBloquearDia}
          disabled={bloqueando || !nuevaFecha}
        >
          {bloqueando ? <ActivityIndicator color="#060D1F" /> : <Text style={styles.btnText}>BLOQUEAR DÍA</Text>}
        </TouchableOpacity>
      </View>

      {/* Lista Bloqueados */}
      <Text style={styles.listTitle}>Fechas Bloqueadas Activas</Text>
      {bloqueados.length === 0 ? (
        <Text style={styles.emptyText}>No hay días bloqueados actualmente.</Text>
      ) : (
        bloqueados.map((b) => (
          <View key={b._id} style={styles.blockedItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.blockedDate}>{b.fecha}</Text>
              <Text style={styles.blockedMotivo}>{b.motivo || 'Feriado / Cerrado'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.btnDesbloquear} 
              onPress={() => handleDesbloquearDia(b._id, b.fecha)}
            >
              <Text style={styles.btnDesbloquearText}>Habilitar</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Navy.bg },
  loading: { flex: 1, backgroundColor: Navy.bg, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  
  sectionTitle: { color: Navy.textPrimary, fontSize: 18, fontWeight: 'bold' },
  sectionSubtitle: { color: Navy.textSecondary, fontSize: 13, marginTop: 4, marginBottom: 20 },
  
  dayCard: {
    backgroundColor: Navy.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Navy.border,
    marginBottom: 12
  },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { color: Navy.textPrimary, fontSize: 16, fontWeight: 'bold' },
  
  timeInputsRow: { flexDirection: 'row', gap: 16, marginTop: 15, borderTopWidth: 1, borderColor: Navy.border, paddingTop: 15 },
  timeInputCol: { flex: 1 },
  timeLabel: { color: Navy.textSecondary, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 },
  timeInput: {
    backgroundColor: Navy.surfaceAlt,
    borderWidth: 1,
    borderColor: Navy.border,
    borderRadius: 8,
    padding: 10,
    color: Navy.textPrimary,
    fontSize: 14,
    textAlign: 'center'
  },
  
  btnPrimary: { backgroundColor: Navy.accent, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  btnText: { color: '#060D1F', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
  
  divider: { height: 1, backgroundColor: Navy.border, marginVertical: 30 },
  
  blockFormCard: {
    backgroundColor: Navy.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Navy.border,
    marginBottom: 20
  },
  formGroup: { marginBottom: 15 },
  label: { color: Navy.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8 },
  input: {
    backgroundColor: Navy.surfaceAlt,
    borderWidth: 1,
    borderColor: Navy.border,
    borderRadius: 8,
    padding: 12,
    color: Navy.textPrimary,
    fontSize: 14
  },
  
  listTitle: { color: Navy.textPrimary, fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  emptyText: { color: Navy.textMuted, fontStyle: 'italic', paddingVertical: 10 },
  blockedItem: {
    backgroundColor: Navy.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Navy.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  blockedDate: { color: Navy.accent, fontSize: 15, fontWeight: 'bold' },
  blockedMotivo: { color: Navy.textSecondary, fontSize: 13, marginTop: 2 },
  btnDesbloquear: {
    borderWidth: 1,
    borderColor: Navy.accent,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6
  },
  btnDesbloquearText: { color: Navy.accent, fontSize: 12, fontWeight: 'bold' }
});
