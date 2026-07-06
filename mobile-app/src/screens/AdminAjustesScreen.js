import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Navy } from '../constants/theme';

export default function AdminAjustesScreen({ navigation }) {
  const { logout } = useContext(AuthContext);

  const menuItems = [
    { title: '💈 Servicios y Precios', desc: 'Gestioná el catálogo de cortes, barbas y precios', screen: 'AdminServicios' },
    { title: '⏰ Horarios de Atención', desc: 'Habilitá días de trabajo y bloqueá vacaciones', screen: 'AdminHorarios' },
    { title: '👥 Base de Clientes', desc: 'Ver listado de clientes registrados y sus reservas', screen: 'AdminClientes' },
    { title: '👤 Mi Perfil de Administrador', desc: 'Cambiá tu contraseña o nombre de usuario', screen: 'AdminPerfil' }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.sectionHeader}>Configuración del Negocio</Text>
      
      {menuItems.map((item, idx) => (
        <TouchableOpacity 
          key={idx} 
          style={styles.menuItem}
          onPress={() => navigation.navigate(item.screen)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuDesc}>{item.desc}</Text>
          </View>
          <Text style={styles.arrow}>❯</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.btnLogout} onPress={logout}>
        <Text style={styles.btnLogoutText}>CERRAR SESIÓN</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Navy.bg },
  scroll: { padding: 20, paddingTop: 30 },
  sectionHeader: { color: Navy.accent, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15 },
  menuItem: {
    backgroundColor: Navy.surface,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Navy.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  menuTitle: { color: Navy.textPrimary, fontSize: 16, fontWeight: 'bold' },
  menuDesc: { color: Navy.textSecondary, fontSize: 13, marginTop: 4 },
  arrow: { color: Navy.accent, fontSize: 14, fontWeight: 'bold', marginLeft: 10 },
  
  btnLogout: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20
  },
  btnLogoutText: { color: '#f87171', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 }
});
