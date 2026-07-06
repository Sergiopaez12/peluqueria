import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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

  // Form states
  const [turnoId, setTurnoId] = useState(initialTurnoId);
  const [puntuacion, setPuntuacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cargarResenas = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/resenas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResenas(res.data);
      
      // Calcular promedio
      if (res.data.length > 0) {
        const suma = res.data.reduce((acc, curr) => acc + curr.puntuacion, 0);
        setPromedio((suma / res.data.length).toFixed(1));
      } else {
        setPromedio(0);
      }
    } catch (e) {
      console.log('Error cargando reseñas', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarResenas();
  }, []);

  const handleEnviarResena = async () => {
    if (!turnoId) {
      Alert.alert('Error', 'No se ha seleccionado ningún turno para calificar.');
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
      Alert.alert('¡Gracias!', 'Tu reseña fue publicada con éxito.');
      setComentario('');
      setTurnoId(null);
      cargarResenas();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo enviar la reseña.');
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

              {/* Formulario para dejar reseña si viene con turnoId */}
              {turnoId && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>Calificá tu turno de {initialServicio}</Text>
                  
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
