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

export default function TiqueterasScreen({ onAbrirConsumo, onShowToast }) {
  const { restauranteId } = useAuth();
  const [tiqueteras, setTiqueteras] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Crear tiquetera
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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <Text style={styles.title}>Tiqueteras</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setShowCreate((v) => !v)}
        >
          <Text style={styles.newBtnText}>{showCreate ? 'Cerrar' : '+ Nueva'}</Text>
        </TouchableOpacity>
      </View>

      {showCreate && (
        <View style={commonStyles.card}>
          <Text style={styles.cardTitle}>Crear Tiquetera</Text>
          <Text style={styles.label}>Cliente</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {clientes.map((c) => {
                const active = String(c.id) === String(clienteId);
                return (
                  <TouchableOpacity
                    key={String(c.id)}
                    onPress={() => setClienteId(String(c.id))}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {c.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <Text style={styles.label}>Cantidad de almuerzos</Text>
          <TextInput
            value={totalAlmuerzos}
            onChangeText={setTotalAlmuerzos}
            keyboardType="number-pad"
            style={[commonStyles.input, { marginBottom: 12 }]}
          />
          <TouchableOpacity
            style={commonStyles.buttonPrimary}
            onPress={handleCrear}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnPriText}>Emitir Tiquetera</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={commonStyles.card}>
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por nombre de cliente..."
          style={[commonStyles.input, { marginBottom: 10 }]}
        />
        <View style={styles.filterRow}>
          {['', 'PENDIENTE', 'ACTIVA', 'AGOTADA'].map((est) => {
            const active = filtroEstado === est;
            return (
              <TouchableOpacity
                key={est || 'TODAS'}
                onPress={() => setFiltroEstado(est)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {est || 'Todas'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : tiqueteras.length === 0 ? (
        <Text style={styles.empty}>No hay tiqueteras con estos filtros.</Text>
      ) : (
        tiqueteras.map((t) => (
          <View key={String(t.id)} style={commonStyles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.clientName}>
                {t.cliente?.nombre || t.cliente_nombre || `Cliente #${t.cliente_id}`}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t.estado}</Text>
              </View>
            </View>
            <Text style={styles.meta}>
              Disponibles: <Text style={styles.bold}>{t.disponibles}</Text> / {t.total_almuerzos}
            </Text>

            <View style={styles.actionsRow}>
              {t.estado === 'PENDIENTE' ? (
                <>
                  <TouchableOpacity
                    style={[commonStyles.buttonSecondary, { flex: 1 }]}
                    onPress={() => handleVerCodigo(t.id)}
                  >
                    <Text style={styles.btnSecText}>Ver código</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[commonStyles.buttonSecondary, { flex: 1 }]}
                    onPress={() => handleReemitir(t.id)}
                  >
                    <Text style={styles.btnSecText}>Reemitir</Text>
                  </TouchableOpacity>
                </>
              ) : null}

              {t.estado === 'ACTIVA' && t.qr_token ? (
                <TouchableOpacity
                  style={[commonStyles.buttonPrimary, { flex: 1 }]}
                  onPress={() => onAbrirConsumo(t.qr_token)}
                >
                  <Text style={styles.btnPriText}>Registrar consumo</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  newBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  newBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.text },
  chipTextActive: { color: '#FFFFFF' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clientName: { fontSize: 16, fontWeight: '700', color: colors.text },
  badge: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 6 },
  bold: { fontWeight: '700', color: colors.text },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btnPriText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  btnSecText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 24 },
});
