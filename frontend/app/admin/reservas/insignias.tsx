import type { ReservaUI } from "@/lib/adaptadores";
import type { EstadoPago } from "@/lib/api";

const ETIQUETAS_ESTADO_PAGO: Record<EstadoPago, string> = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  ANULADO: "Anulado",
};

const CLASES_ESTADO_PAGO: Record<EstadoPago, string> = {
  PENDIENTE: "border-neutral-800 bg-neutral-100 text-neutral-800",
  PAGADO: "border-neutral-800 bg-neutral-900 text-white",
  ANULADO: "border-neutral-400 bg-neutral-200 text-neutral-600",
};

/** El backend no devuelve el nombre del socio: se muestra su id abreviado. */
export function etiquetaSocio(usuarioId: string): string {
  return usuarioId.length > 8 ? `${usuarioId.slice(0, 8)}…` : usuarioId;
}

export function InsigniaEstadoPago({ estado }: { estado: EstadoPago }) {
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${CLASES_ESTADO_PAGO[estado]}`}
    >
      {ETIQUETAS_ESTADO_PAGO[estado]}
    </span>
  );
}

export function InsigniaEstadoReserva({
  estado,
}: {
  estado: ReservaUI["estado"];
}) {
  if (estado === "cancelada") {
    return (
      <span className="inline-block rounded border border-neutral-400 bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
        Cancelada
      </span>
    );
  }
  return (
    <span className="inline-block rounded border border-neutral-800 bg-white px-2 py-0.5 text-xs font-medium text-neutral-900">
      Confirmada
    </span>
  );
}
