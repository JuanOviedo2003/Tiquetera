import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../services/api';
import { extractQrToken } from '../utils/qr';
import QrScannerModal from '../components/QrScannerModal';
import RejillaGrid from '../components/RejillaGrid';
import HistorialMovimientos from '../components/HistorialMovimientos';

export default function ClienteTiqueteraScreen({ initialQrToken = '', onBack, onShowToast }) {
  const [tokenInput, setTokenInput] = useState(initialQrToken);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const [showPinForm, setShowPinForm] = useState(false);
  const [pinAnterior, setPinAnterior] = useState('');
  const [nuevoPin, setNuevoPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  const cargarTiquetera = useCallback(
    async (rawToken) => {
      const clean = extractQrToken(rawToken);
      if (!clean) {
        onShowToast?.({ type: 'error', message: 'Ingresa o escanea un código QR válido' });
        return;
      }
      setLoading(true);
      try {
        const res = await api.getVistaPublica(clean);
        setData(res);
        setTokenInput(clean);
      } catch (err) {
        onShowToast?.({ type: 'error', message: err.message || 'No se encontró la tiquetera' });
      } finally {
        setLoading(false);
      }
    },
    [onShowToast]
  );

  useEffect(() => {
    if (initialQrToken) {
      cargarTiquetera(initialQrToken);
    }
  }, [initialQrToken, cargarTiquetera]);

  const handleRegenerarPin = async () => {
    if (!/^\d{6}$/.test(pinAnterior) || !/^\d{6}$/.test(nuevoPin)) {
      onShowToast?.({ type: 'error', message: 'Ambos PINes deben tener 6 dígitos' });
      return;
    }
    setSavingPin(true);
    try {
      await api.regenerarPin({
        qr_token: data?.tiquetera?.qr_token || tokenInput,
        pin_anterior: pinAnterior,
        nuevo_pin: nuevoPin,
      });
      setPinAnterior('');
      setNuevoPin('');
      setShowPinForm(false);
      onShowToast?.({ type: 'success', message: 'PIN actualizado correctamente' });
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'No se pudo cambiar el PIN' });
    } finally {
      setSavingPin(false);
    }
  };

  const tiquetera = data?.tiquetera || data;
  const rejilla = data?.rejilla || tiquetera?.rejilla || [];
  const movimientos = data?.movimientos || data?.historial || [];

  return (
    <ScrollView
      contentContainerClassName="flex-grow p-5 bg-bg"
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={onBack} className="mb-3">
        <Text className="text-primary font-bold text-sm">← Volver</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-extrabold text-ink">Mi Tiquetera</Text>
      <Text className="text-xs text-muted mt-1 mb-4">
        Consulta tu saldo, QR e historial de almuerzos.
      </Text>

      <View className="bg-white rounded-2xl border border-border p-4 mb-3">
        <Text className="text-xs font-semibold text-ink mb-1.5">Token o URL del QR</Text>
        <TextInput
          value={tokenInput}
          onChangeText={setTokenInput}
          placeholder="Pega el token QR o escanéalo"
          autoCapitalize="none"
          className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-2.5"
        />
        <View className="flex-row gap-2.5">
          <TouchableOpacity
            onPress={() => setScannerOpen(true)}
            className="flex-1 bg-white border border-border rounded-xl py-3 items-center"
          >
            <Text className="text-ink font-bold text-xs">Escanear QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => cargarTiquetera(tokenInput)}
            disabled={loading}
            className="flex-1 bg-primary rounded-xl py-3 items-center"
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white font-bold text-xs">Consultar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {tiquetera && tiquetera.qr_token ? (
        <>
          <View className="bg-white rounded-2xl border border-border p-4 mb-3 items-center">
            <Text className="text-lg font-extrabold text-ink">
              {tiquetera.cliente?.nombre || tiquetera.cliente_nombre || 'Cliente'}
            </Text>
            <Text className="text-sm font-bold text-primary mt-1 mb-3.5">
              {tiquetera.disponibles ?? 0} / {tiquetera.total_almuerzos ?? 0} almuerzos disponibles
            </Text>
            <View className="p-3 bg-white rounded-xl border border-border">
              <QRCode value={tiquetera.qr_token} size={150} />
            </View>
            <TouchableOpacity
              onPress={() => setShowPinForm((v) => !v)}
              className="w-full bg-white border border-border rounded-xl py-3 items-center mt-3"
            >
              <Text className="text-ink font-bold text-xs">
                {showPinForm ? 'Cancelar cambio de PIN' : 'Cambiar mi PIN'}
              </Text>
            </TouchableOpacity>
          </View>

          {showPinForm && (
            <View className="bg-white rounded-2xl border border-border p-4 mb-3">
              <Text className="text-base font-bold text-ink mb-2.5">Cambiar PIN</Text>
              <TextInput
                value={pinAnterior}
                onChangeText={setPinAnterior}
                placeholder="PIN actual (6 dígitos)"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-2.5"
              />
              <TextInput
                value={nuevoPin}
                onChangeText={setNuevoPin}
                placeholder="Nuevo PIN (6 dígitos)"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-3"
              />
              <TouchableOpacity
                onPress={handleRegenerarPin}
                disabled={savingPin}
                className="bg-primary rounded-xl py-3 items-center"
              >
                {savingPin ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="text-white font-bold text-xs">Guardar nuevo PIN</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View className="bg-white rounded-2xl border border-border p-4 mb-3">
            <Text className="text-base font-bold text-ink mb-2.5">Rejilla de almuerzos</Text>
            <RejillaGrid cuadros={rejilla} readOnly />
          </View>

          <View className="bg-white rounded-2xl border border-border p-4 mb-3">
            <Text className="text-base font-bold text-ink mb-2.5">Historial de movimientos</Text>
            <HistorialMovimientos movimientos={movimientos} />
          </View>
        </>
      ) : null}

      <QrScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(token) => cargarTiquetera(token)}
      />
    </ScrollView>
  );
}
