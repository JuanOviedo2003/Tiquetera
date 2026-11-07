import { Check, Utensils, Undo2 } from 'lucide-react';

const hoyUtc = () => new Date().toISOString().slice(0, 10);

/**
 * HU-R7: rejilla con cuadros disponibles y consumidos diferenciados con la paleta del Sistema de Diseño.
 * HU-R8: los disponibles se seleccionan para descontar.
 * HU-R9: un cuadro consumido el mismo día se puede deseleccionar (reversa).
 */
export default function RejillaGrid({ rejilla, seleccionados, onToggle, onRevertir, disabled }) {
  const hoy = hoyUtc();

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {rejilla.map((cuadro) => {
          const consumido = cuadro.estado === 'consumido';
          const esDeHoy = consumido && cuadro.fechaConsumo?.slice(0, 10) === hoy;
          const elegido = seleccionados.includes(cuadro.numero);
          const fecha = cuadro.fechaConsumo
            ? new Date(cuadro.fechaConsumo).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'short',
              })
            : null;

          if (consumido) {
            return (
              <button
                key={cuadro.numero}
                type="button"
                disabled={!esDeHoy || disabled}
                onClick={() => onRevertir(cuadro)}
                title={
                  esDeHoy
                    ? `Almuerzo ${cuadro.numero} consumido hoy: toca para corregirlo`
                    : `Almuerzo ${cuadro.numero} consumido el ${fecha}`
                }
                className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${
                  esDeHoy
                    ? 'bg-[#FF6B47]/15 border-[#FF6B47]/50 text-[#FF6B47] hover:bg-[#FF6B47]/25 cursor-pointer touch-press'
                    : 'bg-[#F9F5F1] border-[#E5DED4] text-[#333333]/40 cursor-not-allowed'
                }`}
              >
                <span className="text-sm font-mono font-bold line-through">{cuadro.numero}</span>
                <span className="text-[9px] font-mono leading-none">{fecha}</span>
                {esDeHoy && <Undo2 className="absolute top-1 right-1 w-2.5 h-2.5" />}
              </button>
            );
          }

          return (
            <button
              key={cuadro.numero}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(cuadro.numero)}
              title={`Almuerzo ${cuadro.numero} disponible`}
              className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer touch-press ${
                elegido
                  ? 'bg-[#FF6B47] border-[#FF6B47] text-white shadow-md shadow-[#FF6B47]/25'
                  : 'bg-white border-[#64829E]/45 text-[#64829E] hover:bg-[#64829E]/10 hover:border-[#64829E]'
              }`}
            >
              <span className="text-sm font-mono font-bold">{cuadro.numero}</span>
              {elegido ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Utensils className="w-3 h-3 opacity-80" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-[#333333]/75 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#64829E]/20 border border-[#64829E]" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#FF6B47]" />
          Seleccionado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#FF6B47]/25 border border-[#FF6B47]" />
          Consumido hoy (corregible)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#F9F5F1] border border-[#D6CEC2]" />
          Consumido antes
        </span>
      </div>
    </div>
  );
}
