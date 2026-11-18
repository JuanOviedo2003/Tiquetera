import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, commonStyles } from '../theme/colors';

export default function SuperAdminScreen({ onShowToast }) {
  const { logout } = useAuth();
  const [tab, setTab] = useState('restaurantes');
  const [restaurantes, setRestaurantes] = useState([]);
  const [pines, setPines] = useState([]);
  const [loading, setLoading] = useState(false);

  // Crear restaurante
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [precio, setPrecio] = useState('0');
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [restRes, pinRes] = await Promise.all([
        api.getRestaurantes(),
        api.adminGetPines(),
      ]);
      const rList = restRes.restaurantes || restRes.data || restRes || [];
      setRestaurantes(Array.isArray(rList) ? rList : []);
      const pList = pinRes.tiqueteras || pinRes.pines || pinRes.data || pinRes || [];
      setPines(Array.isArray(pList) ? pList : []);
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Error cargando datos' });
    } finally {
      setLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleCrearRestaurante = async () => {
    if (!name.trim() || !email.trim() || !password) {
      onShowToast?.({ type: 'error', message: 'Completa nombre, correo y contraseña' });
      return;
    }
    setSaving(true);
    try {
      await api.createRestaurante({
        name: name.trim(),
        email: email.trim(),
        password,
        precio_tiquetera: Number(precio) || 0,
      });
      setName('');
      setEmail('');
      setPassword('');
      setPrecio('0');
      setShowCreate(false);
      onShowToast?.({ type: 'success', message: 'Restaurante creado' });
      cargar();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'No se pudo crear' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRestaurante = (id, rName) => {
    Alert.alert('Eliminar restaurante', `¿Eliminar "${rName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteRestaurante(id);
            onShowToast?.({ type: 'success', message: 'Restaurante eliminado' });
            cargar();
          } catch (err) {
            onShowToast?.({ type: 'error', message: err.message });
          }
        },
      },
    ]);
  };

  const handleCambiarEstado = async (id, estado) => {
    try {
      await api.adminCambiarEstadoTiquetera(id, estado);
      onShowToast?.({ type: 'success', message: `Estado cambiado a ${estado}` });
      cargar();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>SuperAdmin</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'restaurantes' && styles.tabActive]}
          onPress={() => setTab('restaurantes')}
        >
          <Text style={[styles.tabText, tab === 'restaurantes' && styles.tabTextActive]}>
            Restaurantes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'pines' && styles.tabActive]}
          onPress={() => setTab('pines')}
        >
          <Text style={[styles.tabText, tab === 'pines' && styles.tabTextActive]}>
            Tiqueteras / PINes
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {tab === 'restaurantes' ? (
          <>
            <TouchableOpacity
              style={[commonStyles.buttonPrimary, { marginBottom: 12 }]}
              onPress={() => setShowCreate((v) => !v)}
            >
              <Text style={styles.btnPriText}>
                {showCreate ? 'Cancelar' : '+ Nuevo Restaurante'}
              </Text>
            </TouchableOpacity>

            {showCreate && (
              <View style={commonStyles.card}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Nombre del restaurante"
                  style={[commonStyles.input, { marginBottom: 10 }]}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Correo admin"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[commonStyles.input, { marginBottom: 10 }]}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Contraseña"
                  secureTextEntry
                  style={[commonStyles.input, { marginBottom: 10 }]}
                />
                <TextInput
                  value={precio}
                  onChangeText={setPrecio}
                  placeholder="Precio tiquetera"
                  keyboardType="numeric"
                  style={[commonStyles.input, { marginBottom: 12 }]}
                />
                <TouchableOpacity
                  style={commonStyles.buttonPrimary}
                  onPress={handleCrearRestaurante}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.btnPriText}>Guardar Restaurante</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              restaurantes.map((r) => (
                <View key={String(r.id)} style={commonStyles.card}>
                  <Text style={styles.name}>{r.name || r.nombre}</Text>
                  <Text style={styles.meta}>{r.email}</Text>
                  <Text style={styles.meta}>ID: {r.restaurante_id || r.id}</Text>
                  <TouchableOpacity
                    style={[commonStyles.buttonSecondary, { marginTop: 10 }]}
                    onPress={() => handleDeleteRestaurante(r.id, r.name || r.nombre)}
                  >
                    <Text style={{ color: colors.danger, fontWeight: '700' }}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        ) : loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          pines.map((t) => (
            <View key={String(t.id)} style={commonStyles.card}>
              <Text style={styles.name}>
                {t.cliente_nombre || t.cliente?.nombre || `Tiquetera #${t.id}`}
              </Text>
              <Text style={styles.meta}>
                Estado: {t.estado} · Restaurante: {t.restaurante_id}
              </Text>
              <Text style={styles.meta}>
                Disponibles: {t.disponibles}/{t.total_almuerzos}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity
                  style={[commonStyles.buttonSecondary, { flex: 1 }]}
                  onPress={() => handleCambiarEstado(t.id, 'ACTIVA')}
                >
                  <Text style={styles.btnSecText}>Activar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[commonStyles.buttonSecondary, { flex: 1 }]}
                  onPress={() => handleCambiarEstado(t.id, 'BLOQUEADA')}
                >
                  <Text style={styles.btnSecText}>Bloquear</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topTitle: { fontSize: 19, fontWeight: '800', color: colors.text },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.bg },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  tabRow: { flexDirection: 'row', padding: 12, gap: 8 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontWeight: '700', color: colors.text, fontSize: 13 },
  tabTextActive: { color: '#FFF' },
  container: { padding: 16, paddingBottom: 32 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  btnPriText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  btnSecText: { color: colors.text, fontWeight: '600', fontSize: 13 },
});
