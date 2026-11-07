import { useMemo } from 'react';
import { CheckCircle2, Undo2, CalendarDays } from 'lucide-react';

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
 * HU-R10 & HU-C5: historial de consumos y reversas agrupado por día con la paleta del Sistema de Diseño.
 */
export default function HistorialMovimientos({ movimientos, fecha, onFechaChange }) {
  const grupos = useMemo(() => {
    const lista = fecha
      ? movimientos.filter((m) => m.fecha_hora?.slice(0, 10) === fecha)
      : movimientos;
    const porDia = new Map();
    for (const m of lista) {
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
  }, [movimientos, fecha]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-medium text-[#64829E] flex items-center gap-1.5" htmlFor="hist-fecha">
          <CalendarDays className="w-3.5 h-3.5" />
          Filtrar por día
        </label>
        <input
          id="hist-fecha"
          type="date"
          value={fecha}
          onChange={(e) => onFechaChange(e.target.value)}
          className="bg-[#F9F5F1] border border-[#E5DED4] rounded-xl px-3 py-1.5 text-xs text-[#333333] focus:outline-none focus:border-[#FF6B47]"
        />
        {fecha && (
          <button
            type="button"
            onClick={() => onFechaChange('')}
            className="text-xs font-medium text-[#64829E] hover:text-[#333333] underline cursor-pointer"
          >
            Quitar filtro
          </button>
        )}
      </div>

      {grupos.length === 0 ? (
        <p className="text-sm text-[#64829E] py-6 text-center">
          {fecha ? 'No hay movimientos registrados en esa fecha.' : 'Esta tiquetera aún no tiene movimientos.'}
        </p>
      ) : (
        grupos.map(({ dia, items }) => (
          <section key={dia}>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#64829E] mb-2 capitalize font-display">
              {formatDia(dia)}
            </h4>
            <ul className="space-y-2">
              {items.map((m) => {
                const esReversa = m.tipo === 'REVERSA';
                const Icon = esReversa ? Undo2 : CheckCircle2;
                const cuadros = m.cuadros_seleccionados || m.cuadros_afectados || [];
                const tieneSaldoAnterior =
                  m.saldo_anterior !== undefined && m.saldo_anterior !== null;
                return (
                  <li
                    key={m.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border bg-[#F9F5F1] ${
                      esReversa ? 'border-[#64829E]/40' : 'border-[#E5DED4]'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        esReversa ? 'text-[#64829E]' : 'text-[#FF6B47]'
                      }`}
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#333333]">
                          {esReversa ? 'Reversa' : 'Saldo Almuerzo'} · {m.cantidad}{' '}
                          {m.cantidad === 1 ? 'almuerzo' : 'almuerzos'}
                        </span>
                        <span className="font-mono text-[#64829E]">{formatHora(m.fecha_hora)}</span>
                      </div>
                      <div className="text-[#333333]/70 mt-0.5 font-mono">
                        {tieneSaldoAnterior
                          ? `Saldo ${m.saldo_anterior} → ${m.saldo_posterior}`
                          : `Disponibles: ${m.saldo_posterior}`}
                        {cuadros.length > 0 && ` · cuadros ${cuadros.join(', ')}`}
                      </div>
                      {m.motivo && <div className="text-[#64829E] mt-0.5">{m.motivo}</div>}
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
