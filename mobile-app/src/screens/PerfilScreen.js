import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Navy } from '../constants/theme';
import { API_URL } from '../config/api';

export default function PerfilScreen() {
  const { usuario, token, logout, login } = useContext(AuthContext);
  
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleGuardarCambios = async () => {
    if (!nombre) {
      Alert.alert('Error', 'El nombre no puede estar vacío.');
      return;
    }
    
    if (passwordActual || passwordNueva) {
      if (!passwordActual || !passwordNueva) {
        Alert.alert('Error', 'Completá ambos campos de contraseña para realizar el cambio.');
        return;
      }
    }

    setGuardando(true);
    try {
      const res = await axios.put(`${API_URL}/auth/perfil`, {
        nombre,
        passwordActual: passwordActual || undefined,
        passwordNueva: passwordNueva || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('¡Éxito!', 'Perfil actualizado correctamente.');
      setPasswordActual('');
      setPasswordNueva('');
      
      // Intentar refrescar la sesión si es posible, o simplemente informar
      // Nota: El authContext almacena el usuario viejo, podemos pedirle al usuario que vuelva a ingresar si editó la pass
      if (passwordActual && passwordNueva) {
        Alert.alert('Sesión Cerrada', 'Por seguridad, ingresá nuevamente con tu nueva contraseña.', [
          { text: 'Entendido', onPress: logout }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar el perfil.');
    }
    setGuardando(false);
  };

  const handleEliminarCuenta = () => {
    Alert.prompt(
      'Eliminar Cuenta',
      'Esta acción es irreversible y borrará todos tus turnos. Ingresá tu contraseña para confirmar:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar y Eliminar',
          onPress: async (password) => {
            if (!password) {
              Alert.alert('Error', 'Contraseña requerida.');
              return;
            }
            setEliminando(true);
            try {
              await axios.delete(`${API_URL}/auth/perfil`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { password }
              });
              Alert.alert('Adiós', 'Tu cuenta ha sido eliminada. Lamentamos verte partir.', [
                { text: 'Cerrar', onPress: logout }
              ]);
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Contraseña incorrecta o error al eliminar.');
            }
            setEliminando(false);
          },
          style: 'destructive'
        }
      ],
      'secure-text'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{usuario?.nombre}</Text>
        <Text style={styles.email}>{usuario?.email}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>{usuario?.rol === 'admin' ? 'Dueño / Administrador' : 'Cliente'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Editar Perfil</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu nombre"
            placeholderTextColor="#4e6585"
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        <Text style={styles.dividerTitle}>Cambiar Contraseña (Opcional)</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Contraseña Actual</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#4e6585"
            value={passwordActual}
            onChangeText={setPasswordActual}
            secureTextEntry
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nueva Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#4e6585"
            value={passwordNueva}
            onChangeText={setPasswordNueva}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleGuardarCambios} disabled={guardando}>
          {guardando ? <ActivityIndicator color="#060D1F" /> : <Text style={styles.btnText}>GUARDAR CAMBIOS</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btnLogout} onPress={logout}>
        <Text style={styles.btnLogoutText}>CERRAR SESIÓN</Text>
      </TouchableOpacity>

      {usuario?.rol !== 'admin' && (
        <TouchableOpacity style={styles.btnDelete} onPress={handleEliminarCuenta} disabled={eliminando}>
          {eliminando ? <ActivityIndicator color="#f87171" /> : <Text style={styles.btnDeleteText}>ELIMINAR CUENTA</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Navy.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: Navy.surface,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Navy.border,
    marginBottom: 20
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Navy.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#060D1F' },
  name: { color: Navy.textPrimary, fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  email: { color: Navy.textSecondary, fontSize: 14, marginBottom: 16 },
  roleTag: {
    backgroundColor: 'rgba(56,189,248,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Navy.borderAccent
  },
  roleText: { color: Navy.accent, fontSize: 11, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 1 },
  
  section: {
    backgroundColor: Navy.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Navy.border,
    marginBottom: 24
  },
  sectionTitle: { color: Navy.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  dividerTitle: { color: Navy.textSecondary, fontSize: 14, fontWeight: '600', marginTop: 10, marginBottom: 15 },
  
  formGroup: { marginBottom: 16 },
  label: { color: Navy.textSecondary, fontSize: 12, textTransform: 'uppercase', fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: Navy.surfaceAlt,
    borderWidth: 1,
    borderColor: Navy.border,
    borderRadius: 8,
    padding: 12,
    color: Navy.textPrimary,
    fontSize: 15
  },
  
  btnPrimary: {
    backgroundColor: Navy.accent,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  btnText: { color: '#060D1F', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
  
  btnLogout: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12
  },
  btnLogoutText: { color: '#f87171', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  
  btnDelete: {
    backgroundColor: 'transparent',
    padding: 10,
    alignItems: 'center'
  },
  btnDeleteText: { color: '#f87171', fontSize: 12, fontWeight: 'bold', textDecorationLine: 'underline' }
});
