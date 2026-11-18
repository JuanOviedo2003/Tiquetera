import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../services/api';
import { colors, commonStyles } from '../theme/colors';

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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Activar Tiquetera</Text>
      <Text style={styles.subtitle}>
        Ingresa el código de 6 dígitos que te dio el restaurante y crea tu PIN personal.
      </Text>

      {!activated ? (
        <View style={commonStyles.card}>
          <Text style={styles.label}>Código de activación (6 dígitos)</Text>
          <TextInput
            value={codigo}
            onChangeText={setCodigo}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="123456"
            style={[commonStyles.input, styles.codeInput]}
          />

          <Text style={styles.label}>Nuevo PIN (6 dígitos)</Text>
          <TextInput
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            placeholder="••••••"
            style={[commonStyles.input, { marginBottom: 12 }]}
          />

          <Text style={styles.label}>Confirmar PIN</Text>
          <TextInput
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            placeholder="••••••"
            style={[commonStyles.input, { marginBottom: 16 }]}
          />

          <TouchableOpacity
            style={commonStyles.buttonPrimary}
            onPress={handleActivar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnPrimaryText}>Activar y generar QR</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[commonStyles.card, { alignItems: 'center' }]}>
          <Text style={styles.successTitle}>¡Tiquetera Activa!</Text>
          <Text style={styles.info}>
            Almuerzos disponibles: {activated.disponibles ?? activated.total_almuerzos}
          </Text>
          <View style={styles.qrBox}>
            <QRCode value={activated.qr_token || ''} size={180} />
          </View>
          <Text style={styles.tokenText}>Token: {activated.qr_token}</Text>
          <TouchableOpacity
            style={[commonStyles.buttonPrimary, { width: '100%', marginTop: 14 }]}
            onPress={() => onOpenTiquetera(activated.qr_token)}
          >
            <Text style={styles.btnPrimaryText}>Ver mi saldo e historial</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: colors.bg },
  backBtn: { marginBottom: 12 },
  backText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 18, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  codeInput: { marginBottom: 12, fontSize: 18, letterSpacing: 4, textAlign: 'center', fontWeight: '700' },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  successTitle: { fontSize: 20, fontWeight: '800', color: colors.success, marginBottom: 6 },
  info: { fontSize: 14, color: colors.text, marginBottom: 16 },
  qrBox: { padding: 14, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  tokenText: { fontSize: 11, color: colors.textMuted, marginTop: 10 },
});
