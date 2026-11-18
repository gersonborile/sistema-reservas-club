import type { ReservaUI } from "@/lib/adaptadores";

type Props = {
  reservas: ReservaUI[];
};

export default function TarjetaReservasHoy({ reservas }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold tracking-tight text-slate-900">
        Reservas de hoy
      </h2>

      {reservas.length === 0 ? (
        <p className="text-sm text-slate-500">No hay reservas para hoy</p>
      ) : (
        <ul>
          {reservas.map((reserva, indice) => (
            <li
              key={reserva.id}
              className={`flex items-center justify-between gap-3 py-3 ${
                indice > 0 ? "border-t border-slate-100" : ""
              }`}
            >
              <span className="text-sm font-semibold text-slate-900">{reserva.hora}</span>
              <span className="text-sm text-slate-600">{reserva.canchaNombre}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}