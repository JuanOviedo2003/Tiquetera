import { useMemo } from 'react';
import { ArrowDownCircle, Undo2, CalendarDays } from 'lucide-react';

const formatDia = (dia) =>
  new Date(`${dia}T12:00:00Z`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

const formatHora = (iso) =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

/**
 * HU-R10: historial de consumos y reversas agrupado por día (más reciente primero).
 */
export default function HistorialMovimientos({ movimientos, fecha, onFechaChange }) {
  const grupos = useMemo(() => {
    const porDia = new Map();
    for (const m of movimientos) {
      const dia = m.fecha_hora.slice(0, 10);
      if (!porDia.has(dia)) porDia.set(dia, []);
      porDia.get(dia).push(m);
    }
    return [...porDia.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dia, items]) => ({
        dia,
        items: [...items].sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora)),
      }));
  }, [movimientos]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400 flex items-center gap-1.5" htmlFor="hist-fecha">
          <CalendarDays className="w-3.5 h-3.5" />
          Filtrar por día
        </label>
        <input
          id="hist-fecha"
          type="date"
          value={fecha}
          onChange={(e) => onFechaChange(e.target.value)}
          className="bg-[#151821] border border-[#262c38] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#e0533c]"
        />
        {fecha && (
          <button
            type="button"
            onClick={() => onFechaChange('')}
            className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
          >
            Quitar filtro
          </button>
        )}
      </div>

      {grupos.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">
          {fecha ? 'No hay movimientos ese día.' : 'Esta tiquetera aún no tiene movimientos.'}
        </p>
      ) : (
        grupos.map(({ dia, items }) => (
          <section key={dia}>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#e5a93c] mb-2 capitalize">
              {formatDia(dia)}
            </h4>
            <ul className="space-y-2">
              {items.map((m) => {
                const esReversa = m.tipo === 'REVERSA';
                const Icon = esReversa ? Undo2 : ArrowDownCircle;
                return (
                  <li
                    key={m.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border bg-[#151821] ${
                      esReversa ? 'border-emerald-500/25' : 'border-[#252a36]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        esReversa ? 'text-emerald-400' : 'text-[#e0533c]'
                      }`}
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white">
                          {esReversa ? 'Reversa' : 'Consumo'} de {m.cantidad}{' '}
                          {m.cantidad === 1 ? 'almuerzo' : 'almuerzos'}
                        </span>
                        <span className="font-mono text-slate-400">{formatHora(m.fecha_hora)}</span>
                      </div>
                      <div className="text-slate-400 mt-0.5 font-mono">
                        Saldo {m.saldo_anterior} → {m.saldo_posterior}
                        {m.cuadros_seleccionados?.length > 0 &&
                          ` · cuadros ${m.cuadros_seleccionados.join(', ')}`}
                      </div>
                      {m.motivo && <div className="text-slate-500 mt-0.5">{m.motivo}</div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
