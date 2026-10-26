import { Check, Utensils, Undo2 } from 'lucide-react';

const hoyUtc = () => new Date().toISOString().slice(0, 10);

/**
 * HU-R7: rejilla con cuadros disponibles y consumidos diferenciados.
 * HU-R8: los disponibles se seleccionan para descontar.
 * HU-R9: un cuadro consumido el mismo día se puede deseleccionar (reversa).
 * El día se compara en UTC porque es el criterio que aplica el backend.
 */
export default function RejillaGrid({ rejilla, seleccionados, onToggle, onRevertir, disabled }) {
  const hoy = hoyUtc();

  return (
    <div className="space-y-3">
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
                    ? 'bg-[#e0533c]/10 border-[#e0533c]/40 text-[#e0533c] hover:bg-[#e0533c]/20 cursor-pointer touch-press'
                    : 'bg-[#0e1015] border-[#252b36] text-slate-600 cursor-not-allowed'
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
                  ? 'bg-[#e5a93c] border-[#e5a93c] text-[#0e1015] shadow-md shadow-[#e5a93c]/20'
                  : 'bg-[#151821] border-emerald-500/30 text-emerald-300 hover:border-emerald-400'
              }`}
            >
              <span className="text-sm font-mono font-bold">{cuadro.numero}</span>
              {elegido ? (
                <Check className="w-3 h-3" />
              ) : (
                <Utensils className="w-3 h-3 opacity-60" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/50" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#e5a93c]" />
          Seleccionado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#e0533c]/30 border border-[#e0533c]/50" />
          Consumido hoy (se puede corregir)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#0e1015] border border-[#252b36]" />
          Consumido antes
        </span>
      </div>
    </div>
  );
}
