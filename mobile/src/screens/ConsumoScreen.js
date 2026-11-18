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
import { ScanLine, Camera, Search, ShieldCheck, Lock } from 'lucide-react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { extractQrToken } from '../utils/qr';
import QrScannerModal from '../components/QrScannerModal';
import RejillaGrid from '../components/RejillaGrid';
import HistorialMovimientos from '../components/HistorialMovimientos';

export default function ConsumoScreen({ initialQrToken = '', onClearInitialQr, onShowToast }) {
  const { user } = useAuth();
  const [tokenInput, setTokenInput] = useState(initialQrToken || '');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [tiquetera, setTiquetera] = useState(null);
  const [rejilla, setRejilla] = useState([]);
  const [movimientos, setMovimientos] = useState([]);

  const [pin, setPin] = useState('');
  const [pinValidado, setPinValidado] = useState(false);
  const [validatingPin, setValidatingPin] = useState(false);

  const [selectedCuadros, setSelectedCuadros] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const cargarTodo = useCallback(
    async (rawToken) => {
      const clean = extractQrToken(rawToken);
      if (!clean) {
        onShowToast?.({ type: 'error', message: 'Ingresa o escanea un QR válido' });
        return;
      }
      setLoading(true);
      try {
        const tiqRes = await api.getTiqueteraByQr(clean);
        const tiq = tiqRes.tiquetera || tiqRes;
        setTiquetera(tiq);
        setTokenInput(clean);
        setSelectedCuadros([]);

        const [rejRes, histRes] = await Promise.all([
          api.getRejilla(clean),
          api.getHistorial(tiq.id),
        ]);
        setRejilla(rejRes.cuadros || rejRes.rejilla || rejRes || []);
        setMovimientos(histRes.movimientos || histRes.historial || histRes || []);
      } catch (err) {
        onShowToast?.({ type: 'error', message: err.message || 'Error al cargar tiquetera' });
      } finally {
        setLoading(false);
      }
    },
    [onShowToast]
  );

  useEffect(() => {
    if (initialQrToken) {
      setPinValidado(false);
      setPin('');
      cargarTodo(initialQrToken);
      onClearInitialQr?.();
    }
  }, [initialQrToken, cargarTodo, onClearInitialQr]);

  const handleValidarPin = async () => {
    if (!/^\d{6}$/.test(pin)) {
      onShowToast?.({ type: 'error', message: 'El PIN debe tener 6 dígitos' });
      return;
    }
    setValidatingPin(true);
    try {
      await api.validarPin({ qr_token: tiquetera.qr_token, pin });
      setPinValidado(true);
      onShowToast?.({ type: 'success', message: 'PIN validado correctamente' });
    } catch (err) {
      setPinValidado(false);
      onShowToast?.({ type: 'error', message: err.message || 'PIN incorrecto' });
    } finally {
      setValidatingPin(false);
    }
  };

  const toggleCuadro = (num) => {
    setSelectedCuadros((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  const handleRegistrarConsumo = async () => {
    if (!selectedCuadros.length) {
      onShowToast?.({ type: 'error', message: 'Selecciona al menos un cuadro de la rejilla' });
      return;
    }
    setSubmitting(true);
    try {
      await api.registrarConsumo({
        tiquetera_id: tiquetera.id,
        pin,
        usuario_id: user?.id,
        cuadros_seleccionados: selectedCuadros,
      });
      onShowToast?.({
        type: 'success',
        message: `Consumo registrado (${selectedCuadros.length} almuerzo/s)`,
      });
      setSelectedCuadros([]);
      await cargarTodo(tiquetera.qr_token);
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'Error registrando consumo' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePressConsumed = (cuadro) => {
    if (!pinValidado) return;
    const consumoId = cuadro.consumo_id || cuadro.movimiento_id;
    const num = cuadro.numero ?? cuadro.cuadro ?? cuadro.index;
    if (!consumoId) {
      onShowToast?.({ type: 'error', message: 'Este cuadro no tiene consumo reversible asociado' });
      return;
    }
    Alert.alert(
      'Revertir consumo',
      `¿Deseas revertir el cuadro #${num} (solo consumos de hoy)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revertir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.revertirConsumo({
                consumo_id: consumoId,
                usuario_id: user?.id,
                cuadro_deseleccionado: num,
                motivo: 'Corrección desde app móvil',
              });
              onShowToast?.({ type: 'success', message: `Cuadro #${num} revertido` });
              await cargarTodo(tiquetera.qr_token);
            } catch (err) {
              onShowToast?.({ type: 'error', message: err.message || 'No se pudo revertir' });
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerClassName="p-4 pb-8" keyboardShouldPersistTaps="handled">
      <View className="flex-row items-center gap-2 mb-3">
        <ScanLine size={20} color="#FF6B47" />
        <Text className="text-xl font-semibold text-ink">Consumo por QR</Text>
      </View>

      <View className="bg-white rounded-3xl border border-border p-4 mb-3">
        <Text className="text-xs font-semibold text-ink mb-1.5">
          Escanear o ingresar token QR
        </Text>
        <TextInput
          value={tokenInput}
          onChangeText={setTokenInput}
          placeholder="Token QR del cliente"
          placeholderTextColor="#64829E"
          autoCapitalize="none"
          className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-2.5"
        />
        <View className="flex-row gap-2.5">
          <TouchableOpacity
            onPress={() => setScannerOpen(true)}
            className="flex-1 bg-bg border border-border rounded-xl py-3 flex-row items-center justify-center gap-1.5"
          >
            <Camera size={15} color="#333333" />
            <Text className="text-ink font-bold text-xs">Abrir Cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setPinValidado(false);
              setPin('');
              cargarTodo(tokenInput);
            }}
            disabled={loading}
            className="flex-1 bg-primary rounded-xl py-3 flex-row items-center justify-center gap-1.5"
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Search size={15} color="#FFFFFF" />
                <Text className="text-white font-bold text-xs">Buscar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {tiquetera ? (
        <>
          <View className="bg-white rounded-3xl border border-border p-4 mb-3">
            <Text className="text-base font-bold text-ink">
              {tiquetera.cliente?.nombre || tiquetera.cliente_nombre || 'Cliente'}
            </Text>
            <Text className="text-xs text-slate-blue mt-1">
              Disponibles: {tiquetera.disponibles} / {tiquetera.total_almuerzos} · Estado:{' '}
              {tiquetera.estado}
            </Text>

            {!pinValidado ? (
              <View className="mt-3">
                <Text className="text-xs font-semibold text-ink mb-1.5">
                  PIN del cliente (6 dígitos)
                </Text>
                <View className="flex-row gap-2.5">
                  <View className="flex-1 flex-row items-center bg-bg border border-border rounded-xl px-3">
                    <Lock size={15} color="#64829E" />
                    <TextInput
                      value={pin}
                      onChangeText={setPin}
                      keyboardType="number-pad"
                      secureTextEntry
                      maxLength={6}
                      placeholder="••••••"
                      placeholderTextColor="#64829E"
                      className="flex-1 py-2.5 pl-2 text-sm text-ink"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={handleValidarPin}
                    disabled={validatingPin}
                    className="bg-primary rounded-xl px-4 justify-center items-center"
                  >
                    {validatingPin ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text className="text-white font-bold text-xs">Validar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="flex-row items-center gap-1.5 mt-2.5">
                <ShieldCheck size={15} color="#64829E" />
                <Text className="text-slate-blue font-bold text-xs">
                  PIN verificado. Selecciona los cuadros a descontar.
                </Text>
              </View>
            )}
          </View>

          <View className="bg-white rounded-3xl border border-border p-4 mb-3">
            <Text className="text-base font-bold text-ink mb-2.5">Rejilla de almuerzos</Text>
            <RejillaGrid
              cuadros={rejilla}
              selected={selectedCuadros}
              onToggleSelect={toggleCuadro}
              onPressConsumed={handlePressConsumed}
              readOnly={!pinValidado}
            />
            {pinValidado && (
              <TouchableOpacity
                onPress={handleRegistrarConsumo}
                disabled={submitting || !selectedCuadros.length}
                className={`rounded-xl py-3.5 items-center mt-3.5 ${
                  selectedCuadros.length ? 'bg-primary' : 'bg-primary/50'
                }`}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="text-white font-bold text-xs">
                    Descontar ({selectedCuadros.length}) almuerzo(s)
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View className="bg-white rounded-3xl border border-border p-4 mb-3">
            <Text className="text-base font-bold text-ink mb-2.5">Historial de movimientos</Text>
            <HistorialMovimientos movimientos={movimientos} />
          </View>
        </>
      ) : null}

      <QrScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(token) => {
          setPinValidado(false);
          setPin('');
          cargarTodo(token);
        }}
      />
    </ScrollView>
  );
}
