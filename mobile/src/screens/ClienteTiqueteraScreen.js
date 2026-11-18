import React, { useState, useEffect, useCallback } from 'react';
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
import { extractQrToken } from '../utils/qr';
import QrScannerModal from '../components/QrScannerModal';
import RejillaGrid from '../components/RejillaGrid';
import HistorialMovimientos from '../components/HistorialMovimientos';

export default function ClienteTiqueteraScreen({ initialQrToken = '', onBack, onShowToast }) {
  const [tokenInput, setTokenInput] = useState(initialQrToken);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  // Regenerar PIN
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinAnterior, setPinAnterior] = useState('');
  const [nuevoPin, setNuevoPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  const cargarTiquetera = useCallback(async (rawToken) => {
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
  }, [onShowToast]);

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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Mi Tiquetera</Text>
      <Text style={styles.subtitle}>Consulta tu saldo, QR e historial de almuerzos.</Text>

      <View style={commonStyles.card}>
        <Text style={styles.label}>Token o URL del QR</Text>
        <TextInput
          value={tokenInput}
          onChangeText={setTokenInput}
          placeholder="Pega el token QR o escanéalo"
          autoCapitalize="none"
          style={[commonStyles.input, { marginBottom: 10 }]}
        />
        <View style={styles.row}>
          <TouchableOpacity
            style={[commonStyles.buttonSecondary, { flex: 1 }]}
            onPress={() => setScannerOpen(true)}
          >
            <Text style={styles.btnSecText}>Escanear QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[commonStyles.buttonPrimary, { flex: 1 }]}
            onPress={() => cargarTiquetera(tokenInput)}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnPriText}>Consultar</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {tiquetera && tiquetera.qr_token ? (
        <>
          <View style={[commonStyles.card, { alignItems: 'center' }]}>
            <Text style={styles.clientName}>
              {tiquetera.cliente?.nombre || tiquetera.cliente_nombre || 'Cliente'}
            </Text>
            <Text style={styles.balance}>
              {tiquetera.disponibles ?? 0} / {tiquetera.total_almuerzos ?? 0} almuerzos disponibles
            </Text>
            <View style={styles.qrWrap}>
              <QRCode value={tiquetera.qr_token} size={150} />
            </View>
            <TouchableOpacity
              style={[commonStyles.buttonSecondary, { width: '100%', marginTop: 12 }]}
              onPress={() => setShowPinForm((v) => !v)}
            >
              <Text style={styles.btnSecText}>
                {showPinForm ? 'Cancelar cambio de PIN' : 'Cambiar mi PIN'}
              </Text>
            </TouchableOpacity>
          </View>

          {showPinForm && (
            <View style={commonStyles.card}>
              <Text style={styles.sectionTitle}>Cambiar PIN</Text>
              <TextInput
                value={pinAnterior}
                onChangeText={setPinAnterior}
                placeholder="PIN actual (6 dígitos)"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                style={[commonStyles.input, { marginBottom: 10 }]}
              />
              <TextInput
                value={nuevoPin}
                onChangeText={setNuevoPin}
                placeholder="Nuevo PIN (6 dígitos)"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                style={[commonStyles.input, { marginBottom: 12 }]}
              />
              <TouchableOpacity
                style={commonStyles.buttonPrimary}
                onPress={handleRegenerarPin}
                disabled={savingPin}
              >
                {savingPin ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnPriText}>Guardar nuevo PIN</Text>}
              </TouchableOpacity>
            </View>
          )}

          <View style={commonStyles.card}>
            <Text style={styles.sectionTitle}>Rejilla de almuerzos</Text>
            <RejillaGrid cuadros={rejilla} readOnly />
          </View>

          <View style={commonStyles.card}>
            <Text style={styles.sectionTitle}>Historial de movimientos</Text>
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

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: colors.bg },
  backBtn: { marginBottom: 12 },
  backText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 16, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 10 },
  btnSecText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  btnPriText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  clientName: { fontSize: 18, fontWeight: '800', color: colors.text },
  balance: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 4, marginBottom: 14 },
  qrWrap: { padding: 12, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
});
