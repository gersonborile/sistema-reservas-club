import type { Reserva } from "@/lib/mock-reservas";

type Props = {
  reservas: Reserva[];
};

export default function TarjetaReservasHoy({ reservas }: Props) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="mb-4 text-base font-semibold text-neutral-900">
        Reservas de hoy
      </h2>

      {reservas.length === 0 ? (
        <p className="text-sm text-neutral-500">No hay reservas para hoy</p>
      ) : (
        <ul>
          {reservas.map((reserva, indice) => (
            <li
              key={reserva.id}
              className={`flex items-center justify-between gap-3 py-3 ${
                indice > 0 ? "border-t border-neutral-200" : ""
              }`}
            >
              <span className="font-bold text-neutral-900">{reserva.hora}</span>
              <span className="text-neutral-700">{reserva.canchaNombre}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}