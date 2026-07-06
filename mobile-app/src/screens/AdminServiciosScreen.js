import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Switch, Alert, ActivityIndicator, Modal } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Navy } from '../constants/theme';
import { API_URL } from '../config/api';

export default function AdminServiciosScreen() {
  const { token } = useContext(AuthContext);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [duracionMin, setDuracionMin] = useState('30');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const isFocused = useIsFocused();

  const cargarServicios = async () => {
    try {
      const res = await axios.get(`${API_URL}/servicios/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServicios(res.data);
    } catch (e) {
      console.log('Error cargando todos los servicios', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isFocused) {
      cargarServicios();
    }
  }, [isFocused]);

  const abrirFormulario = (s = null) => {
    if (s) {
      setEditingId(s._id);
      setNombre(s.nombre);
      setPrecio(s.precio.toString());
      setDuracionMin(s.duracionMin.toString());
      setDescripcion(s.descripcion || '');
      setActivo(s.activo);
    } else {
      setEditingId(null);
      setNombre('');
      setPrecio('');
      setDuracionMin('30');
      setDescripcion('');
      setActivo(true);
    }
    setModalVisible(true);
  };

  const handleGuardarServicio = async () => {
    if (!nombre || !precio || !duracionMin) {
      Alert.alert('Error', 'Completá los campos obligatorios (nombre, precio, duración).');
      return;
    }

    setGuardando(true);
    try {
      const data = {
        nombre,
        precio: parseFloat(precio),
        duracionMin: parseInt(duracionMin),
        descripcion,
        activo
      };

      if (editingId) {
        await axios.put(`${API_URL}/servicios/${editingId}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('¡Éxito!', 'Servicio actualizado.');
      } else {
        await axios.post(`${API_URL}/servicios`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('¡Éxito!', 'Servicio creado.');
      }
      setModalVisible(false);
      cargarServicios();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'No se pudo guardar el servicio.');
    }
    setGuardando(false);
  };

  const handleEliminarServicio = (id, nombre) => {
    Alert.alert('Eliminar Servicio', `¿Estás seguro de que querés eliminar permanentemente el servicio "${nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', onPress: async () => {
        try {
          await axios.delete(`${API_URL}/servicios/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          Alert.alert('¡Éxito!', 'Servicio eliminado.');
          cargarServicios();
        } catch (e) {
          Alert.alert('Error', 'No se pudo eliminar el servicio.');
        }
      }, style: 'destructive' }
    ]);
  };

  const renderItem = ({ item }) => {
    return (
      <View style={[styles.card, !item.activo && { opacity: 0.5 }]}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.nombre}</Text>
          <Text style={styles.cardMeta}>${item.precio} • {item.duracionMin} minutos</Text>
          {item.descripcion ? (
            <Text style={styles.cardDesc}>{item.descripcion}</Text>
          ) : null}
          <View style={styles.statusBadgeRow}>
            <View style={[styles.statusBadge, item.activo ? styles.statusActive : styles.statusInactive]}>
              <Text style={[styles.statusText, item.activo ? styles.statusTextActive : styles.statusTextInactive]}>
                {item.activo ? 'Activo' : 'Pausado'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.btnIcon} onPress={() => abrirFormulario(item)}>
            <Text style={styles.btnIconText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnIcon} onPress={() => handleEliminarServicio(item._id, item.nombre)}>
            <Text style={styles.btnIconText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color={Navy.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={servicios}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={() => (
            <TouchableOpacity style={styles.btnAgregar} onPress={() => abrirFormulario()}>
              <Text style={styles.btnAgregarText}>＋ NUEVO SERVICIO</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal de CRUD */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Editar Servicio' : 'Nuevo Servicio'}</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre del Servicio *</Text>
              <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej: Corte Degradé"
                placeholderTextColor="#4e6585"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Precio ($) *</Text>
                <TextInput
                  style={styles.input}
                  value={precio}
                  onChangeText={setPrecio}
                  placeholder="Ej: 1500"
                  placeholderTextColor="#4e6585"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Duración (min) *</Text>
                <TextInput
                  style={styles.input}
                  value={duracionMin}
                  onChangeText={setDuracionMin}
                  placeholder="Ej: 30"
                  placeholderTextColor="#4e6585"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Breve descripción del servicio..."
                placeholderTextColor="#4e6585"
                multiline
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Servicio Activo</Text>
              <Switch
                value={activo}
                onValueChange={setActivo}
                trackColor={{ false: '#3D5A80', true: Navy.borderAccent }}
                thumbColor={activo ? Navy.accent : '#7A9CC6'}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.btnCancelar]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.btnGuardar]} 
                onPress={handleGuardarServicio}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator color="#060D1F" />
                ) : (
                  <Text style={styles.btnGuardarText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Navy.bg },
  list: { padding: 20, paddingBottom: 40 },
  
  btnAgregar: {
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderWidth: 1,
    borderColor: Navy.accent,
    borderStyle: 'dashed',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20
  },
  btnAgregarText: { color: Navy.accent, fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
  
  card: {
    backgroundColor: Navy.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Navy.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  cardInfo: { flex: 1 },
  cardName: { color: Navy.textPrimary, fontSize: 16, fontWeight: 'bold' },
  cardMeta: { color: Navy.accent, fontSize: 13, fontWeight: '600', marginTop: 4 },
  cardDesc: { color: Navy.textSecondary, fontSize: 13, marginTop: 6, lineHeight: 18 },
  
  statusBadgeRow: { flexDirection: 'row', marginTop: 8 },
  statusBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1 },
  statusActive: { backgroundColor: Navy.successBg, borderColor: 'rgba(16,185,129,0.2)' },
  statusInactive: { backgroundColor: Navy.errorBg, borderColor: 'rgba(248,113,113,0.2)' },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  statusTextActive: { color: Navy.success },
  statusTextInactive: { color: Navy.error },

  cardActions: { flexDirection: 'row', gap: 12 },
  btnIcon: { padding: 8, backgroundColor: Navy.surfaceAlt, borderRadius: 8, borderWidth: 1, borderColor: Navy.border },
  btnIconText: { fontSize: 16 },

  // Modal Styles
  modalBg: { flex: 1, backgroundColor: 'rgba(6,13,31,0.85)', justifyContent: 'center', padding: 24 },
  modalContent: {
    backgroundColor: Navy.surface,
    borderWidth: 1,
    borderColor: Navy.borderAccent,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10
  },
  modalTitle: { color: Navy.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  
  formGroup: { marginBottom: 15 },
  formRow: { flexDirection: 'row', gap: 15 },
  label: { color: Navy.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 },
  input: {
    backgroundColor: Navy.surfaceAlt,
    borderWidth: 1,
    borderColor: Navy.border,
    borderRadius: 8,
    padding: 12,
    color: Navy.textPrimary,
    fontSize: 14
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
  switchLabel: { color: Navy.textPrimary, fontSize: 14, fontWeight: '600' },
  
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 15 },
  modalBtn: { padding: 14, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnCancelar: { borderWidth: 1, borderColor: Navy.border },
  btnCancelarText: { color: Navy.textSecondary, fontWeight: 'bold' },
  btnGuardar: { backgroundColor: Navy.accent },
  btnGuardarText: { color: '#060D1F', fontWeight: 'bold' }
});
