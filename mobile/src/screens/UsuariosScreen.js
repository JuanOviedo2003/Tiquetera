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
    <ScrollView contentContainerClassName="p-4 pb-8" keyboardShouldPersistTaps="handled">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-xl font-extrabold text-ink">Usuarios</Text>
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
          <Text className="text-base font-bold text-ink mb-2.5">
            Nuevo usuario del restaurante
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nombre"
            className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-2.5"
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Correo electrónico"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-2.5"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            secureTextEntry
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
              <Text className="text-white font-bold text-xs">Crear usuario</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#FF6B47" className="mt-5" />
      ) : (
        users.map((u) => (
          <View key={String(u.id)} className="bg-white rounded-2xl border border-border p-4 mb-3">
            <Text className="text-base font-bold text-ink">{u.name || u.nombre}</Text>
            <Text className="text-xs text-muted mt-0.5">{u.email}</Text>
            <Text className="text-[11px] font-bold text-primary mt-1">
              {u.role || u.rol || 'RESTAURANTE'}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
