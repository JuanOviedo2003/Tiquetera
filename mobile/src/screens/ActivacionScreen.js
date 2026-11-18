import React, { useState } from 'react';
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

export default function ActivacionScreen({ onBack, onOpenTiquetera, onShowToast }) {
  const [codigo, setCodigo] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(null);

  const handleActivar = async () => {
    const cleanCode = codigo.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      onShowToast?.({ type: 'error', message: 'El código de activación debe tener 6 dígitos' });
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      onShowToast?.({ type: 'error', message: 'El PIN debe tener exactamente 6 dígitos numéricos' });
      return;
    }
    if (pin !== confirmPin) {
      onShowToast?.({ type: 'error', message: 'Los PINes no coinciden' });
      return;
    }

    setLoading(true);
    try {
      const data = await api.activarTiquetera({ codigo_activacion: cleanCode, pin });
      const tiquetera = data.tiquetera || data;
      setActivated(tiquetera);
      onShowToast?.({ type: 'success', message: '¡Tiquetera activada con éxito!' });
    } catch (err) {
      onShowToast?.({ type: 'error', message: err.message || 'No se pudo activar la tiquetera' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerClassName="flex-grow p-5 bg-bg"
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={onBack} className="mb-3">
        <Text className="text-primary font-bold text-sm">← Volver</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-extrabold text-ink">Activar Tiquetera</Text>
      <Text className="text-xs text-muted mt-1 mb-4">
        Ingresa el código de 6 dígitos que te dio el restaurante y crea tu PIN personal.
      </Text>

      {!activated ? (
        <View className="bg-white rounded-2xl border border-border p-4">
          <Text className="text-xs font-semibold text-ink mb-1.5">
            Código de activación (6 dígitos)
          </Text>
          <TextInput
            value={codigo}
            onChangeText={setCodigo}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="123456"
            className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-lg font-bold text-center tracking-widest text-ink mb-3"
          />

          <Text className="text-xs font-semibold text-ink mb-1.5">Nuevo PIN (6 dígitos)</Text>
          <TextInput
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            placeholder="••••••"
            className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-3"
          />

          <Text className="text-xs font-semibold text-ink mb-1.5">Confirmar PIN</Text>
          <TextInput
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            placeholder="••••••"
            className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-4"
          />

          <TouchableOpacity
            onPress={handleActivar}
            disabled={loading}
            className="bg-primary rounded-xl py-3.5 items-center"
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text className="text-white font-bold text-sm">Activar y generar QR</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View className="bg-white rounded-2xl border border-border p-5 items-center">
          <Text className="text-xl font-extrabold text-green-600 mb-1.5">¡Tiquetera Activa!</Text>
          <Text className="text-sm text-ink mb-4">
            Almuerzos disponibles: {activated.disponibles ?? activated.total_almuerzos}
          </Text>
          <View className="p-3.5 bg-white rounded-2xl border border-border">
            <QRCode value={activated.qr_token || ''} size={180} />
          </View>
          <Text className="text-[11px] text-muted mt-2.5">Token: {activated.qr_token}</Text>
          <TouchableOpacity
            onPress={() => onOpenTiquetera(activated.qr_token)}
            className="w-full bg-primary rounded-xl py-3.5 items-center mt-4"
          >
            <Text className="text-white font-bold text-sm">Ver mi saldo e historial</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
