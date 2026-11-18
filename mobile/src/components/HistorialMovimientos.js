import React from 'react';
import { View, Text } from 'react-native';

export default function HistorialMovimientos({ movimientos = [] }) {
  if (!movimientos.length) {
    return (
      <Text className="text-muted text-xs text-center py-3">
        Aún no hay movimientos registrados.
      </Text>
    );
  }

  return (
    <View className="gap-2">
      {movimientos.map((mov, idx) => {
        const isReversa = mov.tipo === 'REVERSA';
        const fecha = mov.created_at || mov.fecha || mov.createdAt;
        const fechaStr = fecha ? new Date(fecha).toLocaleString('es-CO') : '';

        return (
          <View
            key={mov.id || String(idx)}
            className="bg-bg rounded-xl border border-border p-3"
          >
            <View className="flex-row justify-between items-center mb-1">
              <View
                className={`px-2 py-0.5 rounded-lg ${
                  isReversa ? 'bg-amber-100' : 'bg-primary-light'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    isReversa ? 'text-amber-700' : 'text-primary'
                  }`}
                >
                  {mov.tipo || 'CONSUMO'}
                </Text>
              </View>
              <Text className="text-[11px] text-muted">{fechaStr}</Text>
            </View>
            <Text className="text-xs text-ink">
              Cantidad: <Text className="font-bold">{mov.cantidad}</Text> · Saldo:{' '}
              {mov.saldo_anterior} → <Text className="font-bold">{mov.saldo_posterior}</Text>
            </Text>
            {mov.motivo ? (
              <Text className="text-xs text-muted mt-1">Motivo: {mov.motivo}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
