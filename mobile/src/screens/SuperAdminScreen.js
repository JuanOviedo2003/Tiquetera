import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Store, KeyRound, LogOut, Plus, X, Trash2 } from 'lucide-react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TiqueteraLogo from '../components/TiqueteraLogo';

export default function SuperAdminScreen({ onShowToast }) {
  const { logout } = useAuth();
  const [tab, setTab] = useState('restaurantes');
  const [restaurantes, setRestaurantes] = useState([]);
  const [pines, setPines] = useState([]);
  const [loading, setLoading] = useState(false);

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
    <View className="flex-1 bg-bg">
      <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-border">
        <View className="flex-row items-center gap-2.5">
          <TiqueteraLogo size={36} />
          <View>
            <Text className="text-lg font-semibold text-ink">SuperAdmin</Text>
            <Text className="text-[11px] text-slate-blue font-medium">Panel Central</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={logout}
          className="p-2.5 rounded-xl bg-bg border border-border"
        >
          <LogOut size={16} color="#333333" />
        </TouchableOpacity>
      </View>

      <View className="flex-row p-3 gap-2">
        <TouchableOpacity
          onPress={() => setTab('restaurantes')}
          className={`flex-1 py-2.5 rounded-xl border flex-row items-center justify-center gap-1.5 ${
            tab === 'restaurantes' ? 'bg-primary border-primary' : 'bg-white border-border'
          }`}
        >
          <Store size={15} color={tab === 'restaurantes' ? '#FFFFFF' : '#64829E'} />
          <Text
            className={`font-bold text-xs ${
              tab === 'restaurantes' ? 'text-white' : 'text-ink'
            }`}
          >
            Restaurantes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('pines')}
          className={`flex-1 py-2.5 rounded-xl border flex-row items-center justify-center gap-1.5 ${
            tab === 'pines' ? 'bg-primary border-primary' : 'bg-white border-border'
          }`}
        >
          <KeyRound size={15} color={tab === 'pines' ? '#FFFFFF' : '#64829E'} />
          <Text
            className={`font-bold text-xs ${tab === 'pines' ? 'text-white' : 'text-ink'}`}
          >
            Tiqueteras / PINes
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerClassName="p-4 pb-8">
        {tab === 'restaurantes' ? (
          <>
            <TouchableOpacity
              onPress={() => setShowCreate((v) => !v)}
              className="bg-primary rounded-xl py-3 flex-row items-center justify-center gap-1.5 mb-3"
            >
              {showCreate ? <X size={15} color="#FFF" /> : <Plus size={15} color="#FFF" />}
              <Text className="text-white font-bold text-xs">
                {showCreate ? 'Cancelar' : 'Nuevo Restaurante'}
              </Text>
            </TouchableOpacity>

            {showCreate && (
              <View className="bg-white rounded-3xl border border-border p-4 mb-3">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Nombre del restaurante"
                  placeholderTextColor="#64829E"
                  className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-2.5"
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Correo admin"
                  placeholderTextColor="#64829E"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-2.5"
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Contraseña"
                  placeholderTextColor="#64829E"
                  secureTextEntry
                  className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-2.5"
                />
                <TextInput
                  value={precio}
                  onChangeText={setPrecio}
                  placeholder="Precio tiquetera"
                  placeholderTextColor="#64829E"
                  keyboardType="numeric"
                  className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-3"
                />
                <TouchableOpacity
                  onPress={handleCrearRestaurante}
                  disabled={saving}
                  className="bg-primary rounded-xl py-3 items-center"
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text className="text-white font-bold text-xs">Guardar Restaurante</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {loading ? (
              <ActivityIndicator color="#FF6B47" />
            ) : (
              restaurantes.map((r) => (
                <View key={String(r.id)} className="bg-white rounded-3xl border border-border p-4 mb-3">
                  <Text className="text-base font-bold text-ink">{r.name || r.nombre}</Text>
                  <Text className="text-xs text-slate-blue mt-0.5">{r.email}</Text>
                  <Text className="text-xs text-slate-blue mt-0.5">
                    ID: {r.restaurante_id || r.id}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteRestaurante(r.id, r.name || r.nombre)}
                    className="bg-bg border border-border rounded-xl py-2.5 flex-row items-center justify-center gap-1.5 mt-2.5"
                  >
                    <Trash2 size={14} color="#FF6B47" />
                    <Text className="text-primary font-bold text-xs">Eliminar</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        ) : loading ? (
          <ActivityIndicator color="#FF6B47" />
        ) : (
          pines.map((t) => (
            <View key={String(t.id)} className="bg-white rounded-3xl border border-border p-4 mb-3">
              <Text className="text-base font-bold text-ink">
                {t.cliente_nombre || t.cliente?.nombre || `Tiquetera #${t.id}`}
              </Text>
              <Text className="text-xs text-slate-blue mt-0.5">
                Estado: {t.estado} · Restaurante: {t.restaurante_id}
              </Text>
              <Text className="text-xs text-slate-blue mt-0.5">
                Disponibles: {t.disponibles}/{t.total_almuerzos}
              </Text>
              <View className="flex-row gap-2 mt-2.5">
                <TouchableOpacity
                  onPress={() => handleCambiarEstado(t.id, 'ACTIVA')}
                  className="flex-1 bg-bg border border-border rounded-xl py-2.5 items-center"
                >
                  <Text className="text-ink font-semibold text-xs">Activar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCambiarEstado(t.id, 'BLOQUEADA')}
                  className="flex-1 bg-bg border border-border rounded-xl py-2.5 items-center"
                >
                  <Text className="text-ink font-semibold text-xs">Bloquear</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
