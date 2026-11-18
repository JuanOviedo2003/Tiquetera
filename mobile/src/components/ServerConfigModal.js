import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { api, getApiBaseUrl, setApiBaseUrl } from '../services/api';

export default function ServerConfigModal({ visible, onClose, onSaved }) {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (visible) {
      setUrl(getApiBaseUrl());
      setStatusMsg('');
    }
  }, [visible]);

  const handleSaveAndTest = async () => {
    setTesting(true);
    setStatusMsg('');
    try {
      const saved = await setApiBaseUrl(url);
      await api.health();
      setStatusMsg(`Conectado correctamente a ${saved}`);
      onSaved?.(saved);
    } catch (err) {
      setStatusMsg(`Guardado, pero falló /health: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/45 justify-center p-5">
        <View className="bg-white rounded-2xl p-5 border border-border">
          <Text className="text-lg font-bold text-ink mb-1.5">URL del Backend (API)</Text>
          <Text className="text-xs text-muted mb-3.5">
            Apunta al backend desplegado en dev o a tu IP local (ej. http://192.168.1.50:3001/api).
          </Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://equipo-1-eleV-n-dev.apolobyte.online/api"
            className="bg-bg border border-border rounded-xl px-3.5 py-2.5 text-sm text-ink mb-3"
          />
          {statusMsg ? (
            <Text className="text-xs text-ink font-semibold mb-3">{statusMsg}</Text>
          ) : null}
          <View className="flex-row gap-2.5">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 bg-white border border-border rounded-xl py-3 items-center"
            >
              <Text className="text-ink font-semibold">Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveAndTest}
              disabled={testing}
              className="flex-1 bg-primary rounded-xl py-3 items-center"
            >
              {testing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="text-white font-bold">Guardar y Probar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
