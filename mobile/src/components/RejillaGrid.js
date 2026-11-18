import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function RejillaGrid({
  cuadros = [],
  selected = [],
  onToggleSelect,
  onPressConsumed,
  readOnly = false,
}) {
  if (!cuadros.length) {
    return (
      <Text style={styles.empty}>No hay cuadros de rejilla disponibles.</Text>
    );
  }

  return (
    <View style={styles.grid}>
      {cuadros.map((item) => {
        const num = item.numero ?? item.cuadro ?? item.index;
        const isConsumed = item.estado === 'CONSUMIDO' || item.consumido === true;
        const isSelected = selected.includes(num);

        return (
          <TouchableOpacity
            key={String(num)}
            activeOpacity={readOnly ? 1 : 0.75}
            disabled={readOnly}
            onPress={() => {
              if (readOnly) return;
              if (isConsumed) {
                onPressConsumed?.(item);
              } else {
                onToggleSelect?.(num);
              }
            }}
            style={[
              styles.cell,
              isConsumed && styles.cellConsumed,
              isSelected && styles.cellSelected,
            ]}
          >
            <Text
              style={[
                styles.cellText,
                isConsumed && styles.cellTextConsumed,
                isSelected && styles.cellTextSelected,
              ]}
            >
              {num}
            </Text>
            <Text
              style={[
                styles.cellSub,
                isConsumed && styles.cellTextConsumed,
                isSelected && styles.cellTextSelected,
              ]}
            >
              {isConsumed ? 'Usado' : isSelected ? 'Selec.' : 'Libre'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: '18%',
    minWidth: 54,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  cellConsumed: {
    backgroundColor: '#E5E7EB',
    borderColor: '#CBD5E1',
  },
  cellSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cellText: { fontSize: 15, fontWeight: '700', color: colors.text },
  cellSub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  cellTextConsumed: { color: '#64748B' },
  cellTextSelected: { color: '#FFFFFF' },
  empty: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
});
