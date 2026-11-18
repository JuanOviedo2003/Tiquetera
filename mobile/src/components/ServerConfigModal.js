import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, commonStyles } from '../theme/colors';
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
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>URL del Backend (API)</Text>
          <Text style={styles.subtitle}>
            Apunta al backend desplegado en dev o a tu IP local (ej. http://192.168.1.50:3001/api).
          </Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://equipo-1-eleV-n-dev.apolobyte.online/api"
            style={[commonStyles.input, { marginBottom: 12 }]}
          />
          {statusMsg ? <Text style={styles.status}>{statusMsg}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity style={[commonStyles.buttonSecondary, { flex: 1 }]} onPress={onClose}>
              <Text style={styles.btnSecText}>Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[commonStyles.buttonPrimary, { flex: 1 }]}
              onPress={handleSaveAndTest}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnPriText}>Guardar y Probar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 14 },
  status: { fontSize: 12, color: colors.text, marginBottom: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10 },
  btnSecText: { color: colors.text, fontWeight: '600' },
  btnPriText: { color: '#FFFFFF', fontWeight: '700' },
});
