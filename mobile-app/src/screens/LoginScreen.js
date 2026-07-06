import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Navy } from '../constants/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Completá todos los campos.');
      return;
    }
    setLoading(true);
    setError('');
    const res = await login(email, password);
    if (!res.success) {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logoIcon}>✂️</Text>
        <Text style={styles.title}>BarberApp</Text>
        <Text style={styles.subtitle}>Iniciá sesión para agendar</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor="#4e6585"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#4e6585"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#060D1F" /> : <Text style={styles.btnText}>INGRESAR</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tenés cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Registrate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Navy.bg,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Navy.surface,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Navy.border,
    borderTopWidth: 3,
    borderTopColor: Navy.accent,
  },
  logoIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Navy.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Navy.accent,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: Navy.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: Navy.surfaceAlt,
    borderWidth: 1,
    borderColor: Navy.border,
    borderRadius: 8,
    padding: 14,
    color: Navy.textPrimary,
    fontSize: 15,
  },
  btnPrimary: {
    backgroundColor: Navy.accent,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    color: '#060D1F',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  errorText: {
    color: Navy.error,
    backgroundColor: Navy.errorBg,
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerText: {
    color: Navy.textMuted,
    fontSize: 13,
  },
  footerLink: {
    color: Navy.accent,
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  }
});
