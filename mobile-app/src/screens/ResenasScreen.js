import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Navy } from '../constants/theme';
import { API_URL } from '../config/api';

export default function ResenasScreen({ route, navigation }) {
  const { token } = useContext(AuthContext);
  const params = route.params || {};
  const initialTurnoId = params.turnoId || null;
  const initialServicio = params.servicio || '';

  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promedio, setPromedio] = useState(0);
  const [misTurnos, setMisTurnos] = useState([]);

  // Form states
  const [turnoId, setTurnoId] = useState(initialTurnoId);
  const [puntuacion, setPuntuacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cargarResenasYTurnos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/resenas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResenas(res.data);
      
      if (res.data.length > 0) {
        const suma = res.data.reduce((acc, curr) => acc + curr.puntuacion, 0);
        setPromedio((suma / res.data.length).toFixed(1));
      } else {
        setPromedio(0);
      }

      // Cargar mis turnos confirmados por si entra a calificar directo desde la barra inferior
      const resTurnos = await axios.get(`${API_URL}/turnos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filtrar turnos confirmados
      const confirmados = resTurnos.data.filter(t => t.estado === 'confirmado' || t.confirmado === true);
      setMisTurnos(confirmados);
    } catch (e) {
      console.log('Error cargando reseñas o turnos', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarResenasYTurnos();
  }, []);

  const handleEnviarResena = async () => {
    if (!turnoId) {
      if (Platform.OS === 'web') window.alert('Error: No se ha seleccionado ningún turno para calificar.');
      else Alert.alert('Error', 'No se ha seleccionado ningún turno para calificar.');
      return;
    }
    setEnviando(true);
    try {
      await axios.post(`${API_URL}/resenas`, {
        turnoId,
        puntuacion,
        comentario
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const msj = 'Tu reseña fue publicada con éxito.';
      if (Platform.OS === 'web') window.alert(`¡Gracias! ${msj}`);
      else Alert.alert('¡Gracias!', msj);
      setComentario('');
      setTurnoId(null);
      cargarResenasYTurnos();
    } catch (error) {
      const msjErr = error.response?.data?.message || 'No se pudo enviar la reseña.';
      if (Platform.OS === 'web') window.alert(`Error: ${msjErr}`);
      else Alert.alert('Error', msjErr);
    }
    setEnviando(false);
  };

  const renderStars = (rating, size = 16, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          disabled={!interactive}
          onPress={() => setPuntuacion(i)}
        >
          <Text style={{ fontSize: size, color: i <= rating ? '#fbbf24' : '#3D5A80', marginRight: 4 }}>
            ★
          </Text>
        </TouchableOpacity>
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  const renderItem = ({ item }) => {
    const nombreUsuario = item.usuarioId?.nombre || 'Cliente';
    const initials = nombreUsuario.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
      <View style={styles.resenaCard}>
        <View style={styles.resenaHeader}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.usuarioNombre}>{nombreUsuario}</Text>
            <Text style={styles.resenaFecha}>{new Date(item.fecha).toLocaleDateString()}</Text>
          </View>
          {renderStars(item.puntuacion)}
        </View>
        {item.comentario ? (
          <Text style={styles.comentarioText}>{item.comentario}</Text>
        ) : (
          <Text style={[styles.comentarioText, { fontStyle: 'italic', color: Navy.textMuted }]}>
            Sin comentarios.
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color={Navy.accent} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={resenas}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListHeaderComponent={() => (
            <View>
              {/* Resumen de Promedio */}
              <View style={styles.statsCard}>
                <Text style={styles.ratingBig}>{promedio}</Text>
                {renderStars(Math.round(promedio), 24)}
                <Text style={styles.statsSubtitle}>{resenas.length} valoraciones en total</Text>
              </View>

              {/* Selector si entra directo y tiene turnos confirmados para calificar */}
              {!turnoId && misTurnos.length > 0 && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Elegí cuál de tus turnos completados querés calificar:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10 }}>
                    {misTurnos.map((t) => (
                      <TouchableOpacity
                        key={t._id}
                        style={styles.turnoChip}
                        onPress={() => setTurnoId(t._id)}
                      >
                        <Text style={styles.turnoChipText}>
                          ✂️ {t.servicio} • {t.fecha}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Formulario para dejar reseña si hay turnoId seleccionado */}
              {turnoId && (
                <View style={styles.formCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={[styles.formTitle, { marginBottom: 0 }]}>Calificando turno seleccionado</Text>
                    {!initialTurnoId && (
                      <TouchableOpacity onPress={() => setTurnoId(null)}>
                        <Text style={{ color: Navy.accent, fontSize: 13, fontWeight: 'bold' }}>Cambiar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <Text style={styles.label}>Puntuación</Text>
                  <View style={{ marginBottom: 15 }}>
                    {renderStars(puntuacion, 32, true)}
                  </View>

                  <Text style={styles.label}>Tu comentario (opcional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Contanos tu experiencia..."
                    placeholderTextColor="#4e6585"
                    value={comentario}
                    onChangeText={setComentario}
                    multiline
                    numberOfLines={3}
                  />

                  <TouchableOpacity 
                    style={styles.btnPrimary} 
                    onPress={handleEnviarResena}
                    disabled={enviando}
                  >
                    {enviando ? (
                      <ActivityIndicator color="#060D1F" />
                    ) : (
                      <Text style={styles.btnText}>PUBLICAR OPINIÓN</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.sectionTitle}>Comentarios de Clientes</Text>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Navy.bg },
  list: { padding: 20, paddingBottom: 40 },
  statsCard: {
    backgroundColor: Navy.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Navy.border,
    alignItems: 'center',
    marginBottom: 20
  },
  ratingBig: { fontSize: 48, fontWeight: 'bold', color: Navy.textPrimary, marginBottom: 8 },
  statsSubtitle: { color: Navy.textSecondary, fontSize: 13, marginTop: 8 },
  
  formCard: {
    backgroundColor: Navy.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Navy.borderAccent,
    marginBottom: 24
  },
  formTitle: { color: Navy.accent, fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  label: { color: Navy.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8 },
  input: {
    backgroundColor: Navy.surfaceAlt,
    borderWidth: 1,
    borderColor: Navy.border,
    borderRadius: 8,
    padding: 12,
    color: Navy.textPrimary,
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: 15
  },
  btnPrimary: { backgroundColor: Navy.accent, padding: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#060D1F', fontWeight: 'bold', fontSize: 14 },

  turnoChip: {
    backgroundColor: Navy.surfaceAlt,
    borderWidth: 1,
    borderColor: Navy.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 10
  },
  turnoChipText: { color: Navy.textPrimary, fontSize: 13, fontWeight: '600' },

  sectionTitle: { color: Navy.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  
  resenaCard: {
    backgroundColor: Navy.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Navy.border,
    marginBottom: 16
  },
  resenaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Navy.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Navy.border
  },
  avatarMiniText: { color: Navy.accent, fontSize: 14, fontWeight: 'bold' },
  usuarioNombre: { color: Navy.textPrimary, fontSize: 14, fontWeight: 'bold' },
  resenaFecha: { color: Navy.textMuted, fontSize: 11 },
  comentarioText: { color: Navy.textSecondary, fontSize: 14, lineHeight: 20 },
  starsRow: { flexDirection: 'row' }
});
