import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, commonStyles } from '../theme/colors';
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

  // PIN del cliente
  const [pin, setPin] = useState('');
  const [pinValidado, setPinValidado] = useState(false);
  const [validatingPin, setValidatingPin] = useState(false);

  // Selección de cuadros
  const [selectedCuadros, setSelectedCuadros] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const cargarTodo = useCallback(async (rawToken) => {
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
  }, [onShowToast]);

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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Consumo por QR</Text>

      <View style={commonStyles.card}>
        <Text style={styles.label}>Escanear o ingresar token QR</Text>
        <TextInput
          value={tokenInput}
          onChangeText={setTokenInput}
          placeholder="Token QR del cliente"
          autoCapitalize="none"
          style={[commonStyles.input, { marginBottom: 10 }]}
        />
        <View style={styles.row}>
          <TouchableOpacity
            style={[commonStyles.buttonSecondary, { flex: 1 }]}
            onPress={() => setScannerOpen(true)}
          >
            <Text style={styles.btnSecText}>Abrir Cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[commonStyles.buttonPrimary, { flex: 1 }]}
            onPress={() => {
              setPinValidado(false);
              setPin('');
              cargarTodo(tokenInput);
            }}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnPriText}>Buscar</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {tiquetera ? (
        <>
          <View style={commonStyles.card}>
            <Text style={styles.clientName}>
              {tiquetera.cliente?.nombre || tiquetera.cliente_nombre || 'Cliente'}
            </Text>
            <Text style={styles.balance}>
              Disponibles: {tiquetera.disponibles} / {tiquetera.total_almuerzos} · Estado: {tiquetera.estado}
            </Text>

            {!pinValidado ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>PIN del cliente (6 dígitos)</Text>
                <View style={styles.row}>
                  <TextInput
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={6}
                    placeholder="••••••"
                    style={[commonStyles.input, { flex: 1 }]}
                  />
                  <TouchableOpacity
                    style={[commonStyles.buttonPrimary, { paddingHorizontal: 18 }]}
                    onPress={handleValidarPin}
                    disabled={validatingPin}
                  >
                    {validatingPin ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.btnPriText}>Validar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.pinOk}>✓ PIN verificado. Selecciona los cuadros a descontar.</Text>
            )}
          </View>

          <View style={commonStyles.card}>
            <Text style={styles.sectionTitle}>Rejilla de almuerzos</Text>
            <RejillaGrid
              cuadros={rejilla}
              selected={selectedCuadros}
              onToggleSelect={toggleCuadro}
              onPressConsumed={handlePressConsumed}
              readOnly={!pinValidado}
            />
            {pinValidado && (
              <TouchableOpacity
                style={[commonStyles.buttonPrimary, { marginTop: 14 }]}
                onPress={handleRegistrarConsumo}
                disabled={submitting || !selectedCuadros.length}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.btnPriText}>
                    Descontar ({selectedCuadros.length}) almuerzo(s)
                  </Text>
                )}
              </TouchableOpacity>
            )}
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
        onScan={(token) => {
          setPinValidado(false);
          setPin('');
          cargarTodo(token);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 10 },
  btnSecText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  btnPriText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  clientName: { fontSize: 17, fontWeight: '800', color: colors.text },
  balance: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  pinOk: { marginTop: 10, color: colors.success, fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
});
