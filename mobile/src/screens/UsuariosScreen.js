import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, commonStyles } from '../theme/colors';

export default function UsuariosScreen({ onShowToast }) {
  const { restauranteId } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getUsers(restauranteId);
      const list = res.users || res.usuarios || res.data || res || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Error cargando usuarios' });
    } finally {
      setLoading(false);
    }
  }, [restauranteId, onShowToast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleCrear = async () => {
    if (!name.trim() || !email.trim() || !password) {
      onShowToast?.({ type: 'error', message: 'Completa nombre, correo y contraseña' });
      return;
    }
    setSaving(true);
    try {
      await api.createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        restaurante_id: restauranteId,
      });
      setName('');
      setEmail('');
      setPassword('');
      setShowCreate(false);
      onShowToast?.({ type: 'success', message: 'Usuario creado' });
      cargar();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Error creando usuario' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <Text style={styles.title}>Usuarios</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate((v) => !v)}>
          <Text style={styles.newBtnText}>{showCreate ? 'Cerrar' : '+ Nuevo'}</Text>
        </TouchableOpacity>
      </View>

      {showCreate && (
        <View style={commonStyles.card}>
          <Text style={styles.cardTitle}>Nuevo usuario del restaurante</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre"
            style={[commonStyles.input, { marginBottom: 10 }]}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Correo electrónico"
            keyboardType="email-address"
            autoCapitalize="none"
            style={[commonStyles.input, { marginBottom: 10 }]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            secureTextEntry
            style={[commonStyles.input, { marginBottom: 12 }]}
          />
          <TouchableOpacity style={commonStyles.buttonPrimary} onPress={handleCrear} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnPriText}>Crear usuario</Text>}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        users.map((u) => (
          <View key={String(u.id)} style={commonStyles.card}>
            <Text style={styles.name}>{u.name || u.nombre}</Text>
            <Text style={styles.meta}>{u.email}</Text>
            <Text style={styles.role}>{u.role || u.rol || 'RESTAURANTE'}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  newBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  newBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  btnPriText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  role: { fontSize: 11, fontWeight: '700', color: colors.primary, marginTop: 4 },
});
