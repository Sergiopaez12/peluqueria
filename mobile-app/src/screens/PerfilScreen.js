import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function PerfilScreen() {
  const { usuario, logout } = useContext(AuthContext);

  const initials = usuario?.nombre ? usuario.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{usuario?.nombre}</Text>
        <Text style={styles.email}>{usuario?.email}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>Cliente</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.btnLogout} onPress={logout}>
        <Text style={styles.btnLogoutText}>CERRAR SESIÓN</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0b10', padding: 20 },
  card: { backgroundColor: '#12141d', padding: 32, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#d4af37', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#000' },
  name: { color: '#f8f9fa', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  email: { color: '#a1a1aa', fontSize: 14, marginBottom: 16 },
  roleTag: { backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  roleText: { color: '#a1a1aa', fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 1 },
  btnLogout: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnLogoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
});
