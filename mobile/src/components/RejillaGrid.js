import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function RejillaGrid({
  cuadros = [],
  selected = [],
  onToggleSelect,
  onPressConsumed,
  readOnly = false,
}) {
  if (!cuadros.length) {
    return (
      <Text className="text-muted text-xs text-center py-3">
        No hay cuadros de rejilla disponibles.
      </Text>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {cuadros.map((item) => {
        const num = item.numero ?? item.cuadro ?? item.index;
        const isConsumed = item.estado === 'CONSUMIDO' || item.consumido === true;
        const isSelected = selected.includes(num);

        const cellClass = isSelected
          ? 'bg-primary border-primary'
          : isConsumed
          ? 'bg-gray-200 border-slate-300'
          : 'bg-white border-border';

        const textClass = isSelected
          ? 'text-white'
          : isConsumed
          ? 'text-slate-500'
          : 'text-ink';

        const subClass = isSelected
          ? 'text-white'
          : isConsumed
          ? 'text-slate-500'
          : 'text-muted';

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
            className={`w-[18%] min-w-[54px] aspect-square rounded-xl border-2 items-center justify-center p-1 ${cellClass}`}
          >
            <Text className={`text-sm font-bold ${textClass}`}>{num}</Text>
            <Text className={`text-[10px] mt-0.5 ${subClass}`}>
              {isConsumed ? 'Usado' : isSelected ? 'Selec.' : 'Libre'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
