import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function HistorialMovimientos({ movimientos = [] }) {
  if (!movimientos.length) {
    return (
      <Text style={styles.empty}>Aún no hay movimientos registrados.</Text>
    );
  }

  return (
    <View style={styles.list}>
      {movimientos.map((mov, idx) => {
        const isReversa = mov.tipo === 'REVERSA';
        const fecha = mov.created_at || mov.fecha || mov.createdAt;
        const fechaStr = fecha ? new Date(fecha).toLocaleString('es-CO') : '';

        return (
          <View key={mov.id || String(idx)} style={styles.item}>
            <View style={styles.rowBetween}>
              <View
                style={[
                  styles.badge,
                  isReversa ? styles.badgeReversa : styles.badgeConsumo,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    isReversa ? styles.textReversa : styles.textConsumo,
                  ]}
                >
                  {mov.tipo || 'CONSUMO'}
                </Text>
              </View>
              <Text style={styles.date}>{fechaStr}</Text>
            </View>
            <Text style={styles.detail}>
              Cantidad: <Text style={styles.bold}>{mov.cantidad}</Text> · Saldo:{' '}
              {mov.saldo_anterior} → <Text style={styles.bold}>{mov.saldo_posterior}</Text>
            </Text>
            {mov.motivo ? <Text style={styles.motivo}>Motivo: {mov.motivo}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  item: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeConsumo: { backgroundColor: colors.primaryLight },
  badgeReversa: { backgroundColor: colors.warningBg },
  badgeText: { fontSize: 11, fontWeight: '700' },
  textConsumo: { color: colors.primary },
  textReversa: { color: colors.warning },
  date: { fontSize: 11, color: colors.textMuted },
  detail: { fontSize: 13, color: colors.text },
  bold: { fontWeight: '700' },
  motivo: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  empty: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
});
