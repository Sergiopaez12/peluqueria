import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Navy } from '../constants/theme';
import { API_URL } from '../config/api';

export default function AdminDashboardScreen() {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/auth/estadisticas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (e) {
      console.log('Error cargando estadísticas', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isFocused) {
      cargarEstadisticas();
    }
  }, [isFocused]);

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Navy.accent} size="large" />
      </View>
    );
  }

  const { totalClientes, turnosPorEstado, ingresosEstimados, serviciosPopulares, turnosPorDia } = stats || {
    totalClientes: 0,
    turnosPorEstado: { pendiente: 0, confirmado: 0, rechazado: 0 },
    ingresosEstimados: 0,
    serviciosPopulares: [],
    turnosPorDia: []
  };

  const totalTurnos = turnosPorEstado.pendiente + turnosPorEstado.confirmado + turnosPorEstado.rechazado;
  
  // Calculate max count for scaling charts
  const maxPopularServiceCount = serviciosPopulares.length > 0 ? Math.max(...serviciosPopulares.map(s => s.count)) : 1;
  const maxTurnosPorDiaCount = turnosPorDia.length > 0 ? Math.max(...turnosPorDia.map(d => d.cantidad)) : 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panel Admin</Text>
        <Text style={styles.headerSubtitle}>Resumen de actividad comercial</Text>
      </View>

      {/* Ingresos Estimados */}
      <View style={styles.revenueCard}>
        <Text style={styles.revenueLabel}>INGRESOS ESTIMADOS (CONFIRMADOS)</Text>
        <Text style={styles.revenueValue}>${ingresosEstimados.toLocaleString()}</Text>
      </View>

      {/* Grid de Métricas */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statVal}>{totalClientes}</Text>
          <Text style={styles.statName}>Clientes</Text>
        </View>

        <View style={[styles.statCard, { borderColor: 'rgba(251,191,36,0.2)' }]}>
          <Text style={[styles.statIcon, { color: Navy.warning }]}>⏳</Text>
          <Text style={[styles.statVal, { color: Navy.warning }]}>{turnosPorEstado.pendiente}</Text>
          <Text style={styles.statName}>Pendientes</Text>
        </View>

        <View style={[styles.statCard, { borderColor: 'rgba(16,185,129,0.2)' }]}>
          <Text style={[styles.statIcon, { color: Navy.success }]}>✅</Text>
          <Text style={[styles.statVal, { color: Navy.success }]}>{turnosPorEstado.confirmado}</Text>
          <Text style={styles.statName}>Confirmados</Text>
        </View>

        <View style={[styles.statCard, { borderColor: 'rgba(248,113,113,0.2)' }]}>
          <Text style={[styles.statIcon, { color: Navy.error }]}>❌</Text>
          <Text style={[styles.statVal, { color: Navy.error }]}>{turnosPorEstado.rechazado}</Text>
          <Text style={styles.statName}>Rechazados</Text>
        </View>
      </View>

      {/* Servicios Populares */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Servicios Más Populares</Text>
        {serviciosPopulares.length === 0 ? (
          <Text style={styles.emptyText}>Sin turnos registrados aún.</Text>
        ) : (
          serviciosPopulares.map((s, idx) => {
            const percentage = (s.count / maxPopularServiceCount) * 100;
            return (
              <View key={s.nombre} style={styles.chartRow}>
                <View style={styles.chartLabelRow}>
                  <Text style={styles.chartLabelText}>{idx + 1}. {s.nombre}</Text>
                  <Text style={styles.chartValueText}>{s.count} turnos</Text>
                </View>
                <View style={styles.chartBarBg}>
                  <View style={[styles.chartBarFill, { width: `${percentage}%` }]} />
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Turnos por Día */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Turnos por Día (Últimos 7 días)</Text>
        {turnosPorDia.length === 0 ? (
          <Text style={styles.emptyText}>Sin datos recientes.</Text>
        ) : (
          <View style={styles.barChartContainer}>
            {turnosPorDia.map((d) => {
              const heightPercentage = maxTurnosPorDiaCount > 0 ? (d.cantidad / maxTurnosPorDiaCount) * 100 : 0;
              return (
                <View key={d.fecha} style={styles.barCol}>
                  <Text style={styles.barValText}>{d.cantidad}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${heightPercentage}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>{d.dia}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
      
      <TouchableOpacity style={styles.btnRefresh} onPress={cargarEstadisticas}>
        <Text style={styles.btnRefreshText}>REFRESCAR DATOS</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Navy.bg },
  loadingContainer: { flex: 1, backgroundColor: Navy.bg, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  
  header: { marginBottom: 20 },
  headerTitle: { color: Navy.textPrimary, fontSize: 26, fontWeight: 'bold' },
  headerSubtitle: { color: Navy.textSecondary, fontSize: 14, marginTop: 4 },
  
  revenueCard: {
    backgroundColor: Navy.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Navy.border,
    alignItems: 'center',
    marginBottom: 20
  },
  revenueLabel: { color: Navy.textSecondary, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  revenueValue: { color: Navy.accent, fontSize: 36, fontWeight: 'bold', marginTop: 8 },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    backgroundColor: Navy.surface,
    width: '47%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Navy.border,
    alignItems: 'center'
  },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statVal: { fontSize: 24, fontWeight: 'bold', color: Navy.textPrimary },
  statName: { color: Navy.textSecondary, fontSize: 12, marginTop: 4 },

  sectionCard: {
    backgroundColor: Navy.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Navy.border,
    marginBottom: 20
  },
  sectionTitle: { color: Navy.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  
  chartRow: { marginBottom: 15 },
  chartLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  chartLabelText: { color: Navy.textPrimary, fontSize: 13, fontWeight: '600' },
  chartValueText: { color: Navy.accent, fontSize: 13, fontWeight: 'bold' },
  chartBarBg: { height: 8, backgroundColor: Navy.surfaceAlt, borderRadius: 4, overflow: 'hidden' },
  chartBarFill: { height: '100%', backgroundColor: Navy.accent },
  
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 20,
    paddingHorizontal: 10
  },
  barCol: { alignItems: 'center', flex: 1 },
  barValText: { color: Navy.accent, fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  barTrack: { height: 100, width: 12, backgroundColor: Navy.surfaceAlt, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', backgroundColor: Navy.accent, borderRadius: 6 },
  barLabel: { color: Navy.textSecondary, fontSize: 11, marginTop: 8 },
  
  emptyText: { color: Navy.textMuted, fontStyle: 'italic', textAlign: 'center', padding: 10 },
  
  btnRefresh: {
    borderWidth: 1,
    borderColor: Navy.borderAccent,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  btnRefreshText: { color: Navy.accent, fontWeight: 'bold', fontSize: 13 }
});
