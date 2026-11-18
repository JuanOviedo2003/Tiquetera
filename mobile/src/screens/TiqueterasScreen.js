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
import { Ticket, Plus, X, Search, KeyRound, RefreshCw, ScanLine } from 'lucide-react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TiqueterasScreen({ onAbrirConsumo, onShowToast }) {
  const { restauranteId } = useAuth();
  const [tiqueteras, setTiqueteras] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [totalAlmuerzos, setTotalAlmuerzos] = useState('10');
  const [creating, setCreating] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [tiqRes, cliRes] = await Promise.all([
        api.getTiqueteras({
          restaurante_id: restauranteId,
          estado: filtroEstado || undefined,
          cliente_nombre: busqueda.trim() || undefined,
        }),
        api.getClientes(restauranteId),
      ]);
      const list = tiqRes.tiqueteras || tiqRes.data || tiqRes || [];
      setTiqueteras(Array.isArray(list) ? list : []);
      const cliList = cliRes.clientes || cliRes.data || cliRes || [];
      setClientes(Array.isArray(cliList) ? cliList : []);
      if (cliList.length && !clienteId) {
        setClienteId(String(cliList[0].id));
      }
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Error cargando tiqueteras' });
    } finally {
      setLoading(false);
    }
  }, [restauranteId, filtroEstado, busqueda, clienteId, onShowToast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleCrear = async () => {
    if (!clienteId || !totalAlmuerzos || Number(totalAlmuerzos) < 1) {
      onShowToast?.({ type: 'error', message: 'Selecciona un cliente y cantidad válida' });
      return;
    }
    setCreating(true);
    try {
      const res = await api.createTiquetera({
        cliente_id: clienteId,
        total_almuerzos: Number(totalAlmuerzos),
        restaurante_id: restauranteId,
      });
      const creada = res.tiquetera || res;
      onShowToast?.({
        type: 'success',
        message: `Tiquetera creada. Código: ${creada.codigo_activacion || 'emitido'}`,
      });
      setShowCreate(false);
      cargarDatos();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'No se pudo crear la tiquetera' });
    } finally {
      setCreating(false);
    }
  };

  const handleVerCodigo = async (id) => {
    try {
      const res = await api.getCodigoActivacion(id);
      Alert.alert(
        'Código de activación',
        `Código: ${res.codigo_activacion || res.codigo || 'N/A'}\nExpira: ${
          res.expira_en || res.fecha_expiracion_codigo || '48h'
        }`
      );
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'No se pudo obtener el código' });
    }
  };

  const handleReemitir = async (id) => {
    try {
      const res = await api.reemitirCodigoActivacion(id);
      Alert.alert(
        'Nuevo código emitido',
        `Código: ${res.codigo_activacion || res.tiquetera?.codigo_activacion || 'Emitido'}`
      );
      cargarDatos();
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'No se pudo reemitir el código' });
    }
  };

  return (
    <ScrollView contentContainerClassName="p-4 pb-8" keyboardShouldPersistTaps="handled">
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center gap-2">
          <Ticket size={20} color="#FF6B47" />
          <Text className="text-xl font-semibold text-ink">Tiqueteras</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreate((v) => !v)}
          className="bg-primary px-3.5 py-2 rounded-xl flex-row items-center gap-1"
        >
          {showCreate ? <X size={14} color="#FFF" /> : <Plus size={14} color="#FFF" />}
          <Text className="text-white font-bold text-xs">
            {showCreate ? 'Cerrar' : 'Nueva'}
          </Text>
        </TouchableOpacity>
      </View>

      {showCreate && (
        <View className="bg-white rounded-3xl border border-border p-4 mb-3">
          <Text className="text-base font-bold text-ink mb-2.5">Crear Tiquetera</Text>
          <Text className="text-xs font-semibold text-ink mb-1.5">Cliente</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2.5">
            <View className="flex-row gap-2">
              {clientes.map((c) => {
                const active = String(c.id) === String(clienteId);
                return (
                  <TouchableOpacity
                    key={String(c.id)}
                    onPress={() => setClienteId(String(c.id))}
                    className={`px-3 py-1.5 rounded-full border ${
                      active ? 'bg-primary border-primary' : 'bg-bg border-border'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${active ? 'text-white' : 'text-ink'}`}
                    >
                      {c.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <Text className="text-xs font-semibold text-ink mb-1.5">Cantidad de almuerzos</Text>
          <TextInput
            value={totalAlmuerzos}
            onChangeText={setTotalAlmuerzos}
            keyboardType="number-pad"
            className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-3"
          />
          <TouchableOpacity
            onPress={handleCrear}
            disabled={creating}
            className="bg-primary rounded-xl py-3 items-center"
          >
            {creating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white font-bold text-xs">Emitir Tiquetera</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View className="bg-white rounded-3xl border border-border p-4 mb-3">
        <View className="flex-row items-center bg-bg border border-border rounded-xl px-3 mb-2.5">
          <Search size={15} color="#64829E" />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por nombre de cliente..."
            placeholderTextColor="#64829E"
            className="flex-1 py-2.5 pl-2 text-sm text-ink"
          />
        </View>
        <View className="flex-row flex-wrap gap-1.5">
          {['', 'PENDIENTE', 'ACTIVA', 'AGOTADA'].map((est) => {
            const active = filtroEstado === est;
            return (
              <TouchableOpacity
                key={est || 'TODAS'}
                onPress={() => setFiltroEstado(est)}
                className={`px-3 py-1.5 rounded-full border ${
                  active ? 'bg-primary border-primary' : 'bg-bg border-border'
                }`}
              >
                <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-ink'}`}>
                  {est || 'Todas'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#FF6B47" className="mt-5" />
      ) : tiqueteras.length === 0 ? (
        <Text className="text-center text-slate-blue mt-6">
          No hay tiqueteras con estos filtros.
        </Text>
      ) : (
        tiqueteras.map((t) => (
          <View key={String(t.id)} className="bg-white rounded-3xl border border-border p-4 mb-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-bold text-ink">
                {t.cliente?.nombre || t.cliente_nombre || `Cliente #${t.cliente_id}`}
              </Text>
              <View className="bg-primary-light px-2.5 py-1 rounded-lg">
                <Text className="text-primary text-[11px] font-bold">{t.estado}</Text>
              </View>
            </View>
            <Text className="text-xs text-slate-blue mt-1.5">
              Disponibles: <Text className="font-bold text-ink">{t.disponibles}</Text> /{' '}
              {t.total_almuerzos}
            </Text>

            <View className="flex-row gap-2 mt-3">
              {t.estado === 'PENDIENTE' ? (
                <>
                  <TouchableOpacity
                    onPress={() => handleVerCodigo(t.id)}
                    className="flex-1 bg-bg border border-border rounded-xl py-2.5 flex-row items-center justify-center gap-1.5"
                  >
                    <KeyRound size={13} color="#64829E" />
                    <Text className="text-ink font-semibold text-xs">Ver código</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReemitir(t.id)}
                    className="flex-1 bg-bg border border-border rounded-xl py-2.5 flex-row items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={13} color="#64829E" />
                    <Text className="text-ink font-semibold text-xs">Reemitir</Text>
                  </TouchableOpacity>
                </>
              ) : null}

              {t.estado === 'ACTIVA' && t.qr_token ? (
                <TouchableOpacity
                  onPress={() => onAbrirConsumo(t.qr_token)}
                  className="flex-1 bg-primary rounded-xl py-2.5 flex-row items-center justify-center gap-1.5"
                >
                  <ScanLine size={14} color="#FFFFFF" />
                  <Text className="text-white font-bold text-xs">Registrar consumo</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
