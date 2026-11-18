import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, commonStyles } from '../theme/colors';
import { getApiBaseUrl } from '../services/api';

export default function LoginScreen({ onGoClienteActivar, onGoClienteConsulta, onOpenServerConfig, onShowToast }) {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      onShowToast?.({ type: 'error', message: 'Ingresa correo y contraseña' });
      return;
    }
    try {
      await login(email.trim(), password);
      onShowToast?.({ type: 'success', message: 'Sesión iniciada' });
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Credenciales inválidas' });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.brand}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>T</Text>
        </View>
        <Text style={styles.title}>Tiquetera</Text>
        <Text style={styles.subtitle}>Control de almuerzos · App Móvil</Text>
      </View>

      <View style={commonStyles.card}>
        <Text style={styles.cardTitle}>Acceso Restaurante / Admin</Text>
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="restaurante@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          style={[commonStyles.input, { marginBottom: 12 }]}
        />
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          style={[commonStyles.input, { marginBottom: 16 }]}
        />
        <TouchableOpacity
          style={commonStyles.buttonPrimary}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnPrimaryText}>Iniciar sesión</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={commonStyles.card}>
        <Text style={styles.cardTitle}>Soy Cliente</Text>
        <Text style={styles.helper}>
          Activa tu tiquetera con el código de 6 dígitos o consulta tu saldo y movimientos con tu QR.
        </Text>
        <View style={styles.clientActions}>
          <TouchableOpacity
            style={[commonStyles.buttonSecondary, { flex: 1 }]}
            onPress={onGoClienteActivar}
          >
            <Text style={styles.btnSecText}>Activar código</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[commonStyles.buttonSecondary, { flex: 1 }]}
            onPress={onGoClienteConsulta}
          >
            <Text style={styles.btnSecText}>Consultar QR</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.serverLink} onPress={onOpenServerConfig}>
        <Text style={styles.serverLinkText}>Servidor API: {getApiBaseUrl()}</Text>
        <Text style={styles.serverLinkSub}>Toca para cambiar o probar conexión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, justifyContent: 'center', backgroundColor: colors.bg },
  brand: { alignItems: 'center', marginBottom: 24 },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoText: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  helper: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  clientActions: { flexDirection: 'row', gap: 10 },
  btnSecText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  serverLink: { alignItems: 'center', marginTop: 8, padding: 8 },
  serverLinkText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  serverLinkSub: { fontSize: 11, color: colors.primary, marginTop: 2 },
});
