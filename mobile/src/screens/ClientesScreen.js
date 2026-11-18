import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
    <ScrollView contentContainerClassName="p-4 pb-8" keyboardShouldPersistTaps="handled">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-xl font-extrabold text-ink">Clientes</Text>
        <TouchableOpacity
          onPress={() => setShowCreate((v) => !v)}
          className="bg-primary px-3.5 py-2 rounded-xl"
        >
          <Text className="text-white font-bold text-xs">
            {showCreate ? 'Cerrar' : '+ Nuevo'}
          </Text>
        </TouchableOpacity>
      </View>

      {showCreate && (
        <View className="bg-white rounded-2xl border border-border p-4 mb-3">
          <Text className="text-base font-bold text-ink mb-2.5">Registrar Cliente</Text>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre completo"
            className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-2.5"
          />
          <TextInput
            value={identificacion}
            onChangeText={setIdentificacion}
            placeholder="Cédula / Identificación"
            className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-2.5"
          />
          <TextInput
            value={telefono}
            onChangeText={setTelefono}
            placeholder="Teléfono (opcional)"
            keyboardType="phone-pad"
            className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-3"
          />
          <TouchableOpacity
            onPress={handleCrear}
            disabled={saving}
            className="bg-primary rounded-xl py-3 items-center"
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white font-bold text-xs">Guardar cliente</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#FF6B47" className="mt-5" />
      ) : (
        clientes.map((c) => (
          <View key={String(c.id)} className="bg-white rounded-2xl border border-border p-4 mb-3">
            <Text className="text-base font-bold text-ink">{c.nombre}</Text>
            <Text className="text-xs text-muted mt-0.5">ID: {c.identificacion}</Text>
            {c.telefono ? (
              <Text className="text-xs text-muted mt-0.5">Tel: {c.telefono}</Text>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}
