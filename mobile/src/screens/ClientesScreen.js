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

export default function ClientesScreen({ onShowToast }) {
  const { restauranteId } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [nombre, setNombre] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getClientes(restauranteId);
      const list = res.clientes || res.data || res || [];
      setClientes(Array.isArray(list) ? list : []);
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Error cargando clientes' });
    } finally {
      setLoading(false);
    }
  }, [restauranteId, onShowToast]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleCrear = async () => {
    if (!nombre.trim() || !identificacion.trim()) {
      onShowToast?.({ type: 'error', message: 'Nombre e identificación son obligatorios' });
      return;
    }
    setSaving(true);
    try {
      await api.createCliente({
        nombre: nombre.trim(),
        identificacion: identificacion.trim(),
        telefono: telefono.trim() || null,
        restaurante_id: restauranteId,
      });
      setNombre('');
      setIdentificacion('');
      setTelefono('');
      setShowCreate(false);
      onShowToast?.({ type: 'success', message: 'Cliente registrado' });
      cargar();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'No se pudo registrar' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <Text style={styles.title}>Clientes</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate((v) => !v)}>
          <Text style={styles.newBtnText}>{showCreate ? 'Cerrar' : '+ Nuevo'}</Text>
        </TouchableOpacity>
      </View>

      {showCreate && (
        <View style={commonStyles.card}>
          <Text style={styles.cardTitle}>Registrar Cliente</Text>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre completo"
            style={[commonStyles.input, { marginBottom: 10 }]}
          />
          <TextInput
            value={identificacion}
            onChangeText={setIdentificacion}
            placeholder="Cédula / Identificación"
            style={[commonStyles.input, { marginBottom: 10 }]}
          />
          <TextInput
            value={telefono}
            onChangeText={setTelefono}
            placeholder="Teléfono (opcional)"
            keyboardType="phone-pad"
            style={[commonStyles.input, { marginBottom: 12 }]}
          />
          <TouchableOpacity style={commonStyles.buttonPrimary} onPress={handleCrear} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnPriText}>Guardar cliente</Text>}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        clientes.map((c) => (
          <View key={String(c.id)} style={commonStyles.card}>
            <Text style={styles.name}>{c.nombre}</Text>
            <Text style={styles.meta}>ID: {c.identificacion}</Text>
            {c.telefono ? <Text style={styles.meta}>Tel: {c.telefono}</Text> : null}
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
});
